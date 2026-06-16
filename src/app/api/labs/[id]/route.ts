import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { LabFormValues } from '@/types';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const lab = await prisma.lab.findUnique({
      where: { id },
      include: { questions: { orderBy: { order: 'asc' } } },
    });
    if (!lab) return NextResponse.json({ error: 'Lab not found' }, { status: 404 });
    return NextResponse.json(lab);
  } catch (error) {
    console.error('[GET /api/labs/[id]]', error);
    return NextResponse.json({ error: 'Failed to fetch lab' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body: LabFormValues = await req.json();
    const { title, professorName, className, questions } = body;

    // Replace all questions in a transaction
    const lab = await prisma.$transaction(async (tx) => {
      await tx.question.deleteMany({ where: { labId: id } });
      return tx.lab.update({
        where: { id },
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
    });

    return NextResponse.json(lab);
  } catch (error) {
    console.error('[PUT /api/labs/[id]]', error);
    return NextResponse.json({ error: 'Failed to update lab' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await prisma.lab.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[DELETE /api/labs/[id]]', error);
    return NextResponse.json({ error: 'Failed to delete lab' }, { status: 500 });
  }
}
