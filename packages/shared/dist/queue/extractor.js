"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateEmbedding = exports.extractConceptsAndCards = void 0;
const generative_ai_1 = require("@google/generative-ai");
const openai_1 = __importDefault(require("openai"));
// ─── Prompt ───────────────────────────────────────────────────────────────────
const EXTRACTION_PROMPT = (rawContent, contentType) => `
You are an expert technical tutor building a "Knowledge Blueprint" for a spaced-repetition learning system.

Analyze the following raw content from a source of type "${contentType}".
Identify ALL distinct, teachable technical concepts in this content.
- Do NOT restrict the output to 3 concepts.
- If the content discusses 1 main concept, return 1 concept.
- If the content covers 5, 8, or more distinct concepts, extract all 5, 8, or more concepts dynamically based on the actual depth of the text.

For EACH concept, extract:
1. "name": A concise, canonical name (e.g. "Kafka Partition Rebalancing", "Sliding Window Pattern").
2. "description": A 1-2 sentence plain-English explanation.
3. "keyPrinciples": An array of 3-5 short bullet-point strings — the absolute core truths, not definitions.
   - Focus on HOW and WHY, not WHAT. Example: "Increasing partitions never reassigns existing data."
4. "pitfalls": An array of 2-3 common mistakes engineers make with this concept.
   - Example: "Confusing stability with availability — a system can be stable but unavailable."
5. "mentalModels": A single paragraph with a vivid analogy or mnemonic that makes this click intuitively.
   - Example: "Think of a hash map like a massive hotel: the hash function is the receptionist who instantly tells you the exact room number for your friend."

Return ONLY valid JSON in this exact structure:
{
  "concepts": [
    {
      "name": "...",
      "description": "...",
      "keyPrinciples": ["...", "..."],
      "pitfalls": ["...", "..."],
      "mentalModels": "..."
    }
  ]
}

Content to analyze (up to 10000 chars):
${rawContent.slice(0, 10000)}
`;
// ─── Concept Extraction ────────────────────────────────────────────────────────
const extractConceptsAndCards = async (rawContent, contentType) => {
    const provider = process.env.LLM_PROVIDER || 'gemini';
    // ── Groq ──────────────────────────────────────────────────────────────────
    if (provider === 'groq') {
        const client = new openai_1.default({
            baseURL: 'https://api.groq.com/openai/v1',
            apiKey: process.env.GROQ_API_KEY || '',
        });
        try {
            const response = await client.chat.completions.create({
                model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: 'You build Knowledge Blueprints for a spaced-repetition learning system. Output ONLY valid JSON.' },
                    { role: 'user', content: EXTRACTION_PROMPT(rawContent, contentType) },
                ],
                temperature: 0.2,
                response_format: { type: 'json_object' },
            });
            const parsed = JSON.parse(response.choices[0].message.content || '{}');
            return parsed.concepts || [];
        }
        catch (error) {
            console.error(`[LLM Extraction Error] Groq failed:`, error.message);
            throw error;
        }
    }
    // ── Gemini ────────────────────────────────────────────────────────────────
    if (provider === 'gemini') {
        const genAI = new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash-lite',
            generationConfig: {
                temperature: 0.2,
                responseMimeType: 'application/json',
                responseSchema: {
                    type: generative_ai_1.SchemaType.OBJECT,
                    properties: {
                        concepts: {
                            type: generative_ai_1.SchemaType.ARRAY,
                            items: {
                                type: generative_ai_1.SchemaType.OBJECT,
                                properties: {
                                    name: { type: generative_ai_1.SchemaType.STRING },
                                    description: { type: generative_ai_1.SchemaType.STRING },
                                    keyPrinciples: { type: generative_ai_1.SchemaType.ARRAY, items: { type: generative_ai_1.SchemaType.STRING } },
                                    pitfalls: { type: generative_ai_1.SchemaType.ARRAY, items: { type: generative_ai_1.SchemaType.STRING } },
                                    mentalModels: { type: generative_ai_1.SchemaType.STRING },
                                },
                                required: ['name', 'description', 'keyPrinciples', 'pitfalls', 'mentalModels'],
                            },
                        },
                    },
                    required: ['concepts'],
                },
            },
        });
        try {
            const result = await model.generateContent(EXTRACTION_PROMPT(rawContent, contentType));
            const parsed = JSON.parse(result.response.text());
            return parsed.concepts || [];
        }
        catch (error) {
            console.error(`[LLM Extraction Error] Gemini failed:`, error.message);
            throw error;
        }
    }
    // ── OpenAI / Ollama ───────────────────────────────────────────────────────
    const config = provider === 'ollama'
        ? { baseURL: process.env.OLLAMA_API_BASE || 'http://localhost:11434/v1', apiKey: 'ollama', model: process.env.OLLAMA_MODEL || 'llama3' }
        : { baseURL: undefined, apiKey: process.env.OPENAI_API_KEY || '', model: 'gpt-4o-mini' };
    const client = new openai_1.default({ baseURL: config.baseURL, apiKey: config.apiKey });
    try {
        const response = await client.chat.completions.create({
            model: config.model,
            messages: [
                { role: 'system', content: 'You build Knowledge Blueprints for a spaced-repetition learning system. Output ONLY valid JSON.' },
                { role: 'user', content: EXTRACTION_PROMPT(rawContent, contentType) },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.2,
        });
        const parsed = JSON.parse(response.choices[0].message.content || '{}');
        return parsed.concepts || [];
    }
    catch (error) {
        console.error(`[LLM Extraction Error] OpenAI/Ollama failed:`, error.message);
        throw error;
    }
};
exports.extractConceptsAndCards = extractConceptsAndCards;
// ─── Embedding Generation ─────────────────────────────────────────────────────
// Groq does not support embeddings — we always use Gemini text-embedding-004 for this.
// Embeddings use a separate, much cheaper quota than generative requests.
const generateEmbedding = async (text) => {
    const provider = process.env.LLM_PROVIDER || 'gemini';
    if (provider === 'groq' || provider === 'gemini') {
        const genAI = new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
        const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
        try {
            const result = await model.embedContent(text);
            return result.embedding.values;
        }
        catch (error) {
            console.error(`[LLM Embedding Error] Gemini embeddings failed (non-fatal):`, error.message);
            return new Array(768).fill(0); // graceful degradation — skip deduplication
        }
    }
    if (provider === 'ollama') {
        const client = new openai_1.default({ baseURL: process.env.OLLAMA_API_BASE || 'http://localhost:11434/v1', apiKey: 'ollama' });
        const res = await client.embeddings.create({ model: process.env.OLLAMA_EMBEDDING_MODEL || 'nomic-embed-text', input: text });
        return res.data[0].embedding;
    }
    const client = new openai_1.default({ apiKey: process.env.OPENAI_API_KEY || '' });
    const res = await client.embeddings.create({ model: 'text-embedding-3-small', input: text });
    return res.data[0].embedding;
};
exports.generateEmbedding = generateEmbedding;
