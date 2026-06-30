import { NextResponse } from 'next/server';
import { prisma, FSRSScheduler, Rating, FSRSCard } from '@recallos/shared';

const scheduler = new FSRSScheduler();

export async function POST(req: Request) {
  try {
    const { cardId, rating } = await req.json();

    if (!cardId || !rating) {
      return NextResponse.json({ error: 'Missing cardId or rating' }, { status: 400 });
    }

    const dbCard = await prisma.card.findUnique({
      where: { id: cardId }
    });

    if (!dbCard) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    // Map the database state into our FSRS mathematical engine's format
    const currentCardState: FSRSCard = {
      difficulty: dbCard.difficulty,
      stability: dbCard.stability,
      last_reviewed_at: dbCard.lastReviewedAt,
      next_review_due: dbCard.nextReviewDue,
      reps: dbCard.reps,
      lapses: dbCard.lapses
    };

    const now = new Date();
    // 🧠 Run the FSRS math to determine the new memory stability and interval!
    const result = scheduler.reviewCard(currentCardState, rating as Rating, now);

    // Save the newly calculated decay properties to PostgreSQL
    await prisma.card.update({
      where: { id: cardId },
      data: {
        difficulty: result.card.difficulty,
        stability: result.card.stability,
        lastReviewedAt: result.card.last_reviewed_at,
        nextReviewDue: result.card.next_review_due,
        reps: result.card.reps,
        lapses: result.card.lapses,
        reviews: {
          create: {
            userId: 'dev-user-id', // Hardcoded for local dev until Auth is added
            rating,
            scheduledDays: result.interval,
            elapsedDays: dbCard.lastReviewedAt 
              ? (now.getTime() - dbCard.lastReviewedAt.getTime()) / (1000 * 60 * 60 * 24)
              : 0
          }
        }
      }
    });

    return NextResponse.json({ success: true, nextDue: result.card.next_review_due });
  } catch (error: any) {
    console.error('[API] Review Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
