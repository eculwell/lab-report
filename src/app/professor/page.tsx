'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis, restrictToWindowEdges } from '@dnd-kit/modifiers';
import FullPageForm, {
  type FullPageFormSection,
} from '@/components/general/forms/FullPageForm';
import type { QuestionDraft } from '@/types';

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function emptyQuestion(order: number): QuestionDraft {
  return { id: uid(), text: '', type: 'TEXT', order };
}

type ProfessorFormValues = {
  title: string;
  professorName: string;
  className: string;
};

function GripIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
      <circle cx="6" cy="5" r="1.3" />
      <circle cx="6" cy="9" r="1.3" />
      <circle cx="6" cy="13" r="1.3" />
      <circle cx="12" cy="5" r="1.3" />
      <circle cx="12" cy="9" r="1.3" />
      <circle cx="12" cy="13" r="1.3" />
    </svg>
  );
}

export default function ProfessorPage() {
  const router = useRouter();
  const [values, setValues] = useState<ProfessorFormValues>({
    title: '',
    professorName: '',
    className: '',
  });
  const [questions, setQuestions] = useState<QuestionDraft[]>([emptyQuestion(0)]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setQuestions((qs) => {
        const from = qs.findIndex((q) => q.id === active.id);
        const to = qs.findIndex((q) => q.id === over.id);
        return arrayMove(qs, from, to);
      });
    }
  }, []);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!values.title.trim()) errs.title = 'Lab title is required';
    if (!values.professorName.trim()) errs.professorName = 'Professor name is required';
    if (!values.className.trim()) errs.className = 'Class is required';
    questions.forEach((q, i) => {
      if (!q.text.trim()) errs[`questions.${i}.text`] = 'Question text is required';
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/labs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, questions }),
      });
      if (!res.ok) throw new Error();
      const lab = await res.json();
      router.push(`/student/lab/${lab.id}`);
    } catch {
      setErrors((e) => ({ ...e, submit: 'Something went wrong. Please try again.' }));
    } finally {
      setSubmitting(false);
    }
  };

  const sections: FullPageFormSection<ProfessorFormValues, QuestionDraft>[] = [
    {
      kind: 'section',
      key: 'lab-details',
      title: 'Lab details',
      description: "This information will appear at the top of every student's report.",
      fields: [
        {
          kind: 'input',
          key: 'title',
          label: 'Lab title',
          placeholder: 'e.g. Enzyme Kinetics Lab',
          required: true,
          colSpan: 2,
        },
        {
          kind: 'input',
          key: 'professorName',
          label: 'Professor name',
          placeholder: 'Dr. Smith',
          required: true,
        },
        {
          kind: 'input',
          key: 'className',
          label: 'Class',
          placeholder: 'CHEM 3450',
          required: true,
        },
      ],
    },
    {
      kind: 'repeater',
      key: 'questions',
      title: 'Questions',
      description: 'Add each question students will answer. Drag to reorder.',
      addButtonLabel: 'Add question',
      emptyMessage: 'No questions yet — add one below.',
      items: questions,
      onAdd: () => setQuestions((qs) => [...qs, emptyQuestion(qs.length)]),
      onRemove: (i) => setQuestions((qs) => qs.filter((_, idx) => idx !== i)),
      getItemValue: (item, key) => (item as any)[key],
      setItemValue: (index, key, value) =>
        setQuestions((qs) =>
          qs.map((q, i) => (i === index ? { ...q, [key]: value } : q)),
        ),
      fields: [
        {
          kind: 'input',
          key: 'text',
          label: 'Question text',
          placeholder: 'e.g. Describe the reaction you observed…',
          required: true,
          colSpan: 2,
        },
        {
          kind: 'radio',
          key: 'type',
          label: 'Response format',
          options: [
            { label: 'Text answer', value: 'TEXT' },
            { label: 'Image upload', value: 'IMAGE' },
          ],
        },
        {
          kind: 'custom',
          key: 'drag-handle',
          colSpan: 1,
          render: () => (
            <div className="flex items-end justify-end pb-1">
              <span
                className="cursor-grab touch-none text-gray-300 hover:text-gray-500"
                title="Drag to reorder"
              >
                <GripIcon />
              </span>
            </div>
          ),
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100 py-10">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={questions.map((q) => q.id)}
          strategy={verticalListSortingStrategy}
        >
          <FullPageForm
            title="Create a lab report"
            intro="Set up the lab details and questions. Students will receive a link to fill in their answers."
            values={values}
            setValues={setValues}
            sections={sections}
            errors={errors}
            onSubmit={handleSubmit}
            submitLabel="Save lab & share with students"
            submitting={submitting}
            maxWidthClass="max-w-2xl"
          />
        </SortableContext>
      </DndContext>

      {errors.submit && (
        <p className="mx-auto mt-2 max-w-2xl px-6 text-sm text-red-500">{errors.submit}</p>
      )}
    </div>
  );
}
