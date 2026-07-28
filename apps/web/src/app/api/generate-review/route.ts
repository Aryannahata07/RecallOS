import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@recallos/shared';
import { auth } from '@/auth';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

// This API receives a conceptId + mode, and generates dynamic review content on-the-fly.
// Mode: "flashcard" | "quiz" | "summary"

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conceptId, mode } = await req.json();

    if (!conceptId || !mode) {
      return NextResponse.json({ error: 'Missing conceptId or mode' }, { status: 400 });
    }

    const concept = await prisma.concept.findUnique({
      where: { id: conceptId, userId: session.user.id },
      include: { sources: true }
    });

    if (!concept) {
      return NextResponse.json({ error: 'Concept not found' }, { status: 404 });
    }

    const blueprintContext = `
Concept: ${concept.name}
Description: ${concept.description}
Key Principles: ${concept.keyPrinciples.join(' | ')}
Common Pitfalls: ${concept.pitfalls.join(' | ')}
Mental Model: ${concept.mentalModels}
    `.trim();

    let prompt = '';

    if (mode === 'summary') {
      prompt = `Based on this Knowledge Blueprint, generate an in-depth, comprehensive quick-revision guide.
Do NOT follow a rigid or fixed template. Adapt the sections dynamically based on the context of the concept.

Always include the following core sections:
- Overview: An in-depth, detailed explanation of the concept, its main purposes, and its context in system architecture.
- Key Principles: The core truths, design rules, and technical concepts (use ✓ prefix).

Additionally, include the following sections ONLY when they are relevant and make sense for the topic:
1. Core Mechanics & Workflow: Explain step-by-step how the concept operates or is implemented.
2. Comparative Analysis & Trade-offs: Detailed pros vs. cons, latency vs. consistency, or comparison with alternatives.
3. Probable Interview Questions & Answers: Generate 2-3 high-yield, realistic interview questions (conceptual, architectural, or practical) that could be asked on this topic, followed by complete, detailed answers.

Structure the guide naturally to make it highly technical, long, and rich in depth, prioritizing high-yield conceptual clarity over strict formatting templates.

Blueprint:
${blueprintContext}`;
    } else if (mode === 'flashcard') {
      prompt = `Based on this Knowledge Blueprint, generate exactly 3 distinct active-recall flashcards.
Each flashcard must focus on mechanisms, design trade-offs, edge cases, or "why" questions rather than simple definitions.
Return the result strictly in this JSON format:
{
  "flashcards": [
    {
      "question": "...",
      "answer": "..."
    },
    {
      "question": "...",
      "answer": "..."
    },
    {
      "question": "...",
      "answer": "..."
    }
  ]
}

Blueprint:
${blueprintContext}`;
    } else if (mode === 'quiz') {
      prompt = `Based on this Knowledge Blueprint, generate exactly 5 distinct multiple-choice scenario-based quiz questions.
Each scenario must be realistic (e.g., a system design decision, a debugging situation, a code review comment).
Return the result strictly in this JSON format:
{
  "quizzes": [
    {
      "scenario": "...",
      "question": "...",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "correctIndex": 0,
      "explanation": "..."
    }
  ]
}

Blueprint:
${blueprintContext}`;
    }

    let generatedText = '';
    const preferredProvider = process.env.LLM_PROVIDER || 'gemini';
    const providersToTry = preferredProvider === 'groq' ? ['groq', 'gemini'] : ['gemini', 'groq'];
    let lastError: any = null;

    for (const provider of providersToTry) {
      try {
        if (provider === 'groq' && process.env.GROQ_API_KEY) {
          console.log('[API] Attempting review generation via Groq...');
          const client = new OpenAI({
            baseURL: 'https://api.groq.com/openai/v1',
            apiKey: process.env.GROQ_API_KEY,
          });
          const isJson = mode !== 'summary';
          const response = await client.chat.completions.create({
            model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: 'You generate dynamic educational review content. Be concise and insightful.' },
              { role: 'user', content: prompt },
            ],
            temperature: 0.7,
            ...(isJson ? { response_format: { type: 'json_object' } } : {}),
          });
          generatedText = response.choices[0].message.content || '';
          break; // Success!
        }

        if (provider === 'gemini' && process.env.GEMINI_API_KEY) {
          console.log('[API] Attempting review generation via Gemini...');
          const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
          const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });
          const result = await model.generateContent(prompt);
          generatedText = result.response.text();
          break; // Success!
        }
      } catch (err: any) {
        console.warn(`[API] Provider ${provider} failed, trying fallback:`, err.message || err);
        lastError = err;
      }
    }

    if (!generatedText) {
      throw lastError || new Error('All LLM providers failed to generate review content.');
    }

    // Parse JSON for flashcard/quiz modes
    if (mode === 'flashcard' || mode === 'quiz') {
      try {
        let cleanText = generatedText.trim();
        if (cleanText.startsWith('```')) {
          const match = cleanText.match(/^(?:```(?:json)?\s*)([\s\S]*?)(?:\s*```)$/);
          if (match) {
            cleanText = match[1].trim();
          }
        }
        
        const parsed = JSON.parse(cleanText);
        
        if (mode === 'flashcard') {
          let flashcards: any[] = [];
          if (Array.isArray(parsed)) {
            flashcards = parsed;
          } else if (parsed && Array.isArray(parsed.flashcards)) {
            flashcards = parsed.flashcards;
          } else if (parsed && typeof parsed === 'object') {
            if (parsed.question && parsed.answer) {
              flashcards = [parsed];
            } else {
              const arrayKey = Object.keys(parsed).find(k => Array.isArray(parsed[k]));
              if (arrayKey) {
                flashcards = parsed[arrayKey];
              }
            }
          }
          
          if (flashcards.length === 0) {
            throw new Error('No flashcards found in response');
          }
          
          return NextResponse.json({ mode, data: { flashcards }, sources: concept.sources });
        } else {
          // mode === 'quiz'
          let quizzes: any[] = [];
          if (Array.isArray(parsed)) {
            quizzes = parsed;
          } else if (parsed && Array.isArray(parsed.quizzes)) {
            quizzes = parsed.quizzes;
          } else if (parsed && typeof parsed === 'object') {
            if (parsed.question && parsed.options) {
              quizzes = [parsed];
            } else {
              const arrayKey = Object.keys(parsed).find(k => Array.isArray(parsed[k]));
              if (arrayKey) {
                quizzes = parsed[arrayKey];
              }
            }
          }
          
          if (quizzes.length === 0) {
            throw new Error('No quizzes found in response');
          }
          
          quizzes = quizzes.map((q: any) => ({
            scenario: q.scenario || 'Scenario:',
            question: q.question || '',
            options: Array.isArray(q.options) ? q.options : [],
            correctIndex: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
            explanation: q.explanation || ''
          }));
          
          return NextResponse.json({ mode, data: { quizzes }, sources: concept.sources });
        }
      } catch (err: any) {
        console.error('[API] JSON Parse fail:', err.message, '\nRaw text:', generatedText);
        return NextResponse.json({ 
          mode, 
          error: 'Failed to parse AI generated response as structured JSON. Try again or regenerate.',
          data: { raw: generatedText }, 
          sources: concept.sources 
        }, { status: 200 });
      }
    }

    return NextResponse.json({ mode, data: { text: generatedText }, sources: concept.sources });

  } catch (error: any) {
    console.error('[API] generate-review error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
