'use client';

import type { ReactNode } from 'react';

type Variant = 'primary' | 'subtle' | 'danger' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

type Props = {
  label: string;
  type?: 'button' | 'submit' | 'reset';
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  loadingLabel?: string;
  icon?: ReactNode;
  onClick?: () => void;
};

const variantClass: Record<Variant, string> = {
  primary:
    'bg-byu-navy text-white hover:bg-blue-900 focus:ring-byu-navy disabled:bg-byu-navy/50',
  subtle:
    'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-300 disabled:bg-gray-100/50',
  danger:
    'bg-red-600 text-white hover:bg-red-700 focus:ring-red-400 disabled:bg-red-300',
  ghost:
    'bg-transparent text-byu-navy underline hover:text-blue-900 disabled:opacity-50',
};

const sizeClass: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-6 py-2.5 text-base gap-2',
};

export default function Button({
  label,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  loadingLabel,
  icon,
  onClick,
}: Props) {
  const isDisabled = disabled || loading;
  const displayLabel = loading && loadingLabel ? loadingLabel : label;

  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-md font-medium shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed ${variantClass[variant]} ${sizeClass[size]}`}
    >
      {loading ? (
        <svg
          className="h-4 w-4 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      ) : icon ? (
        <span aria-hidden="true">{icon}</span>
      ) : null}
      {displayLabel}
    </button>
  );
}
