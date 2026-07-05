import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma, FSRSScheduler, Rating, FSRSCard } from '@recallos/shared';

const scheduler = new FSRSScheduler();

// GET /api/review — returns Concepts due for review for the logged-in user
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const concepts = await prisma.concept.findMany({
      where: {
        userId: session.user.id,
        nextReviewDue: { lte: new Date() }
      },
      include: { sources: true },
      orderBy: { nextReviewDue: 'asc' },
      take: 20,
    });
    return NextResponse.json({ concepts });
  } catch (error: any) {
    console.error('[API] Review GET Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/review — updates FSRS fields on a Concept after user rates it
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conceptId, rating } = await req.json();

    if (!conceptId || !rating) {
      return NextResponse.json({ error: 'Missing conceptId or rating' }, { status: 400 });
    }

    const concept = await prisma.concept.findUnique({
      where: { id: conceptId, userId: session.user.id }
    });
    if (!concept) {
      return NextResponse.json({ error: 'Concept not found' }, { status: 404 });
    }

    const currentState: FSRSCard = {
      difficulty: concept.difficulty,
      stability: concept.stability,
      last_reviewed_at: concept.lastReviewedAt,
      next_review_due: concept.nextReviewDue,
      reps: concept.reps,
      lapses: concept.lapses,
    };

    const now = new Date();
    const result = scheduler.reviewCard(currentState, rating as Rating, now);

    await prisma.concept.update({
      where: { id: conceptId },
      data: {
        difficulty: result.card.difficulty,
        stability: result.card.stability,
        lastReviewedAt: now,
        nextReviewDue: result.card.next_review_due,
        reps: result.card.reps,
        lapses: result.card.lapses,
      }
    });

    return NextResponse.json({ success: true, nextDue: result.card.next_review_due, interval: result.interval });
  } catch (error: any) {
    console.error('[API] Review POST Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
