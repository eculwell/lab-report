'use client';

import type { ReactNode } from 'react';

type Variant = 'primary' | 'subtle' | 'danger' | 'ghost';

type Props = {
  icon: ReactNode;
  type?: 'button' | 'submit' | 'reset';
  variant?: Variant;
  onClick?: () => void;
  title?: string;
  disabled?: boolean;
};

const variantClass: Record<Variant, string> = {
  primary: 'bg-byu-navy text-white hover:bg-blue-900',
  subtle: 'bg-gray-100 text-gray-600 hover:bg-gray-200',
  danger: 'bg-red-50 text-red-500 hover:bg-red-100',
  ghost: 'bg-transparent text-gray-500 hover:bg-gray-100',
};

export default function IconButton({
  icon,
  type = 'button',
  variant = 'subtle',
  onClick,
  title,
  disabled = false,
}: Props) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 ${variantClass[variant]}`}
    >
      {icon}
    </button>
  );
}
