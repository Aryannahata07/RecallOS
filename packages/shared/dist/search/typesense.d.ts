import { Client } from 'typesense';
export declare const typesenseClient: Client;
export declare const CONCEPTS_COLLECTION = "concepts";
export interface TypesenseConceptDocument {
    id: string;
    name: string;
    description: string;
    embedding: number[];
}
/**
 * Ensures the 'concepts' collection schema is initialized in Typesense.
 */
export declare const reindexAllConcepts: () => Promise<void>;
export declare const setupTypesenseSchema: () => Promise<void>;
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
export declare const findSimilarConcept: (embedding: number[], threshold?: number) => Promise<SearchConceptResult | null>;
/**
 * Indexes/upserts a concept document in Typesense.
 */
export declare const indexConcept: (concept: TypesenseConceptDocument) => Promise<void>;
