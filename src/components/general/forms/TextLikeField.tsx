'use client';

import type { ReactNode } from 'react';

type BaseProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  adornment?: ReactNode;
  includeTextColor?: boolean;
};

type InputProps = BaseProps & {
  as: 'input';
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  rows?: never;
};

type TextareaProps = BaseProps & {
  as: 'textarea';
  rows?: number;
  type?: never;
  inputMode?: never;
};

type Props = InputProps | TextareaProps;

const BASE =
  'w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:border-byu-navy focus:outline-none focus:ring-1 focus:ring-byu-navy disabled:bg-gray-50 disabled:text-gray-500';

export default function TextLikeField(props: Props) {
  const { value, onChange, placeholder, adornment, includeTextColor } = props;

  const cls = `${BASE} ${adornment ? 'pr-10' : ''} ${includeTextColor ? 'text-gray-900' : ''}`;

  const inner =
    props.as === 'textarea' ? (
      <textarea
        className={cls}
        value={value}
        rows={props.rows ?? 4}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    ) : (
      <input
        className={cls}
        type={props.type ?? 'text'}
        value={value}
        placeholder={placeholder}
        inputMode={props.inputMode}
        onChange={(e) => onChange(e.target.value)}
      />
    );

  if (!adornment) return inner;

  return (
    <div className="relative">
      {inner}
      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
        {adornment}
      </div>
    </div>
  );
}
