export type InputField = {
  kind: 'input';
  key: string;
  label: string;
  type?: 'text' | 'email' | 'number' | 'textarea' | 'pin' | 'file' | 'password';
  placeholder?: string;
  required?: boolean;
  helperText?: string;
  colSpan?: 1 | 2;
  adornment?: React.ReactNode;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  accept?: string; // for file inputs
};

export type SelectField = {
  kind: 'select';
  key: string;
  label: string;
  options: { label: string; value: string }[];
  placeholder?: string;
  required?: boolean;
  helperText?: string;
  colSpan?: 1 | 2;
};

export type RadioField = {
  kind: 'radio';
  key: string;
  label: string;
  options: { label: string; value: string }[];
  required?: boolean;
  helperText?: string;
  colSpan?: 1 | 2;
};

export type CustomField<TItem = any> = {
  kind: 'custom';
  key: string;
  colSpan?: 1 | 2;
  render: (props: {
    value: any;
    setValue: (value: any) => void;
    item?: TItem;
    itemIndex?: number;
  }) => React.ReactNode;
};
