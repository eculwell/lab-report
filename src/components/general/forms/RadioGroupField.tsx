'use client';

type Option = { label: string; value: string };

type Props = {
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
};

export default function RadioGroupField({ name, value, onChange, options }: Props) {
  return (
    <div className="flex flex-wrap gap-4">
      {options.map((o) => (
        <label key={o.value} className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
          <input
            type="radio"
            name={name}
            value={o.value}
            checked={value === o.value}
            onChange={() => onChange(o.value)}
            className="accent-byu-navy"
          />
          {o.label}
        </label>
      ))}
    </div>
  );
}
