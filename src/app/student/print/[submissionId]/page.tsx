import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import PrintClient from './PrintClient';

interface Props {
  params: Promise<{ submissionId: string }>;
}

export default async function PrintPage({ params }: Props) {
  const { submissionId } = await params;

  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      answers: true,
      lab: { include: { questions: { orderBy: { order: 'asc' } } } },
    },
  });

  if (!submission) notFound();

  const data = {
    id: submission.id,
    studentName: submission.studentName,
    createdAt: submission.createdAt.toISOString(),
    lab: {
      title: submission.lab.title,
      professorName: submission.lab.professorName,
      className: submission.lab.className,
      questions: submission.lab.questions,
    },
    // Use the proxy route instead of presigned MinIO URLs —
    // the browser hits /api/images/... and the server fetches from MinIO.
    answers: submission.answers.map((a) => ({
      questionId: a.questionId,
      textContent: a.textContent,
      // Build a proxy URL from the stored key, e.g.
      // submissions/abc/qid.jpg → /api/images/submissions/abc/qid.jpg
      imageUrl: a.imageKey ? `/api/images/${a.imageKey}` : null,
    })),
  };

  return <PrintClient data={data} />;
}
