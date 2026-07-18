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

Analyze the raw content below from a source of type "${contentType}".
CRITICAL GRANULARITY RULES (AGGREGATION OVER SPLITTING):
- Do NOT over-split subtopics, definitions, pillars, components, or aspects of a single overarching theorem, framework, pattern, or algorithm into separate concepts.
- If a document is about a single primary subject (e.g., "CAP Theorem", "Deadlock", "Serverless Architecture"), extract exactly ONE comprehensive concept.
  - Example: For "CAP Theorem", do NOT create separate concepts for "Consistency", "Availability", "Partition Tolerance", "CP System", "AP System", or "CA System". Group all of these definitions and configurations into a single, cohesive concept named "CAP Theorem".
  - Example: For "Deadlock", do NOT split into "Deadlock Detection", "Deadlock Avoidance", etc. Group everything into "Deadlock".
- Only extract multiple concepts if the text covers genuinely distinct, separate, and unrelated topics (e.g., a page covering both "Deadlock" and "CPU Scheduling").
- Do NOT create separate concepts for "use cases", "challenges", "reasons", "components", "pros/cons", or "how to avoid" of the same main topic. Consolidate them.

For EACH extracted concept, provide deep, high-value, thorough content:
1. "name": A concise, canonical name (e.g. "Serverless Architecture", "Deadlock").
2. "description": A detailed, in-depth explanation (2-3 rich sentences) outlining the core definition, key use cases, and technical trade-offs.
3. "keyPrinciples": An array of 4-6 detailed, thorough bullet points. Focus on HOW and WHY (mechanisms, execution flow, pros/cons, and core operational truths). Avoid short, generic definitions. Make them technically comprehensive.
4. "pitfalls": An array of 3-4 common mistakes, anti-patterns, or performance gotchas engineers face with this concept, explained with technical depth.
5. "mentalModels": A detailed paragraph providing a vivid analogy or mnemonic to build intuitive understanding.

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

Content to analyze (up to 40000 chars):
${rawContent.slice(0, 40000)}
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
// Groq does not support embeddings — we always use Gemini gemini-embedding-001 for this.
// Embeddings use a separate, much cheaper quota than generative requests.

export const generateEmbedding = async (text: string): Promise<number[]> => {
  const provider = process.env.LLM_PROVIDER || 'gemini';

  if (provider === 'groq' || provider === 'gemini') {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
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
