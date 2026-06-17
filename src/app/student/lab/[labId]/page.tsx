'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import FullPageForm, {
  type FullPageFormSection,
  type FullPageFormField,
} from '@/components/general/forms/FullPageForm';
import { useDraftAnswers, dataUrlToFile } from '@/hooks/useDraftAnswers';
import type { Lab } from '@/types';

type StudentValues = Record<string, string | File | null>;

function ImageAnswerField({
  value,
  setValue,
  error,
}: {
  value: File | null;
  setValue: (f: File | null) => void;
  error?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Update preview URL when value changes, revoke old one to avoid memory leaks
  useEffect(() => {
    if (!value) { setPreviewUrl(null); return; }
    const url = URL.createObjectURL(value);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [value]);

  return (
    <div className="flex flex-col gap-1 md:col-span-2">
      {previewUrl ? (
        <div className="relative inline-block">
          <img
            src={previewUrl}
            alt="Answer preview"
            className="max-h-48 rounded-md border border-gray-200 object-contain"
          />
          <button
            type="button"
            onClick={() => setValue(null)}
            className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white text-xs text-gray-500 shadow hover:bg-red-50 hover:text-red-500"
          >
            ×
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => ref.current?.click()}
          className={`flex w-full items-center justify-center gap-2 rounded-md border-2 border-dashed py-6 text-sm transition-colors ${
            error
              ? 'border-red-300 bg-red-50 text-red-400'
              : 'border-gray-300 bg-gray-50 text-gray-500 hover:border-byu-navy hover:bg-white hover:text-byu-navy'
          }`}
        >
          <UploadIcon />
          Click to upload image
        </button>
      )}
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0] ?? null;
          if (file) setValue(file);
          e.target.value = '';
        }}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

