'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { QuestionDraft, QuestionType } from '@/types';

interface Props {
  question: QuestionDraft;
  index: number;
  onChange: (id: string, field: keyof QuestionDraft, value: string | QuestionType) => void;
  onDelete: (id: string) => void;
}

export default function QuestionCard({ question, index, onChange, onDelete }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: question.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="mt-1 cursor-grab touch-none text-gray-300 hover:text-gray-500 active:cursor-grabbing"
        aria-label="Drag to reorder"
      >
        <GripIcon />
      </button>

      <div className="flex flex-1 flex-col gap-3">
        <div className="flex items-center gap-3">
          <span className="min-w-[2rem] text-xs font-semibold text-gray-400">Q{index + 1}</span>
          <input
            type="text"
            value={question.text}
            onChange={(e) => onChange(question.id, 'text', e.target.value)}
            placeholder="Enter question text…"
            className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-400 focus:bg-white focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 pl-8">
          <span className="text-xs text-gray-400">Response format:</span>
          <div className="flex overflow-hidden rounded-lg border border-gray-200">
            <TypeButton
              active={question.type === 'TEXT'}
              onClick={() => onChange(question.id, 'type', 'TEXT')}
              label="Text"
            />
            <TypeButton
              active={question.type === 'IMAGE'}
              onClick={() => onChange(question.id, 'type', 'IMAGE')}
              label="Image"
            />
          </div>
        </div>
      </div>

      <button
        onClick={() => onDelete(question.id)}
        className="mt-1 rounded p-1 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-400"
        aria-label="Remove question"
      >
        <XIcon />
      </button>
    </div>
  );
}

function TypeButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? 'bg-gray-900 text-white'
          : 'bg-white text-gray-500 hover:bg-gray-50'
      }`}
    >
      {label}
    </button>
  );
}

function GripIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <circle cx="5" cy="4" r="1.2" />
      <circle cx="5" cy="8" r="1.2" />
      <circle cx="5" cy="12" r="1.2" />
      <circle cx="11" cy="4" r="1.2" />
      <circle cx="11" cy="8" r="1.2" />
      <circle cx="11" cy="12" r="1.2" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  );
}
