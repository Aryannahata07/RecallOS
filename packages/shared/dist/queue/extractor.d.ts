export interface ExtractedCard {
    question: string;
    answer: string;
}
export interface ExtractedConcept {
    name: string;
    description: string;
    cards: ExtractedCard[];
}
/**
 * Extracts key technical concepts and flashcards in JSON format from raw scraped pages/logs.
 * Compatible with Gemini Free Tier, local Ollama models, and OpenAI.
 */
export declare const extractConceptsAndCards: (rawContent: string, contentType: string) => Promise<ExtractedConcept[]>;
/**
 * Generates vector embeddings for a concept to enable semantic matching.
 * Uses text-embedding-004 on Gemini, nomic-embed-text on Ollama, or text-embedding-3-small on OpenAI.
 */
export declare const generateEmbedding: (text: string) => Promise<number[]>;
