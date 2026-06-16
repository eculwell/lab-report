'use client';

import { FiEye, FiEyeOff } from 'react-icons/fi';

type Props = {
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggleVisible: () => void;
  placeholder?: string;
};

export default function PinField({ value, onChange, visible, onToggleVisible, placeholder }: Props) {
  return (
    <div className="relative">
      <input
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 pr-10 text-sm text-gray-900 shadow-sm focus:border-byu-navy focus:outline-none focus:ring-1 focus:ring-byu-navy"
      />
      <button
        type="button"
        onClick={onToggleVisible}
        className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
        aria-label={visible ? 'Hide' : 'Show'}
      >
        {visible ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
      </button>
    </div>
  );
}
