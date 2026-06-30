import Link from 'next/link';
import { prisma } from '@recallos/shared';

export default async function Dashboard() {
  // Fetch high-level statistics directly from Postgres (Server Component)
  const totalConcepts = await prisma.concept.count();
  const totalCards = await prisma.card.count();
  
  // Find out how many cards have crossed the retention threshold
  const now = new Date();
  const dueCards = await prisma.card.count({
    where: {
      nextReviewDue: {
        lte: now
      }
    }
  });

  return (
    <div className="min-h-screen bg-black text-white p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-12">
          <h1 className="text-3xl font-bold tracking-tight">RecallOS Dashboard</h1>
          <Link href="/review" className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg font-semibold transition-colors">
            Start Review ({dueCards} Due)
          </Link>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
            <h3 className="text-zinc-400 text-sm font-medium mb-2 uppercase tracking-wide">Total Concepts</h3>
            <p className="text-4xl font-bold">{totalConcepts}</p>
          </div>
          <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
            <h3 className="text-zinc-400 text-sm font-medium mb-2 uppercase tracking-wide">Total Cards</h3>
            <p className="text-4xl font-bold">{totalCards}</p>
          </div>
          <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 border-l-4 border-l-emerald-500">
            <h3 className="text-zinc-400 text-sm font-medium mb-2 uppercase tracking-wide">Cards Due Now</h3>
            <p className="text-4xl font-bold text-emerald-500">{dueCards}</p>
          </div>
        </div>

        <div className="mt-12 bg-zinc-900/50 rounded-xl border border-zinc-800 p-6">
          <h2 className="text-xl font-semibold mb-4">How to add cards?</h2>
          <p className="text-zinc-400 leading-relaxed">
            Use the <strong>RecallOS Chrome Extension</strong> to capture deep technical concepts from LeetCode problems, ChatGPT conversations, or Medium articles. The background worker will automatically extract active-recall flashcards and semantically deduplicate concepts in real-time.
          </p>
        </div>
      </div>
    </div>
  );
}
