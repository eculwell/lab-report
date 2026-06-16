'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Lab, SubmissionFormValues, AnswerDraft } from '@/types';

export default function StudentLabPage() {
  const { labId } = useParams<{ labId: string }>();
  const router = useRouter();

  const [lab, setLab] = useState<Lab | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [values, setValues] = useState<SubmissionFormValues>({
    studentName: '',
    answers: {},
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    async function fetchLab() {
      try {
        const res = await fetch(`/api/labs/${labId}`);
        if (!res.ok) throw new Error('Not found');
        const data: Lab = await res.json();
        setLab(data);
        // Initialize answer drafts
        const initialAnswers: Record<string, AnswerDraft> = {};
        data.questions.forEach((q) => {
          initialAnswers[q.id] = { textContent: '', imageFile: null, imagePreviewUrl: null };
        });
        setValues((v) => ({ ...v, answers: initialAnswers }));
      } catch {
        setErrors({ fetch: 'Could not load this lab. Check the link and try again.' });
      } finally {
        setLoading(false);
      }
    }
    fetchLab();
  }, [labId]);

  const setAnswer = useCallback((questionId: string, patch: Partial<AnswerDraft>) => {
    setValues((v) => ({
      ...v,
      answers: {
        ...v.answers,
        [questionId]: { ...v.answers[questionId], ...patch },
      },
    }));
    setErrors((e) => ({ ...e, [questionId]: '' }));
  }, []);

  const handleImageSelect = useCallback(
    (questionId: string, file: File) => {
      const previewUrl = URL.createObjectURL(file);
      setAnswer(questionId, { imageFile: file, imagePreviewUrl: previewUrl });
    },
    [setAnswer],
  );

  const clearImage = useCallback(
    (questionId: string) => {
      const prev = values.answers[questionId];
      if (prev?.imagePreviewUrl) URL.revokeObjectURL(prev.imagePreviewUrl);
      setAnswer(questionId, { imageFile: null, imagePreviewUrl: null });
    },
    [values.answers, setAnswer],
  );

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!values.studentName.trim()) errs.studentName = 'Your name is required';
    if (lab) {
      lab.questions.forEach((q) => {
        const ans = values.answers[q.id];
        if (q.type === 'TEXT' && !ans?.textContent?.trim()) {
          errs[q.id] = 'Please enter an answer';
        }
        if (q.type === 'IMAGE' && !ans?.imageFile) {
          errs[q.id] = 'Please upload an image';
        }
      });
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lab || !validate()) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('labId', lab.id);
      fd.append('studentName', values.studentName.trim());
      lab.questions.forEach((q) => {
        const ans = values.answers[q.id];
        if (q.type === 'IMAGE' && ans?.imageFile) {
          fd.append(`answer_${q.id}`, ans.imageFile);
        } else {
          fd.append(`answer_${q.id}`, ans?.textContent ?? '');
        }
      });
      const res = await fetch('/api/submissions', { method: 'POST', body: fd });
      if (!res.ok) throw new Error('Submission failed');
      const submission = await res.json();
      router.push(`/student/print/${submission.id}`);
    } catch {
      setErrors({ submit: 'Something went wrong. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-400">Loading lab…</p>
      </main>
    );
  }

  if (errors.fetch || !lab) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-sm text-red-500">{errors.fetch ?? 'Lab not found.'}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-2xl px-4">
        {/* Lab header */}
        <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium uppercase tracking-widest text-gray-400">
            Lab report
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-gray-900">{lab.title}</h1>
          <p className="mt-2 text-sm text-gray-500">
            {lab.professorName} &nbsp;·&nbsp; {lab.className}
          </p>
          <div className="mt-4 border-t border-gray-100 pt-4">
            <label className="mb-1.5 block text-sm font-medium text-gray-600">Your name</label>
            <input
              type="text"
              value={values.studentName}
              onChange={(e) =>
                setValues((v) => ({ ...v, studentName: e.target.value }))
              }
              placeholder="First and last name"
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                errors.studentName
                  ? 'border-red-300 focus:ring-red-200'
                  : 'border-gray-200 focus:border-gray-400 focus:ring-gray-100'
              }`}
            />
            {errors.studentName && (
              <p className="mt-1 text-xs text-red-500">{errors.studentName}</p>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-4">
            {lab.questions.map((q, i) => {
              const ans = values.answers[q.id] ?? {
                textContent: '',
                imageFile: null,
                imagePreviewUrl: null,
              };
              return (
                <div
                  key={q.id}
                  className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
                >
                  <p className="mb-3 text-sm font-semibold text-gray-800">
                    <span className="mr-2 text-gray-400">Q{i + 1}.</span>
                    {q.text || `Question ${i + 1}`}
                  </p>

                  {q.type === 'TEXT' ? (
                    <textarea
                      value={ans.textContent}
                      onChange={(e) =>
                        setAnswer(q.id, { textContent: e.target.value })
                      }
                      rows={4}
                      placeholder="Write your answer here…"
                      className={`w-full resize-y rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                        errors[q.id]
                          ? 'border-red-300 focus:ring-red-200'
                          : 'border-gray-200 focus:border-gray-400 focus:ring-gray-100'
                      }`}
                    />
                  ) : ans.imagePreviewUrl ? (
                    <div className="relative inline-block">
                      <img
                        src={ans.imagePreviewUrl}
                        alt="Answer preview"
                        className="max-h-48 rounded-lg border border-gray-200 object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => clearImage(q.id)}
                        className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white text-xs text-gray-500 shadow hover:bg-red-50 hover:text-red-400"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRefs.current[q.id]?.click()}
                      className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-8 text-sm transition-colors ${
                        errors[q.id]
                          ? 'border-red-300 bg-red-50'
                          : 'border-gray-200 bg-gray-50 hover:border-gray-400 hover:bg-white'
                      }`}
                    >
                      <UploadIcon />
                      <span className="text-gray-500">Click to upload image</span>
                      <input
                        ref={(el) => { fileInputRefs.current[q.id] = el; }}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageSelect(q.id, file);
                        }}
                      />
                    </div>
                  )}

                  {errors[q.id] && (
                    <p className="mt-1.5 text-xs text-red-500">{errors[q.id]}</p>
                  )}
                </div>
              );
            })}
          </div>

          {errors.submit && (
            <p className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
              {errors.submit}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 w-full rounded-xl bg-gray-900 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? 'Submitting…' : 'Submit & save as PDF →'}
          </button>
        </form>
      </div>
    </main>
  );
}

function UploadIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="text-gray-400"
    >
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
    </svg>
  );
}
