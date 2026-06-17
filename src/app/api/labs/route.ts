import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { LabFormValues } from '@/types';

const MAX_TITLE_LENGTH = 200;
const MAX_NAME_LENGTH = 100;
const MAX_CLASS_LENGTH = 100;
const MAX_QUESTION_LENGTH = 1000;
const MAX_QUESTIONS = 50;

export async function GET() {
  try {
    const labs = await prisma.lab.findMany({
      include: { questions: { orderBy: { order: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(labs);
  } catch (error) {
    console.error('[GET /api/labs]', error);
    return NextResponse.json({ error: 'Failed to fetch labs' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: LabFormValues = await req.json();
    const { title, professorName, className, questions } = body;

    if (!title?.trim() || !professorName?.trim() || !className?.trim()) {
      return NextResponse.json(
        { error: 'title, professorName, and className are required' },
        { status: 400 },
      );
    }
    if (title.length > MAX_TITLE_LENGTH)
      return NextResponse.json({ error: 'Lab title is too long' }, { status: 400 });
    if (professorName.length > MAX_NAME_LENGTH)
      return NextResponse.json({ error: 'Professor name is too long' }, { status: 400 });
    if (className.length > MAX_CLASS_LENGTH)
      return NextResponse.json({ error: 'Class name is too long' }, { status: 400 });
    if (!Array.isArray(questions) || questions.length === 0)
      return NextResponse.json({ error: 'At least one question is required' }, { status: 400 });
    if (questions.length > MAX_QUESTIONS)
      return NextResponse.json({ error: `Maximum ${MAX_QUESTIONS} questions allowed` }, { status: 400 });
    for (const q of questions) {
      if (!q.text?.trim())
        return NextResponse.json({ error: 'All questions must have text' }, { status: 400 });
      if (q.text.length > MAX_QUESTION_LENGTH)
        return NextResponse.json({ error: 'A question text is too long' }, { status: 400 });
    }

    const lab = await prisma.lab.create({
      data: {
        title: title.trim(),
        professorName: professorName.trim(),
        className: className.trim(),
        questions: {
          create: questions.map((q, i) => ({
            text: q.text.trim(),
            type: q.type,
            order: i,
          })),
        },
      },
      include: { questions: { orderBy: { order: 'asc' } } },
    });

    return NextResponse.json(lab, { status: 201 });
  } catch (error) {
    console.error('[POST /api/labs]', error);
    return NextResponse.json({ error: 'Failed to create lab' }, { status: 500 });
  }
}
