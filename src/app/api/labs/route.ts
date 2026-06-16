import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { LabFormValues } from '@/types';

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
