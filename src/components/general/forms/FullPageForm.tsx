'use client';

import { useState, type ReactNode } from 'react';
import { FiTrash2 } from 'react-icons/fi';
import Button from '@/components/general/actions/Button';
import FilePicker from '@/components/general/forms/FilePicker';
import FieldWrapper from '@/components/general/forms/FieldWrapper';
import SelectField from '@/components/general/forms/SelectField';
import RadioGroupField from '@/components/general/forms/RadioGroupField';
import TextLikeField from '@/components/general/forms/TextLikeField';
import PinField from '@/components/general/forms/PinField';
import type {
  CustomField,
  InputField,
  RadioField,
  SelectField as SelectFieldType,
} from '@/components/general/forms/formFieldTypes';
import IconButton from '../actions/IconButton';

// A standard section renders a fixed list of fields
type StandardSection<TValues> = {
  kind: 'section';
  key: string;
  title: string;
  description?: string;
  fields: FullPageFormField<TValues>[];
};

// A repeater section lets users add/remove groups of the same fields
type RepeaterSection<TItem> = {
  kind: 'repeater';
  key: string;
  title: string;
  description?: string;
  addButtonLabel: string;
  items: TItem[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  getItemValue: (item: TItem, key: string) => any;
  setItemValue: (index: number, key: string, value: any) => void;
  fields: FullPageFormField<TItem>[];
  emptyMessage?: string;
};

export type FullPageFormField<TItem = any> =
  | InputField
  | SelectFieldType
  | RadioField
  | CustomField<TItem>;

export type FullPageFormSection<TValues, TRepeaterItem = any> =
  | StandardSection<TValues>
  | RepeaterSection<TRepeaterItem>;

type FullPageFormProps<TValues, TRepeaterItem = any> = {
  title?: string;
  intro?: string;
  values: TValues;
  setValues: (next: TValues) => void;
  sections: FullPageFormSection<TValues, TRepeaterItem>[];
  errors?: Record<string, string>;
  onSubmit: (e: React.FormEvent) => void;
  submitLabel?: string;
  submitting?: boolean;
  maxWidthClass?: string;
};

const SECTION_TITLE_CLASS = 'text-2xl font-semibold text-byu-navy';
const SECTION_DESC_CLASS = 'text-sm text-gray-600 mt-1';
const BOX_CLASS = 'border border-gray-300 rounded-md p-4 space-y-6 bg-white shadow-sm';

export default function FullPageForm<TValues extends Record<string, any>, TRepeaterItem = any>({
  title,
  intro,
  values,
  setValues,
  sections,
  errors,
  onSubmit,
  submitLabel = 'Submit',
  submitting = false,
  maxWidthClass = 'max-w-4xl',
}: FullPageFormProps<TValues, TRepeaterItem>) {
  const [pinVisible, setPinVisible] = useState<Record<string, boolean>>({});

  const setFieldValue = (key: string, value: any) => {
    setValues({ ...values, [key]: value });
  };

  const isPinVisible = (key: string) => Boolean(pinVisible[key]);
  const togglePinVisible = (key: string) =>
    setPinVisible((prev) => ({ ...prev, [key]: !prev[key] }));

  const renderField = (
    field: FullPageFormField<any>,
    value: any,
    setValue: (value: any) => void,
    errorText?: string,
    item?: any,
    itemIndex?: number,
  ) => {
    const colSpan = field.colSpan ?? 1;
    const colClass = colSpan === 2 ? 'md:col-span-2' : '';

    if (field.kind === 'custom') {
      return (
        <div key={field.key} className={colClass}>
          {field.render({ value, setValue, item, itemIndex })}
        </div>
      );
    }

    return (
      <FieldWrapper
        key={field.key}
        className={colClass}
        label={field.label}
        required={field.required}
        helperText={field.helperText}
        error={errorText}
      >
        {field.kind === 'select' ? (
          <SelectField
            value={value ?? ''}
            onChange={(nextValue) => setValue(nextValue)}
            options={field.options}
            placeholder={field.placeholder}
          />
        ) : field.kind === 'radio' ? (
          <RadioGroupField
            name={`${field.key}-${itemIndex ?? 'main'}`}
            value={value}
            onChange={(nextValue) => setValue(nextValue)}
            options={field.options}
          />
        ) : field.type === 'textarea' ? (
          <TextLikeField
            as="textarea"
            rows={4}
            value={value ?? ''}
            onChange={(nextValue) => setValue(nextValue)}
            placeholder={field.placeholder}
            adornment={field.adornment}
            includeTextColor
          />
        ) : field.type === 'pin' ? (
          <PinField
            value={value ?? ''}
            onChange={(nextValue) => setValue(nextValue)}
            visible={isPinVisible(field.key)}
            onToggleVisible={() => togglePinVisible(field.key)}
            placeholder={field.placeholder}
          />
        ) : field.type === 'file' ? (
          <FilePicker value={value} accept={field.accept} onChange={(file) => setValue(file)} />
        ) : (
          <TextLikeField
            as="input"
            type={field.type ?? 'text'}
            value={value ?? ''}
            onChange={(nextValue) => {
              if (field.type === 'number') {
                setValue(nextValue === '' ? '' : Number(nextValue));
              } else {
                setValue(nextValue);
              }
            }}
            placeholder={field.placeholder}
            adornment={field.adornment}
            inputMode={
              field.inputMode ?? ((field.type ?? 'text') === 'number' ? 'decimal' : undefined)
            }
            includeTextColor
          />
        )}
      </FieldWrapper>
    );
  };

  return (
    <form
      onSubmit={onSubmit}
      className={`${maxWidthClass} mx-auto mt-4 mb-8 space-y-10 rounded-md bg-white p-6 shadow-md`}
    >
      {title ? (
        <div className="space-y-2">
          <h1 className="text-byu-navy text-3xl font-semibold">{title}</h1>
          {intro ? <p className="text-sm text-gray-700">{intro}</p> : null}
        </div>
      ) : null}

      {sections.map((section) => {
        if (section.kind === 'section') {
          return (
            <section key={section.key} className="space-y-4">
              <div>
                <h2 className={SECTION_TITLE_CLASS}>{section.title}</h2>
                {section.description ? (
                  <p className={SECTION_DESC_CLASS}>{section.description}</p>
                ) : null}
              </div>
              <div className="grid auto-rows-[auto_auto_auto] grid-cols-1 gap-x-4 md:grid-cols-2">
                {section.fields.map((field) =>
                  renderField(
                    field,
                    values[field.key],
                    (nextValue) => setFieldValue(field.key, nextValue),
                    errors?.[field.key],
                  ),
                )}
              </div>
            </section>
          );
        }

        return (
          <section key={section.key} className="space-y-4">
            <div>
              <h2 className={SECTION_TITLE_CLASS}>{section.title}</h2>
              {section.description ? (
                <p className={SECTION_DESC_CLASS}>{section.description}</p>
              ) : null}
            </div>

            {section.items.length === 0 && section.emptyMessage ? (
              <p className="text-sm text-gray-500">{section.emptyMessage}</p>
            ) : null}

            <div className="space-y-6">
              {section.items.map((item, index) => (
                <div key={index} className={BOX_CLASS}>
                  <div className="grid auto-rows-[auto_auto_auto] grid-cols-1 gap-x-4 md:grid-cols-2">
                    {section.fields.map((field) =>
                      renderField(
                        field,
                        section.getItemValue(item, field.key),
                        (nextValue) => section.setItemValue(index, field.key, nextValue),
                        errors?.[`${section.key}.${index}.${field.key}`],
                        item,
                        index,
                      ),
                    )}
                  </div>
                  {index > 0 && (
                    <div className="flex justify-end">
                      <IconButton
                        type="button"
                        variant="danger"
                        icon={<FiTrash2 className="h-4 w-4" />}
                        onClick={() => section.onRemove(index)}
                        title="Remove item"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="subtle"
              size="sm"
              onClick={section.onAdd}
              icon={<span className="text-base leading-none">+</span>}
              label={section.addButtonLabel}
            />
          </section>
        );
      })}

      <div className="flex justify-center pt-2">
        <Button
          type="submit"
          size="lg"
          disabled={submitting}
          loading={submitting}
          loadingLabel="Submitting…"
          label={submitLabel}
        />
      </div>
    </form>
  );
}
