import { Job } from 'bullmq';
import { ConceptIngestionJobPayload } from './queue';
import { extractConceptsAndCards, generateEmbedding } from './extractor';
import { findSimilarConcept, indexConcept } from '../search/typesense';
import { prisma } from '../database/db';

export const processIngestionJob = async (job: Job<ConceptIngestionJobPayload>) => {
  const { url, title, type, rawContent } = job.data;
  
  // 1. Ensure the Source exists in the Database
  const source = await prisma.source.upsert({
    where: { url },
    update: {},
    create: {
      url,
      title,
      type,
      rawContent
    }
  });

  console.log(`[Processor] Extracting concepts from ${url}...`);
  // 2. Extract concepts and flashcards via the LLM
  const extractedConcepts = await extractConceptsAndCards(rawContent, type);
  console.log(`[Processor] Found ${extractedConcepts.length} concepts.`);

  // 3. Process each concept using Semantic Deduplication (Phase 3)
  for (const extracted of extractedConcepts) {
    let conceptId: string | undefined;
    
    // Check for an exact name match first to save LLM/Vector calls
    const exactMatch = await prisma.concept.findUnique({ where: { name: extracted.name } });

    if (exactMatch) {
      conceptId = exactMatch.id;
      console.log(`[Processor] Found exact database match for concept: ${extracted.name}`);
    } else {
      console.log(`[Processor] Generating embedding for semantic check: ${extracted.name}`);
      const embedding = await generateEmbedding(`${extracted.name}: ${extracted.description}`);
      
      // Query Typesense for concepts with cosine similarity >= 0.85
      const similar = await findSimilarConcept(embedding);

      if (similar) {
        console.log(`[Processor] Found semantic match in Typesense: ${similar.name} (Score: ${similar.score})`);
        conceptId = similar.id;
      } else {
        console.log(`[Processor] Creating new concept: ${extracted.name}`);
        // Insert new Concept and Cards into Postgres
        const newConcept = await prisma.concept.create({
          data: {
            name: extracted.name,
            description: extracted.description,
            cards: {
              create: extracted.cards.map(card => ({
                question: card.question,
                answer: card.answer,
                difficulty: 5.0, // Default FSRS difficulty
                stability: 2.0,  // Default FSRS stability
              }))
            }
          }
        });
        conceptId = newConcept.id;

        // Upsert the vector data into Typesense
        await indexConcept({
          id: conceptId,
          name: extracted.name,
          description: extracted.description,
          embedding
        });
      }
    }

    // Link the parsed Source to the resolved Concept in the DB
    await prisma.concept.update({
      where: { id: conceptId },
      data: {
        sources: {
          connect: { id: source.id }
        }
      }
    });
  }
};
