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
      prompt = `Based on this Knowledge Blueprint, generate a clear, structured quick-revision summary.
Format it with:
- A 2-sentence overview
- 3-5 bullet points of key principles (use ✓ prefix)
- 2-3 bullet points of pitfalls to avoid (use ⚠ prefix)
- The mental model/analogy
Keep it scannable and punchy.

Blueprint:
${blueprintContext}`;
    } else if (mode === 'flashcard') {
      prompt = `Based on this Knowledge Blueprint, generate ONE brand-new active-recall flashcard.
This should be DIFFERENT from a typical definition question.
Focus on: mechanism, trade-offs, edge cases, or "why" questions.
Return JSON: { "question": "...", "answer": "..." }

Blueprint:
${blueprintContext}`;
    } else if (mode === 'quiz') {
      prompt = `Based on this Knowledge Blueprint, generate a multiple-choice scenario quiz question.
The scenario should be realistic (e.g., a system design decision, a debugging situation, a code review comment).
Return JSON: {
  "scenario": "...",
  "question": "...",
  "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
  "correctIndex": 0,
  "explanation": "..."
}

Blueprint:
${blueprintContext}`;
    }

    let generatedText = '';
    const provider = process.env.LLM_PROVIDER || 'gemini';

    if (provider === 'groq') {
      const client = new OpenAI({
        baseURL: 'https://api.groq.com/openai/v1',
        apiKey: process.env.GROQ_API_KEY || '',
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
    } else {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });
      const result = await model.generateContent(prompt);
      generatedText = result.response.text();
    }

    // Parse JSON for flashcard/quiz modes
    if (mode === 'flashcard' || mode === 'quiz') {
      try {
        const parsed = JSON.parse(generatedText);
        return NextResponse.json({ mode, data: parsed, sources: concept.sources });
      } catch {
        return NextResponse.json({ mode, data: { raw: generatedText }, sources: concept.sources });
      }
    }

    return NextResponse.json({ mode, data: { text: generatedText }, sources: concept.sources });

  } catch (error: any) {
    console.error('[API] generate-review error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
