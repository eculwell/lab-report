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
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import QuestionCard from '@/components/lab-report/QuestionCard';
import { LabFormValues, QuestionDraft, QuestionType } from '@/types';

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

const emptyValues: LabFormValues = {
  title: '',
  professorName: '',
  className: '',
  questions: [],
};

export default function ProfessorPage() {
  const router = useRouter();
  const [values, setValues] = useState<LabFormValues>(emptyValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const setField = useCallback(
    (field: keyof Omit<LabFormValues, 'questions'>, value: string) => {
      setValues((v) => ({ ...v, [field]: value }));
      setErrors((e) => ({ ...e, [field]: '' }));
    },
    [],
  );

  const addQuestion = useCallback(() => {
    const q: QuestionDraft = {
      id: generateId(),
      text: '',
      type: 'TEXT',
      order: values.questions.length,
    };
    setValues((v) => ({ ...v, questions: [...v.questions, q] }));
  }, [values.questions.length]);

  const updateQuestion = useCallback(
    (id: string, field: keyof QuestionDraft, value: string | QuestionType) => {
      setValues((v) => ({
        ...v,
        questions: v.questions.map((q) => (q.id === id ? { ...q, [field]: value } : q)),
      }));
    },
    [],
  );

  const deleteQuestion = useCallback((id: string) => {
    setValues((v) => ({
      ...v,
      questions: v.questions.filter((q) => q.id !== id),
    }));
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setValues((v) => {
        const oldIndex = v.questions.findIndex((q) => q.id === active.id);
        const newIndex = v.questions.findIndex((q) => q.id === over.id);
        return { ...v, questions: arrayMove(v.questions, oldIndex, newIndex) };
      });
    }
  }, []);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!values.title.trim()) errs.title = 'Lab title is required';
    if (!values.professorName.trim()) errs.professorName = 'Professor name is required';
    if (!values.className.trim()) errs.className = 'Class is required';
    if (values.questions.length === 0) errs.questions = 'Add at least one question';
    values.questions.forEach((q, i) => {
      if (!q.text.trim()) errs[`q_${q.id}`] = `Question ${i + 1} needs text`;
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
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error('Failed to save lab');
      const lab = await res.json();
      router.push(`/student/lab/${lab.id}`);
    } catch (err) {
      console.error(err);
      setErrors({ submit: 'Something went wrong. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-2xl px-4">
        <header className="mb-8">
          <p className="text-sm font-medium uppercase tracking-widest text-gray-400">
            Professor setup
          </p>
          <h1 className="mt-1 text-3xl font-semibold text-gray-900">Create a lab report</h1>
        </header>

        <form onSubmit={handleSubmit} noValidate>
          {/* Lab details */}
          <section className="mb-8 space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-700">Lab details</h2>

            <Field
              label="Lab title"
              error={errors.title}
              input={
                <input
                  type="text"
                  value={values.title}
                  onChange={(e) => setField('title', e.target.value)}
                  placeholder="e.g. Enzyme Kinetics Lab"
                  className={inputClass(!!errors.title)}
                />
              }
            />
            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Professor name"
                error={errors.professorName}
                input={
                  <input
                    type="text"
                    value={values.professorName}
                    onChange={(e) => setField('professorName', e.target.value)}
                    placeholder="Dr. Smith"
                    className={inputClass(!!errors.professorName)}
                  />
                }
              />
              <Field
                label="Class"
                error={errors.className}
                input={
                  <input
                    type="text"
                    value={values.className}
                    onChange={(e) => setField('className', e.target.value)}
                    placeholder="CHEM 3450"
                    className={inputClass(!!errors.className)}
                  />
                }
              />
            </div>
          </section>

          {/* Questions */}
          <section className="mb-8">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-700">Questions</h2>
              {errors.questions && (
                <p className="text-xs text-red-500">{errors.questions}</p>
              )}
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              modifiers={[restrictToVerticalAxis]}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={values.questions.map((q) => q.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {values.questions.map((q, i) => (
                    <div key={q.id}>
                      <QuestionCard
                        question={q}
                        index={i}
                        onChange={updateQuestion}
                        onDelete={deleteQuestion}
                      />
                      {errors[`q_${q.id}`] && (
                        <p className="mt-1 pl-10 text-xs text-red-500">
                          {errors[`q_${q.id}`]}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            <button
              type="button"
              onClick={addQuestion}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 py-3 text-sm text-gray-500 transition-colors hover:border-gray-400 hover:bg-white hover:text-gray-700"
            >
              <span className="text-lg leading-none">+</span> Add question
            </button>
          </section>

          {errors.submit && (
            <p className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
              {errors.submit}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-gray-900 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? 'Saving…' : 'Save lab & share with students →'}
          </button>
        </form>
      </div>
    </main>
  );
}

function Field({
  label,
  error,
  input,
}: {
  label: string;
  error?: string;
  input: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-600">{label}</label>
      {input}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

function inputClass(hasError: boolean) {
  return `w-full rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-1 ${
    hasError
      ? 'border-red-300 focus:ring-red-200'
      : 'border-gray-200 focus:border-gray-400 focus:ring-gray-100'
  }`;
}
