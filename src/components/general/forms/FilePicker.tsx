'use client';

import { useRef } from 'react';
import { FiUpload, FiX } from 'react-icons/fi';

type Props = {
  value: File | null;
  onChange: (file: File | null) => void;
  accept?: string;
};

export default function FilePicker({ value, onChange, accept }: Props) {
  const ref = useRef<HTMLInputElement>(null);

  return (
    <div>
      {value ? (
        <div className="flex items-center gap-2 rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-700">
          <span className="flex-1 truncate">{value.name}</span>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-gray-400 hover:text-red-500"
            aria-label="Remove file"
          >
            <FiX className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => ref.current?.click()}
          className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-gray-300 bg-gray-50 px-3 py-3 text-sm text-gray-500 transition-colors hover:border-byu-navy hover:bg-white hover:text-byu-navy"
        >
          <FiUpload className="h-4 w-4" />
          Choose file
        </button>
      )}
      <input
        ref={ref}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0] ?? null;
          onChange(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}
