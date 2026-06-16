import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPresignedUrl } from '@/lib/minio';

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

    // Resolve presigned URLs for any image answers
    const answersWithUrls = await Promise.all(
      submission.answers.map(async (answer) => {
        if (answer.imageKey) {
          const imageUrl = await getPresignedUrl(answer.imageKey);
          return { ...answer, imageUrl };
        }
        return answer;
      }),
    );

    return NextResponse.json({ ...submission, answers: answersWithUrls });
  } catch (error) {
    console.error('[GET /api/submissions/[id]]', error);
    return NextResponse.json({ error: 'Failed to fetch submission' }, { status: 500 });
  }
}
