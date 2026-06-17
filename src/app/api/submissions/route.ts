import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { uploadImage } from '@/lib/minio';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB per image
const MAX_TEXT_LENGTH = 10_000;
const MAX_NAME_LENGTH = 200;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const labId = formData.get('labId') as string;
    const studentName = formData.get('studentName') as string;

    if (!labId || !studentName?.trim()) {
      return NextResponse.json({ error: 'labId and studentName are required' }, { status: 400 });
    }
    if (studentName.length > MAX_NAME_LENGTH) {
      return NextResponse.json({ error: 'Student name is too long' }, { status: 400 });
    }

    const lab = await prisma.lab.findUnique({
      where: { id: labId },
      include: { questions: true },
    });
    if (!lab) return NextResponse.json({ error: 'Lab not found' }, { status: 404 });

    // Validate all answers before touching the database
    for (const question of lab.questions) {
      if (question.type === 'IMAGE') {
        const file = formData.get(`answer_${question.id}`) as File | null;
        if (file && file.size > MAX_FILE_SIZE) {
          return NextResponse.json(
            { error: `Image for question "${question.text}" exceeds 10 MB limit` },
            { status: 400 },
          );
        }
      } else {
        const text = formData.get(`answer_${question.id}`) as string | null;
        if (text && text.length > MAX_TEXT_LENGTH) {
          return NextResponse.json(
            { error: `Answer for question "${question.text}" is too long` },
            { status: 400 },
          );
        }
      }
    }

    // Create the submission row so we have an ID for MinIO keys
    const submission = await prisma.submission.create({
      data: { labId, studentName: studentName.trim(), answers: { create: [] } },
    });

    try {
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
    } catch (uploadError) {
      // Clean up the orphaned submission row if anything goes wrong
      await prisma.submission.delete({ where: { id: submission.id } }).catch(() => {});
      throw uploadError;
    }

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
