"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateEmbedding = exports.extractConceptsAndCards = void 0;
const openai_1 = __importDefault(require("openai"));
const getLLMConfig = () => {
    const provider = process.env.LLM_PROVIDER || 'gemini';
    switch (provider) {
        case 'gemini':
            return {
                // Google Gemini supports standard OpenAI endpoints out of the box
                baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
                apiKey: process.env.GEMINI_API_KEY || '',
                chatModel: 'gemini-1.5-flash',
                embeddingModel: 'text-embedding-004',
            };
        case 'ollama':
            return {
                // Local Ollama server endpoint
                baseURL: process.env.OLLAMA_API_BASE || 'http://localhost:11434/v1',
                apiKey: 'ollama', // Ollama doesn't require keys, but the SDK expects a non-empty string
                chatModel: process.env.OLLAMA_MODEL || 'llama3',
                embeddingModel: process.env.OLLAMA_EMBEDDING_MODEL || 'nomic-embed-text',
            };
        case 'openai':
        default:
            return {
                baseURL: undefined, // Defaults to standard OpenAI servers
                apiKey: process.env.OPENAI_API_KEY || '',
                chatModel: 'gpt-4o-mini',
                embeddingModel: 'text-embedding-3-small',
            };
    }
};
let openaiInstance = null;
const getOpenAIClient = () => {
    const config = getLLMConfig();
    if (!openaiInstance) {
        openaiInstance = new openai_1.default({
            baseURL: config.baseURL,
            apiKey: config.apiKey,
            dangerouslyAllowBrowser: false,
        });
    }
    return {
        client: openaiInstance,
        chatModel: config.chatModel,
        embeddingModel: config.embeddingModel,
    };
};
/**
 * Extracts key technical concepts and flashcards in JSON format from raw scraped pages/logs.
 * Compatible with Gemini Free Tier, local Ollama models, and OpenAI.
 */
const extractConceptsAndCards = async (rawContent, contentType) => {
    const { client, chatModel } = getOpenAIClient();
    const prompt = `
    You are an expert technical tutor. Analyze the following raw content from a source of type "${contentType}".
    Extract the core software engineering, computer science, or system design concepts being explained.
    
    For each distinct concept:
    1. Define a clear, standard name (e.g., "Kafka partition rebalancing" or "Monotonic Queue pattern").
    2. Write a brief 1-2 sentence description explaining the concept clearly.
    3. Generate 2 to 4 high-quality active-recall micro-questions and answers about the concept.
       - Focus questions on critical insights, mechanical trade-offs, or implementation tricks.
       - AVOID simple dictionary definitions (e.g., DO NOT ask "What is X?"). 
       - PREFER mechanism questions (e.g., "How does X solve Y?", "Why do we increment the left pointer in Z scenario?").
       - Keep questions and answers concise.

    Return the result strictly in this JSON format:
    {
      "concepts": [
        {
          "name": "Concept Name",
          "description": "Concept Description",
          "cards": [
            {
              "question": "Question text?",
              "answer": "Answer text."
            }
          ]
        }
      ]
    }
  `;
    try {
        const response = await client.chat.completions.create({
            model: chatModel,
            messages: [
                {
                    role: 'system',
                    content: 'You extract educational flashcards and concepts from technical texts and output structured JSON.',
                },
                {
                    role: 'user',
                    content: `${prompt}\n\nContent to analyze:\n${rawContent}`,
                },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.2,
        });
        const contentText = response.choices[0].message.content || '{}';
        const parsedData = JSON.parse(contentText);
        return parsedData.concepts || [];
    }
    catch (error) {
        console.error(`[LLM Extraction Error] Failed using model ${chatModel}:`, error.message);
        throw error;
    }
};
exports.extractConceptsAndCards = extractConceptsAndCards;
/**
 * Generates vector embeddings for a concept to enable semantic matching.
 * Uses text-embedding-004 on Gemini, nomic-embed-text on Ollama, or text-embedding-3-small on OpenAI.
 */
const generateEmbedding = async (text) => {
    const { client, embeddingModel } = getOpenAIClient();
    try {
        const response = await client.embeddings.create({
            model: embeddingModel,
            input: text,
        });
        return response.data[0].embedding;
    }
    catch (error) {
        console.error(`[LLM Embedding Error] Failed using model ${embeddingModel}:`, error.message);
        throw error;
    }
};
exports.generateEmbedding = generateEmbedding;