export default function StudentLabPage() {
  const { labId } = useParams<{ labId: string }>();
  const router = useRouter();

  const [lab, setLab] = useState<Lab | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [values, setValues] = useState<StudentValues>({ studentName: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  // Prevents auto-save from firing before the draft has been loaded
  const draftLoadedRef = useRef(false);

  const { loadDraft, saveStudentName, saveText, saveImage, clearImage, clearDraft } =
    useDraftAnswers(labId);

  // Fetch lab and merge any saved draft into the initial values
  useEffect(() => {
    async function fetchLab() {
      try {
        const res = await fetch(`/api/labs/${labId}`);
        if (!res.ok) throw new Error();
        const data: Lab = await res.json();
        setLab(data);

        const draft = loadDraft();
        const hasDraft =
          draft.studentName ||
          Object.keys(draft.textAnswers).length > 0 ||
          Object.keys(draft.imageDataUrls).length > 0;

        // Build initial values, merging in saved draft
        const init: StudentValues = {
          studentName: draft.studentName || '',
        };
        data.questions.forEach((q) => {
          if (q.type === 'IMAGE') {
            const saved = draft.imageDataUrls[q.id];
            init[q.id] = saved ? dataUrlToFile(saved) : null;
          } else {
            init[q.id] = draft.textAnswers[q.id] ?? '';
          }
        });

        draftLoadedRef.current = true;
        setValues(init);
        if (hasDraft) setDraftRestored(true);
      } catch {
        setFetchError('Could not load this lab. Check the link and try again.');
      } finally {
        setLoading(false);
      }
    }
    fetchLab();
  }, [labId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-save text answers and student name whenever values change
  useEffect(() => {
    if (!draftLoadedRef.current || !lab) return;
    saveStudentName(String(values.studentName ?? ''));
    lab.questions.forEach((q) => {
      if (q.type === 'TEXT') saveText(q.id, String(values[q.id] ?? ''));
    });
  }, [values, lab, saveStudentName, saveText]);

  const validate = (): boolean => {
    if (!lab) return false;
    const errs: Record<string, string> = {};
    if (!String(values.studentName ?? '').trim()) errs.studentName = 'Your name is required';
    lab.questions.forEach((q) => {
      const ans = values[q.id];
      if (q.type === 'TEXT' && !String(ans ?? '').trim()) errs[q.id] = 'Please enter an answer';
      if (q.type === 'IMAGE' && !ans) errs[q.id] = 'Please upload an image';
    });
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
      fd.append('studentName', String(values.studentName ?? '').trim());
      lab.questions.forEach((q) => {
        const ans = values[q.id];
        if (q.type === 'IMAGE' && ans instanceof File) {
          fd.append(`answer_${q.id}`, ans);
        } else {
          fd.append(`answer_${q.id}`, String(ans ?? ''));
        }
      });
      const res = await fetch('/api/submissions', { method: 'POST', body: fd });
      if (!res.ok) throw new Error();
      const sub = await res.json();
      clearDraft(); // wipe saved draft on successful submission
      router.push(`/student/print/${sub.id}`);
    } catch {
      setErrors((e) => ({ ...e, submit: 'Something went wrong. Please try again.' }));
    } finally {
      setSubmitting(false);
    }
  };

  // Memoize sections so they're not rebuilt on every render
  const sections = useMemo((): FullPageFormSection<StudentValues>[] => {
    if (!lab) return [];
    return [
      {
        kind: 'section',
        key: 'student-info',
        title: lab.title,
        description: `${lab.professorName} · ${lab.className}`,
        fields: [
          {
            kind: 'input',
            key: 'studentName',
            label: 'Your name',
            placeholder: 'First and last name',
            required: true,
            colSpan: 2,
          },
        ],
      },
      {
        kind: 'section',
        key: 'answers',
        title: 'Your answers',
        fields: lab.questions.flatMap((q, i): FullPageFormField<StudentValues>[] => {
          if (q.type === 'IMAGE') {
            return [
              {
                kind: 'custom',
                key: q.id,
                colSpan: 2,
                render: ({ value, setValue }) => {
                  // Wrap setValue to also persist/clear the image in localStorage
                  const handleSetImage = (file: File | null) => {
                    setValue(file);
                    if (file) saveImage(q.id, file);
                    else clearImage(q.id);
                  };
                  return (
                    <div className="flex flex-col gap-1 md:col-span-2">
                      <p className="text-sm font-medium text-gray-700">
                        <span className="mr-1 text-gray-400">Q{i + 1}.</span>
                        {q.text || `Question ${i + 1}`}
                        <span className="ml-0.5 text-red-500">*</span>
                      </p>
                      <ImageAnswerField
                        value={value as File | null}
                        setValue={handleSetImage}
                        error={errors[q.id]}
                      />
                    </div>
                  );
                },
              },
            ];
          }
          return [
            {
              kind: 'input',
              key: q.id,
              label: `Q${i + 1}. ${q.text || `Question ${i + 1}`}`,
              type: 'textarea',
              placeholder: 'Write your answer here…',
              required: true,
              colSpan: 2,
            },
          ];
        }),
      },
    ];
  }, [lab, errors, saveImage, clearImage]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <p className="text-sm text-gray-400">Loading lab…</p>
      </div>
    );
  }

  if (fetchError || !lab) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <p className="text-sm text-red-500">{fetchError || 'Lab not found.'}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-10">
      {/* Draft restored banner */}
      {draftRestored && (
        <div className="mx-auto mb-4 max-w-2xl px-4">
          <div className="flex items-center justify-between rounded-md border border-green-200 bg-green-50 px-4 py-2.5 text-sm text-green-700">
            <span>✓ Your previous answers have been restored.</span>
            <button
              type="button"
              onClick={() => setDraftRestored(false)}
              className="ml-4 text-green-500 hover:text-green-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <FullPageForm
        values={values}
        setValues={setValues}
        sections={sections}
        errors={errors}
        onSubmit={handleSubmit}
        submitLabel="Save as PDF"
        submitting={submitting}
        maxWidthClass="max-w-2xl"
      />

      {errors.submit && (
        <p className="mx-auto mt-2 max-w-2xl px-6 text-sm text-red-500">{errors.submit}</p>
      )}

      {/* Subtle auto-save indicator */}
      {draftLoadedRef.current && !submitting && (
        <p className="mt-2 text-center text-xs text-gray-400">
          Progress saved automatically
        </p>
      )}
    </div>
  );
}

function UploadIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
    </svg>
  );
}
