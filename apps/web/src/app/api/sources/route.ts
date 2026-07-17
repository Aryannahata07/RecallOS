import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@recallos/shared';

export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Source ID is required' }, { status: 400 });
    }

    // Delete source scoped strictly to authenticated user
    const result = await prisma.source.deleteMany({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (result.count === 0) {
      return NextResponse.json({ error: 'Source not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[API Delete Source Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
