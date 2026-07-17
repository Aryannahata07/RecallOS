import { auth, signOut } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@recallos/shared';
import DashboardClient from '../DashboardClient';

export default async function ReviewPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const userId = session.user.id!;

  const [totalConcepts, totalSources, dueNow, masteredConcepts, allConcepts, allSources] = await Promise.all([
    prisma.concept.count({ where: { userId } }),
    prisma.source.count({ where: { userId } }),
    prisma.concept.count({ where: { userId, nextReviewDue: { lte: new Date() } } }),
    prisma.concept.count({ where: { userId, stability: { gte: 21 } } }),
    prisma.concept.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { sources: true }
    }),
    prisma.source.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { concepts: true }
    })
  ]);

  const handleSignOut = async () => {
    'use server';
    await signOut({ redirectTo: '/login' });
  };

  return (
    <DashboardClient
      user={{
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
      }}
      totalConcepts={totalConcepts}
      totalSources={totalSources}
      dueNow={dueNow}
      masteredConcepts={masteredConcepts}
      allConcepts={allConcepts as any}
      allSources={allSources as any}
      signOutAction={handleSignOut}
      initialTab="review"
    />
  );
}
