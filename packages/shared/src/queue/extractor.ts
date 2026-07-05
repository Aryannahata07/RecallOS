import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import OpenAI from 'openai';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ExtractedConcept {
  name: string;
  description: string;
  keyPrinciples: string[];
  pitfalls: string[];
  mentalModels: string;
}

// ─── Prompt ───────────────────────────────────────────────────────────────────

const EXTRACTION_PROMPT = (rawContent: string, contentType: string) => `
You are an expert technical tutor building a "Knowledge Blueprint" for a spaced-repetition learning system.

Analyze the following raw content from a source of type "${contentType}".
Identify the distinct, teachable technical concepts in this content.

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

Content to analyze (first 8000 chars):
${rawContent.slice(0, 8000)}
`;

// ─── Concept Extraction ────────────────────────────────────────────────────────

export const extractConceptsAndCards = async (
  rawContent: string,
  contentType: string
): Promise<ExtractedConcept[]> => {
  const provider = process.env.LLM_PROVIDER || 'gemini';

  // ── Groq ──────────────────────────────────────────────────────────────────
  if (provider === 'groq') {
    const client = new OpenAI({
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
    } catch (error: any) {
      console.error(`[LLM Extraction Error] Groq failed:`, error.message);
      throw error;
    }
  }

  // ── Gemini ────────────────────────────────────────────────────────────────
  if (provider === 'gemini') {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-lite',
      generationConfig: {
        temperature: 0.2,
        responseMimeType: 'application/json',
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            concepts: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  name: { type: SchemaType.STRING },
                  description: { type: SchemaType.STRING },
                  keyPrinciples: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                  pitfalls: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                  mentalModels: { type: SchemaType.STRING },
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
    } catch (error: any) {
      console.error(`[LLM Extraction Error] Gemini failed:`, error.message);
      throw error;
    }
  }

  // ── OpenAI / Ollama ───────────────────────────────────────────────────────
  const config = provider === 'ollama'
    ? { baseURL: process.env.OLLAMA_API_BASE || 'http://localhost:11434/v1', apiKey: 'ollama', model: process.env.OLLAMA_MODEL || 'llama3' }
    : { baseURL: undefined, apiKey: process.env.OPENAI_API_KEY || '', model: 'gpt-4o-mini' };
  const client = new OpenAI({ baseURL: config.baseURL, apiKey: config.apiKey });
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
  } catch (error: any) {
    console.error(`[LLM Extraction Error] OpenAI/Ollama failed:`, error.message);
    throw error;
  }
};

// ─── Embedding Generation ─────────────────────────────────────────────────────
// Groq does not support embeddings — we always use Gemini text-embedding-004 for this.
// Embeddings use a separate, much cheaper quota than generative requests.

export const generateEmbedding = async (text: string): Promise<number[]> => {
  const provider = process.env.LLM_PROVIDER || 'gemini';

  if (provider === 'groq' || provider === 'gemini') {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
    try {
      const result = await model.embedContent(text);
      return result.embedding.values;
    } catch (error: any) {
      console.error(`[LLM Embedding Error] Gemini embeddings failed (non-fatal):`, error.message);
      return new Array(768).fill(0); // graceful degradation — skip deduplication
    }
  }

  if (provider === 'ollama') {
    const client = new OpenAI({ baseURL: process.env.OLLAMA_API_BASE || 'http://localhost:11434/v1', apiKey: 'ollama' });
    const res = await client.embeddings.create({ model: process.env.OLLAMA_EMBEDDING_MODEL || 'nomic-embed-text', input: text });
    return res.data[0].embedding;
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' });
  const res = await client.embeddings.create({ model: 'text-embedding-3-small', input: text });
  return res.data[0].embedding;
};
