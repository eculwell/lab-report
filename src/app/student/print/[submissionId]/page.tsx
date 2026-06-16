import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getPresignedUrl } from '@/lib/minio';
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

  // Resolve presigned URLs for image answers (server-side so they're ready to print)
  const answersWithUrls = await Promise.all(
    submission.answers.map(async (answer) => {
      if (answer.imageKey) {
        const imageUrl = await getPresignedUrl(answer.imageKey);
        return { ...answer, imageUrl };
      }
      return { ...answer, imageUrl: null };
    }),
  );

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
    answers: answersWithUrls.map((a) => ({
      questionId: a.questionId,
      textContent: a.textContent,
      imageUrl: a.imageUrl,
    })),
  };

  return <PrintClient data={data} />;
}
