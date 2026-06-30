import { prisma } from '@recallos/shared';
import ReviewClient from './ReviewClient';
import Link from 'next/link';

export default async function ReviewPage() {
  const now = new Date();
  
  // Fetch up to 20 cards that are due for review
  const dueCards = await prisma.card.findMany({
    where: {
      nextReviewDue: { lte: now }
    },
    include: {
      concept: true // Pull in concept info so the user knows what topic they are being quizzed on
    },
    take: 20,
    orderBy: {
      nextReviewDue: 'asc'
    }
  });

  if (dueCards.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="text-center animate-in fade-in duration-500">
          <h2 className="text-3xl font-bold mb-4">You're all caught up! 🎉</h2>
          <p className="text-zinc-400 mb-8 text-lg">Your memory decay is fully mitigated for now.</p>
          <Link href="/" className="bg-zinc-800 hover:bg-zinc-700 px-6 py-3 rounded-lg font-medium transition-colors">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Next.js Server Components require passing plain JSON to Client Components
  const serializedCards = JSON.parse(JSON.stringify(dueCards));

  return (
    <div className="min-h-screen bg-black text-white p-4 flex flex-col">
      <header className="p-4 border-b border-zinc-800 flex justify-between items-center max-w-4xl mx-auto w-full">
        <h1 className="font-bold tracking-widest uppercase text-zinc-300">RecallOS Engine</h1>
        <Link href="/" className="text-sm text-zinc-500 hover:text-white transition-colors">Dashboard</Link>
      </header>
      <main className="flex-1 max-w-2xl w-full mx-auto flex flex-col justify-center">
        <ReviewClient initialCards={serializedCards} />
      </main>
    </div>
  );
}
