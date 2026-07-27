import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { conceptIngestionQueue, prisma } from '@recallos/shared';

export async function POST(req: Request) {
  try {
    const session = await auth();
    let userId = session?.user?.id;

    // Local development fallback: since local HTTP calls from a Chrome Extension cannot send
    // SameSite session cookies over HTTP, we bypass auth and fallback to a developer user in development mode.
    if (!userId && process.env.NODE_ENV === 'development') {
      const fallbackUser = await prisma.user.findFirst();
      if (fallbackUser) {
        userId = fallbackUser.id;
      } else {
        const devUser = await prisma.user.upsert({
          where: { email: 'dev@recallos.local' },
          update: {},
          create: {
            id: 'dev-user-id',
            name: 'Developer User',
            email: 'dev@recallos.local',
          },
        });
        userId = devUser.id;
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { url, title, type = 'article', rawContent } = body;

    const finalRawContent = rawContent && typeof rawContent === 'string' && rawContent.trim()
      ? rawContent.trim()
      : (title || url || 'Captured Knowledge Entry');

    const finalUrl = url && url.trim() ? url.trim() : `raw-text://${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const finalTitle = title && title.trim() ? title.trim() : (finalRawContent.slice(0, 45).replace(/\n/g, ' ') + (finalRawContent.length > 45 ? '...' : ''));

    // Use userId from authenticated session (or fallback in dev) — never trust the request body for this
    const job = await conceptIngestionQueue.add('ingest', {
      url: finalUrl,
      title: finalTitle,
      type,
      rawContent: finalRawContent,
      userId,
    });

    return NextResponse.json({ success: true, jobId: job.id });
  } catch (error: any) {
    console.error('[API] Ingest Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
