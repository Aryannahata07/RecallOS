"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.indexConcept = exports.findSimilarConcept = exports.setupTypesenseSchema = exports.CONCEPTS_COLLECTION = exports.typesenseClient = void 0;
const typesense_1 = require("typesense");
const host = process.env.TYPESENSE_HOST || 'localhost';
const port = parseInt(process.env.TYPESENSE_PORT || '8108', 10);
const protocol = process.env.TYPESENSE_PROTOCOL || 'http';
const apiKey = process.env.TYPESENSE_API_KEY || 'xyz123api';
exports.typesenseClient = new typesense_1.Client({
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
exports.CONCEPTS_COLLECTION = 'concepts';
/**
 * Ensures the 'concepts' collection schema is initialized in Typesense.
 */
const setupTypesenseSchema = async () => {
    try {
        await exports.typesenseClient.collections(exports.CONCEPTS_COLLECTION).retrieve();
        console.log('[Typesense] Schema already initialized');
    }
    catch (error) {
        // If retrieval fails with 404, we create it
        if (error.status === 404 || error.message?.includes('not found')) {
            console.log('[Typesense] Creating concepts collection schema...');
            await exports.typesenseClient.collections().create({
                name: exports.CONCEPTS_COLLECTION,
                fields: [
                    { name: 'id', type: 'string' },
                    { name: 'name', type: 'string' },
                    { name: 'description', type: 'string' },
                    {
                        name: 'embedding',
                        type: 'float[]',
                        num_dim: 1536, // Standard OpenAI text-embedding-3-small dimension
                        index: true,
                        vec_dist: 'cosine',
                    },
                ],
            });
            console.log('[Typesense] Schema created successfully');
        }
        else {
            console.error('[Typesense] Error retrieving schema:', error);
            throw error;
        }
    }
};
exports.setupTypesenseSchema = setupTypesenseSchema;
/**
 * Searches for a semantically similar concept inside Typesense.
 * Cosine distance = 1 - similarity. Hence, similarity = 1 - distance.
 */
const findSimilarConcept = async (embedding, threshold = 0.85) => {
    try {
        const searchResults = await exports.typesenseClient
            .collections(exports.CONCEPTS_COLLECTION)
            .documents()
            .search({
            q: '*',
            vector_query: `embedding:([${embedding.join(',')}], k:1)`,
        });
        if (searchResults.hits && searchResults.hits.length > 0) {
            const hit = searchResults.hits[0];
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
    }
    catch (error) {
        console.error('[Typesense] Vector similarity search failed:', error);
        return null;
    }
};
exports.findSimilarConcept = findSimilarConcept;
/**
 * Indexes/upserts a concept document in Typesense.
 */
const indexConcept = async (concept) => {
    await exports.typesenseClient
        .collections(exports.CONCEPTS_COLLECTION)
        .documents()
        .upsert(concept);
};
exports.indexConcept = indexConcept;
