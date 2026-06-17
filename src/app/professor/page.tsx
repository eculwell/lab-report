'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FiTrash2 } from 'react-icons/fi';
import SortableList, {
  DragHandle,
  type SortableItem,
} from '@/components/general/dnd/SortableList';
import Button from '@/components/general/actions/Button';
import IconButton from '@/components/general/actions/IconButton';
import FieldWrapper from '@/components/general/forms/FieldWrapper';
import TextLikeField from '@/components/general/forms/TextLikeField';
import RadioGroupField from '@/components/general/forms/RadioGroupField';
import type { QuestionType } from '@/types';

// SortableItem requires `id` — we extend with question fields
type QuestionItem = SortableItem & {
  text: string;
  type: QuestionType;
};

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function emptyQuestion(): QuestionItem {
  return { id: uid(), text: '', type: 'TEXT' };
}

const SECTION_TITLE_CLASS = 'text-2xl font-semibold text-byu-navy';
const SECTION_DESC_CLASS = 'text-sm text-gray-600 mt-1';

type LabValues = {
  title: string;
  professorName: string;
  className: string;
};

export default function ProfessorPage() {
  const router = useRouter();

  const [values, setValues] = useState<LabValues>({
    title: '',
    professorName: '',
    className: '',
  });
  const [questions, setQuestions] = useState<QuestionItem[]>([emptyQuestion()]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const updateQuestion = useCallback(
    (id: string, field: 'text' | 'type', value: string) => {
      setQuestions((qs) => qs.map((q) => (q.id === id ? { ...q, [field]: value } : q)));
      setErrors((e) => {
        const next = { ...e };
        delete next[`q_${id}_text`];
        return next;
      });
    },
    [],
  );

  const removeQuestion = useCallback(
    (id: string) => setQuestions((qs) => qs.filter((q) => q.id !== id)),
    [],
  );

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!values.title.trim()) errs.title = 'Lab title is required';
    if (!values.professorName.trim()) errs.professorName = 'Professor name is required';
    if (!values.className.trim()) errs.className = 'Class is required';
    if (questions.length === 0) errs.questions = 'Add at least one question';
    questions.forEach((q) => {
      if (!q.text.trim()) errs[`q_${q.id}_text`] = 'Question text is required';
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
        body: JSON.stringify({
          ...values,
          questions: questions.map((q, i) => ({
            id: q.id,
            text: q.text,
            type: q.type,
            order: i,
          })),
        }),
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

  return (
    <div className="min-h-screen bg-gray-100 py-10">
      <form
        onSubmit={handleSubmit}
        className="max-w-2xl mx-auto mt-4 mb-8 space-y-10 rounded-md bg-white p-6 shadow-md"
      >
        {/* Page title */}
        <div className="space-y-2">
          <h1 className="text-byu-navy text-3xl font-semibold">Create a lab report</h1>
          <p className="text-sm text-gray-700">
            Set up the lab details and questions. Students will receive a link to fill in their answers.
          </p>
        </div>

        {/* Lab details */}
        <section className="space-y-4">
          <div>
            <h2 className={SECTION_TITLE_CLASS}>Lab details</h2>
            <p className={SECTION_DESC_CLASS}>
              This information will appear at the top of every student's report.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <FieldWrapper label="Lab title" required error={errors.title}>
                <TextLikeField
                  as="input"
                  type="text"
                  value={values.title}
                  onChange={(v) => {
                    setValues((p) => ({ ...p, title: v }));
                    setErrors((e) => ({ ...e, title: '' }));
                  }}
                  placeholder="e.g. Enzyme Kinetics Lab"
                  includeTextColor
                />
              </FieldWrapper>
            </div>
            <FieldWrapper label="Professor name" required error={errors.professorName}>
              <TextLikeField
                as="input"
                type="text"
                value={values.professorName}
                onChange={(v) => {
                  setValues((p) => ({ ...p, professorName: v }));
                  setErrors((e) => ({ ...e, professorName: '' }));
                }}
                placeholder="Dr. Smith"
                includeTextColor
              />
            </FieldWrapper>
            <FieldWrapper label="Class" required error={errors.className}>
              <TextLikeField
                as="input"
                type="text"
                value={values.className}
                onChange={(v) => {
                  setValues((p) => ({ ...p, className: v }));
                  setErrors((e) => ({ ...e, className: '' }));
                }}
                placeholder="CHEM 3450"
                includeTextColor
              />
            </FieldWrapper>
          </div>
        </section>

        {/* Questions */}
        <section className="space-y-4">
          <div>
            <h2 className={SECTION_TITLE_CLASS}>Questions</h2>
            <p className={SECTION_DESC_CLASS}>
              Add each question students will answer. Drag the handle to reorder.
            </p>
          </div>

          {errors.questions && (
            <p className="text-sm text-red-500">{errors.questions}</p>
          )}

          <SortableList
            items={questions}
            onReorder={setQuestions}
            lockAxis
            renderItem={(item, dragHandleProps) => (
              <div className="border border-gray-300 rounded-md p-4 bg-white shadow-sm">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <FieldWrapper
                      label="Question text"
                      required
                      error={errors[`q_${item.id}_text`]}
                    >
                      <TextLikeField
                        as="input"
                        type="text"
                        value={item.text}
                        onChange={(v) => updateQuestion(item.id as string, 'text', v)}
                        placeholder="e.g. Describe the reaction you observed…"
                        includeTextColor
                      />
                    </FieldWrapper>
                  </div>

                  <FieldWrapper label="Response format">
                    <RadioGroupField
                      name={`type-${item.id}`}
                      value={item.type}
                      onChange={(v) => updateQuestion(item.id as string, 'type', v)}
                      options={[
                        { label: 'Text answer', value: 'TEXT' },
                        { label: 'Image upload', value: 'IMAGE' },
                      ]}
                    />
                  </FieldWrapper>

                  <div className="flex items-end justify-end gap-2 pb-1">
                    <DragHandle {...dragHandleProps} />
                    {questions.length > 1 && (
                      <IconButton
                        type="button"
                        variant="danger"
                        icon={<FiTrash2 className="h-4 w-4" />}
                        onClick={() => removeQuestion(item.id as string)}
                        title="Remove question"
                      />
                    )}
                  </div>
                </div>
              </div>
            )}
          />

          <Button
            type="button"
            variant="subtle"
            size="sm"
            onClick={() => setQuestions((qs) => [...qs, emptyQuestion()])}
            icon={<span className="text-base leading-none">+</span>}
            label="Add question"
          />
        </section>

        {errors.submit && (
          <p className="text-sm text-red-500">{errors.submit}</p>
        )}

        <div className="flex justify-center pt-2">
          <Button
            type="submit"
            size="lg"
            disabled={submitting}
            loading={submitting}
            loadingLabel="Saving…"
            label="Save lab & share with students"
          />
        </div>
      </form>
    </div>
  );
}
