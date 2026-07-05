import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { conceptIngestionQueue } from '@recallos/shared';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { url, title, type, rawContent } = body;

    if (!url || !rawContent) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Use userId from authenticated session — never trust the request body for this
    const job = await conceptIngestionQueue.add('ingest', {
      url,
      title,
      type,
      rawContent,
      userId: session.user.id,
    });

    return NextResponse.json({ success: true, jobId: job.id });
  } catch (error: any) {
    console.error('[API] Ingest Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
