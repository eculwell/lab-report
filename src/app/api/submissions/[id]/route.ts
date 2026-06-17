import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const submission = await prisma.submission.findUnique({
      where: { id },
      include: {
        answers: true,
        lab: { include: { questions: { orderBy: { order: 'asc' } } } },
      },
    });

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    // Use the image proxy route instead of presigned MinIO URLs
    const answersWithUrls = submission.answers.map((answer) => ({
      ...answer,
      imageUrl: answer.imageKey ? `/api/images/${answer.imageKey}` : null,
    }));

    return NextResponse.json({ ...submission, answers: answersWithUrls });
  } catch (error) {
    console.error('[GET /api/submissions/[id]]', error);
    return NextResponse.json({ error: 'Failed to fetch submission' }, { status: 500 });
  }
}
