import { Job } from 'bullmq';
import { ConceptIngestionJobPayload } from './queue';
import { extractConceptsAndCards, generateEmbedding } from './extractor';
import { findSimilarConcept, indexConcept } from '../search/typesense';
import { prisma } from '../database/db';

export const processIngestionJob = async (job: Job<ConceptIngestionJobPayload>) => {
  const { url, title, type, rawContent, userId } = job.data;

  // 1. Ensure the Source exists in the database (scoped to this user)
  const source = await prisma.source.upsert({
    where: { url_userId: { url, userId } },
    update: { rawContent },
    create: { url, title, type, rawContent, userId }
  });

  console.log(`[Processor] Extracting concepts from ${url}...`);
  // 2. Extract Knowledge Blueprints via the LLM
  const extractedConcepts = await extractConceptsAndCards(rawContent, type);
  console.log(`[Processor] Found ${extractedConcepts.length} concepts.`);

  // 3. Process each concept with Semantic Deduplication
  for (const extracted of extractedConcepts) {
    let conceptId: string | undefined;

    // Quick exact name match first — scoped to user (saves embedding API calls)
    const exactMatch = await prisma.concept.findUnique({
      where: { name_userId: { name: extracted.name, userId } }
    });

    if (exactMatch) {
      conceptId = exactMatch.id;
      // Update the blueprint with new info from this source
      await prisma.concept.update({
        where: { id: conceptId },
        data: {
          keyPrinciples: extracted.keyPrinciples,
          pitfalls: extracted.pitfalls,
          mentalModels: extracted.mentalModels,
        }
      });
      console.log(`[Processor] Updated existing concept: ${extracted.name}`);
    } else {
      console.log(`[Processor] Generating embedding for: ${extracted.name}`);
      const embedding = await generateEmbedding(`${extracted.name}: ${extracted.description}`);
      const similar = await findSimilarConcept(embedding);

      if (similar) {
        // Semantically similar concept found — merge into it (only if it belongs to this user)
        const similarConcept = await prisma.concept.findFirst({
          where: { id: similar.id, userId }
        });
        if (similarConcept) {
          conceptId = similarConcept.id;
          await prisma.concept.update({
            where: { id: conceptId },
            data: {
              keyPrinciples: extracted.keyPrinciples,
              pitfalls: extracted.pitfalls,
              mentalModels: extracted.mentalModels,
            }
          });
          console.log(`[Processor] Merged into similar concept: ${similar.name}`);
        }
      }

      if (!conceptId) {
        // Brand new concept — create it with the full Knowledge Blueprint
        const newConcept = await prisma.concept.create({
          data: {
            name: extracted.name,
            description: extracted.description,
            keyPrinciples: extracted.keyPrinciples,
            pitfalls: extracted.pitfalls,
            mentalModels: extracted.mentalModels,
            // FSRS defaults — will be updated on first review
            difficulty: 0.3,
            stability: 1.0,
            userId,
          }
        });
        conceptId = newConcept.id;

        await indexConcept({
          id: conceptId,
          name: extracted.name,
          description: extracted.description,
          embedding
        });
        console.log(`[Processor] Created new concept: ${extracted.name}`);
      }
    }

    // Always link the source to the resolved concept
    await prisma.concept.update({
      where: { id: conceptId },
      data: { sources: { connect: { id: source.id } } }
    });
  }
  console.log(`[Processor] Done processing ${url}`);
};
