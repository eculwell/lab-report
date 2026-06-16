import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { uploadImage } from '@/lib/minio';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const labId = formData.get('labId') as string;
    const studentName = formData.get('studentName') as string;

    if (!labId || !studentName?.trim()) {
      return NextResponse.json({ error: 'labId and studentName are required' }, { status: 400 });
    }

    const lab = await prisma.lab.findUnique({
      where: { id: labId },
      include: { questions: true },
    });
    if (!lab) return NextResponse.json({ error: 'Lab not found' }, { status: 404 });

    // Create the submission shell first so we have an ID for MinIO keys
    const submission = await prisma.submission.create({
      data: { labId, studentName: studentName.trim(), answers: { create: [] } },
    });

    const answerCreates = await Promise.all(
      lab.questions.map(async (question) => {
        if (question.type === 'IMAGE') {
          const file = formData.get(`answer_${question.id}`) as File | null;
          if (file && file.size > 0) {
            const buffer = Buffer.from(await file.arrayBuffer());
            const key = await uploadImage(buffer, file.name, submission.id, question.id);
            return { submissionId: submission.id, questionId: question.id, imageKey: key };
          }
          return { submissionId: submission.id, questionId: question.id };
        } else {
          const text = formData.get(`answer_${question.id}`) as string | null;
          return {
            submissionId: submission.id,
            questionId: question.id,
            textContent: text ?? '',
          };
        }
      }),
    );

    await prisma.answer.createMany({ data: answerCreates });

    const full = await prisma.submission.findUnique({
      where: { id: submission.id },
      include: { answers: true },
    });

    return NextResponse.json(full, { status: 201 });
  } catch (error) {
    console.error('[POST /api/submissions]', error);
    return NextResponse.json({ error: 'Failed to create submission' }, { status: 500 });
  }
}
