import { auth, signOut } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@recallos/shared';
import Link from 'next/link';

export default async function Dashboard() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const userId = session.user.id!;

  const totalConcepts = await prisma.concept.count({ where: { userId } });
  const totalSources = await prisma.source.count({ where: { userId } });
  const dueNow = await prisma.concept.count({
    where: { userId, nextReviewDue: { lte: new Date() } }
  });
  const masteredConcepts = await prisma.concept.count({
    where: { userId, stability: { gte: 21 } }
  });

  const recentConcepts = await prisma.concept.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { sources: true }
  });

  const sourceIcon = (type: string) => {
    if (type === 'youtube') return '▶';
    if (type === 'leetcode') return '🧩';
    return '📄';
  };

  return (
    <main className="dashboard">
      <header className="dash-header">
        <div className="logo">
          <span className="logo-icon">🧠</span>
          <h1>RecallOS</h1>
        </div>
        <p className="tagline">Your Personal Knowledge Operating System</p>

        {/* User nav */}
        <div className="user-nav">
          {session.user.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={session.user.image}
              alt={session.user.name || 'User'}
              className="user-avatar"
            />
          )}
          <div className="user-info">
            <span className="user-name">{session.user.name || session.user.email}</span>
            <span className="user-email">{session.user.email}</span>
          </div>
          <form action={async () => {
            'use server';
            await signOut({ redirectTo: '/login' });
          }}>
            <button type="submit" className="signout-btn">Sign Out</button>
          </form>
        </div>
      </header>

      {/* Stats Grid */}
      <section className="stats-grid">
        <div className="stat-card accent-blue">
          <span className="stat-num">{totalConcepts}</span>
          <span className="stat-label">Concepts Learned</span>
        </div>
        <div className="stat-card accent-orange">
          <span className="stat-num">{dueNow}</span>
          <span className="stat-label">Due for Review</span>
        </div>
        <div className="stat-card accent-green">
          <span className="stat-num">{masteredConcepts}</span>
          <span className="stat-label">Mastered</span>
        </div>
        <div className="stat-card accent-purple">
          <span className="stat-num">{totalSources}</span>
          <span className="stat-label">Sources Captured</span>
        </div>
      </section>

      {/* CTA */}
      {dueNow > 0 && (
        <section className="review-cta">
          <div className="cta-content">
            <h2>🔥 {dueNow} concept{dueNow > 1 ? 's' : ''} waiting for review</h2>
            <p>Keep your memory sharp — your streak depends on it!</p>
          </div>
          <Link href="/review" className="cta-btn">Start Review Session →</Link>
        </section>
      )}

      {/* Recent Concepts */}
      <section className="recent-section">
        <h2>Recently Captured</h2>
        {recentConcepts.length === 0 ? (
          <div className="empty-state">
            <p>No concepts yet! Install the Chrome Extension and capture your first LeetCode problem or YouTube video.</p>
          </div>
        ) : (
          <div className="concept-list">
            {recentConcepts.map(concept => (
              <div key={concept.id} className="concept-card">
                <div className="concept-card-header">
                  <h3>{concept.name}</h3>
                  <span className={`stability-badge ${concept.stability >= 21 ? 'mastered' : concept.stability >= 7 ? 'learning' : 'new'}`}>
                    {concept.stability >= 21 ? '🏆 Mastered' : concept.stability >= 7 ? '📈 Learning' : '🌱 New'}
                  </span>
                </div>
                <p className="concept-card-desc">{concept.description}</p>
                {concept.keyPrinciples.length > 0 && (
                  <ul className="principles-preview">
                    {concept.keyPrinciples.slice(0, 2).map((p, i) => (
                      <li key={i}>✓ {p}</li>
                    ))}
                  </ul>
                )}
                <div className="concept-card-footer">
                  {concept.sources.length > 0 ? (
                    concept.sources.map(s => (
                      <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer" className="source-link">
                        {sourceIcon(s.type)} {s.title}
                      </a>
                    ))
                  ) : (
                    <span className="source-link empty">📝 Manual Entry</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
