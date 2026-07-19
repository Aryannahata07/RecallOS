import { Client } from 'typesense';
import { prisma } from '../database/db';
import { generateEmbedding } from '../queue/extractor';

const host = process.env.TYPESENSE_HOST || 'localhost';
const port = parseInt(process.env.TYPESENSE_PORT || '8108', 10);
const protocol = process.env.TYPESENSE_PROTOCOL || 'http';
const apiKey = process.env.TYPESENSE_API_KEY || 'xyz123api';

export const typesenseClient = new Client({
  nodes: [
    {
      host,
      port,
      protocol,
    },
  ],
  apiKey,
  connectionTimeoutSeconds: 5,
});

export const CONCEPTS_COLLECTION = 'concepts';

export interface TypesenseConceptDocument {
  id: string;
  name: string;
  description: string;
  embedding: number[];
}

/**
 * Ensures the 'concepts' collection schema is initialized in Typesense.
 */
export const reindexAllConcepts = async () => {
  console.log('[Typesense] Starting automatic re-indexing of all concepts from Postgres...');
  try {
    const concepts = await prisma.concept.findMany({
      select: {
        id: true,
        name: true,
        description: true,
      },
    });

    console.log(`[Typesense] Found ${concepts.length} concepts to index.`);
    let indexedCount = 0;

    for (const concept of concepts) {
      try {
        const textToEmbed = `${concept.name}: ${concept.description}`;
        const embedding = await generateEmbedding(textToEmbed);

        if (embedding && embedding.length > 0) {
          await typesenseClient
            .collections(CONCEPTS_COLLECTION)
            .documents()
            .upsert({
              id: concept.id,
              name: concept.name,
              description: concept.description,
              embedding,
            });
          indexedCount++;
        }
      } catch (innerError: any) {
        console.error(`[Typesense] Failed to index concept ${concept.id}:`, innerError.message || innerError);
      }
    }
    console.log(`[Typesense] Automatic re-indexing completed. Indexed ${indexedCount} of ${concepts.length} concepts.`);
  } catch (error: any) {
    console.error('[Typesense] Critical error during automatic re-indexing:', error.message || error);
  }
};

export const setupTypesenseSchema = async () => {
  try {
    await typesenseClient.collections(CONCEPTS_COLLECTION).retrieve();
    console.log('[Typesense] Schema already initialized');
  } catch (error: any) {
    // If retrieval fails with 404, we create it
    if (error.httpStatus === 404 || error.status === 404 || error.message?.toLowerCase().includes('not found')) {
      console.log('[Typesense] Creating concepts collection schema...');
      await typesenseClient.collections().create({
        name: CONCEPTS_COLLECTION,
        fields: [
          { name: 'id', type: 'string' },
          { name: 'name', type: 'string' },
          { name: 'description', type: 'string' },
          {
            name: 'embedding',
            type: 'float[]',
            num_dim: 768, // Match Gemini's text-embedding-004 size (768 dimensions)
            index: true,
            vec_dist: 'cosine',
          },
        ],
      });
      console.log('[Typesense] Schema created successfully');
      
      // Asynchronously trigger re-indexing in the background
      reindexAllConcepts().catch(err => {
        console.error('[Typesense] Background re-indexing failed:', err);
      });
    } else {
      console.error('[Typesense] Error retrieving schema:', error);
      throw error;
    }
  }
};

export interface SearchConceptResult {
  id: string;
  name: string;
  description: string;
  score: number;
}

/**
 * Searches for a semantically similar concept inside Typesense.
 * Cosine distance = 1 - similarity. Hence, similarity = 1 - distance.
 */
export const findSimilarConcept = async (
  embedding: number[],
  threshold = 0.85
): Promise<SearchConceptResult | null> => {
  try {
    const searchResults = await typesenseClient
      .collections(CONCEPTS_COLLECTION)
      .documents()
      .search({
        q: '*',
        vector_query: `embedding:([${embedding.join(',')}], k:1)`,
      });

    if (searchResults.hits && searchResults.hits.length > 0) {
      const hit = searchResults.hits[0] as any;
      const vectorDistance = hit.vector_distance ?? 1.0;
      const similarity = 1.0 - vectorDistance;

      if (similarity >= threshold) {
        return {
          id: hit.document.id,
          name: hit.document.name,
          description: hit.document.description,
          score: similarity,
        };
      }
    }
    return null;
  } catch (error) {
    console.error('[Typesense] Vector similarity search failed:', error);
    return null;
  }
};

/**
 * Indexes/upserts a concept document in Typesense.
 */
export const indexConcept = async (concept: TypesenseConceptDocument): Promise<void> => {
  try {
    await setupTypesenseSchema();
    await typesenseClient
      .collections(CONCEPTS_COLLECTION)
      .documents()
      .upsert(concept);
  } catch (error: any) {
    console.warn('[Typesense Index Warning]:', error.message || error);
  }
};
