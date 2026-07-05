export interface ExtractedConcept {
    name: string;
    description: string;
    keyPrinciples: string[];
    pitfalls: string[];
    mentalModels: string;
}
export declare const extractConceptsAndCards: (rawContent: string, contentType: string) => Promise<ExtractedConcept[]>;
export declare const generateEmbedding: (text: string) => Promise<number[]>;
