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

    // Quick exact name match first — scoped to user
    const exactMatch = await prisma.concept.findUnique({
      where: { name_userId: { name: extracted.name, userId } }
    });

    if (exactMatch) {
      conceptId = exactMatch.id;
      // Update the blueprint & connect source
      await prisma.concept.update({
        where: { id: conceptId },
        data: {
          keyPrinciples: extracted.keyPrinciples,
          pitfalls: extracted.pitfalls,
          mentalModels: extracted.mentalModels,
          sources: { connect: { id: source.id } },
        }
      });
      console.log(`[Processor] Updated existing concept: ${extracted.name}`);
    } else {
      console.log(`[Processor] Generating embedding for: ${extracted.name}`);
      let embedding: number[] = [];
      try {
        embedding = await generateEmbedding(`${extracted.name}: ${extracted.description}`);
      } catch (embErr) {
        console.warn(`[Processor] Embedding generation warning for ${extracted.name}:`, embErr);
      }

      if (embedding.length > 0) {
        const similar = await findSimilarConcept(embedding);
        if (similar) {
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
                sources: { connect: { id: source.id } },
              }
            });
            console.log(`[Processor] Merged into similar concept: ${similar.name}`);
          }
        }
      }

      if (!conceptId) {
        try {
          // Brand new concept — create it with source attached immediately
          const newConcept = await prisma.concept.create({
            data: {
              name: extracted.name,
              description: extracted.description,
              keyPrinciples: extracted.keyPrinciples,
              pitfalls: extracted.pitfalls,
              mentalModels: extracted.mentalModels,
              difficulty: 0.3,
              stability: 1.0,
              userId,
              sources: {
                connect: { id: source.id }
              }
            }
          });
          conceptId = newConcept.id;

          if (embedding.length > 0) {
            await indexConcept({
              id: newConcept.id,
              name: extracted.name,
              description: extracted.description,
              embedding
            });
          }
          console.log(`[Processor] Created new concept with linked source: ${extracted.name}`);
        } catch (err: any) {
          // Handle concurrency race conditions where the concept might have been created
          // by another job between the findUnique check and this create call.
          if (err.code === 'P2002') {
            console.log(`[Processor] Concept already exists (concurrency race), updating: ${extracted.name}`);
            const existing = await prisma.concept.findUnique({
              where: { name_userId: { name: extracted.name, userId } }
            });
            if (existing) {
              conceptId = existing.id;
              await prisma.concept.update({
                where: { id: conceptId },
                data: {
                  keyPrinciples: extracted.keyPrinciples,
                  pitfalls: extracted.pitfalls,
                  mentalModels: extracted.mentalModels,
                  sources: { connect: { id: source.id } },
                }
              });
            }
          } else {
            throw err;
          }
        }
      }
    }
  }
  console.log(`[Processor] Done processing ${url}`);
};
