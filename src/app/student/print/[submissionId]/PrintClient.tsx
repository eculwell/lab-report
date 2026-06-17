'use client';

interface Answer {
  questionId: string;
  textContent?: string | null;
  imageUrl?: string | null;
}

interface Question {
  id: string;
  text: string;
  type: string;
  order: number;
}

interface PrintData {
  id: string;
  studentName: string;
  createdAt: string;
  lab: {
    title: string;
    professorName: string;
    className: string;
    questions: Question[];
  };
  answers: Answer[];
}

export default function PrintClient({ data }: { data: PrintData }) {
  const answerMap = Object.fromEntries(data.answers.map((a) => [a.questionId, a]));

  return (
    <main className="min-h-screen bg-gray-50 py-12 print:bg-white print:py-0">
      <div className="mx-auto max-w-2xl px-4 print:max-w-none print:px-8">
        {/* Print action bar — hidden when printing */}
        <div className="mb-8 flex items-center justify-between print:hidden">
          <p className="text-sm text-gray-500">Preview lab report</p>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
          >
            <PrinterIcon /> Save as PDF
          </button>
        </div>

        {/* Report */}
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm print:rounded-none print:border-none print:shadow-none">
          {/* Header */}
          <div className="mb-8 border-b border-gray-100 pb-6">
            <h1 className="text-2xl font-semibold text-gray-900 break-words">{data.lab.title}</h1>
            <p className="mt-1 text-sm text-gray-500">
              {data.lab.professorName}&nbsp;·&nbsp;{data.lab.className}
            </p>
            <p className="mt-3 text-base font-medium text-gray-800">
              {data.studentName}
            </p>
            <p className="text-xs text-gray-400">
              {new Date(data.createdAt).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>

          {/* Q&A */}
          <div className="space-y-8">
            {data.lab.questions.map((q, i) => {
              const ans = answerMap[q.id];
              return (
                <div key={q.id} className="break-inside-avoid">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-400">
                    Question {i + 1}
                  </p>
                  <p className="mb-3 text-sm font-medium text-gray-800">
                    {q.text || `Question ${i + 1}`}
                  </p>
                  {ans?.imageUrl ? (
                    <img
                      src={ans.imageUrl}
                      alt={`Answer to question ${i + 1}`}
                      className="max-w-full rounded-lg border border-gray-100"
                      style={{ pageBreakInside: 'avoid' }}
                    />
                  ) : q.type === 'IMAGE' && !ans?.imageUrl ? (
                    <div className="min-h-[4rem] rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-400 italic">
                      No image uploaded
                    </div>
                  ) : (
                    <div className="min-h-[4rem] rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-700 whitespace-pre-wrap">
                      {ans?.textContent || <span className="text-gray-400 italic">No answer</span>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}

function PrinterIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  );
}
