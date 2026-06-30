import { NextResponse } from 'next/server';
import { conceptIngestionQueue } from '@recallos/shared';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { url, title, type, rawContent, userId } = body;

    if (!url || !rawContent) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Add job to BullMQ queue for background processing (Phase 2 & 3 integration)
    const job = await conceptIngestionQueue.add('ingest', {
      url,
      title,
      type,
      rawContent,
      userId
    });

    return NextResponse.json({ success: true, jobId: job.id });
  } catch (error: any) {
    console.error('[API] Ingest Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
