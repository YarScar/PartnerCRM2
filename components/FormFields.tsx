'use client';

import { ReactNode } from 'react';

interface FieldProps {
  label: string;
  name: string;
  hint?: string;
  required?: boolean;
  children?: ReactNode;
}

export function Field({ label, name, hint, required, children }: FieldProps) {
  return (
    <div>
      <label htmlFor={name} className="label-base">
        {label}
        {required && <span className="text-court ml-1">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-ink/50 mt-1">{hint}</p>}
    </div>
  );
}

interface TextFieldProps extends FieldProps {
  type?: string;
  placeholder?: string;
  defaultValue?: string;
}

export function TextField({ name, type = 'text', placeholder, defaultValue, ...rest }: TextFieldProps) {
  return (
    <Field {...rest} name={name}>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        defaultValue={defaultValue}
        required={rest.required}
        className="input-base"
      />
    </Field>
  );
}

interface TextareaFieldProps extends FieldProps {
  placeholder?: string;
  defaultValue?: string;
  rows?: number;
}

export function TextareaField({ name, placeholder, defaultValue, rows = 3, ...rest }: TextareaFieldProps) {
  return (
    <Field {...rest} name={name}>
      <textarea
        id={name}
        name={name}
        rows={rows}
        placeholder={placeholder}
        defaultValue={defaultValue}
        required={rest.required}
        className="input-base resize-none"
      />
    </Field>
  );
}

interface SelectFieldProps extends FieldProps {
  options: readonly string[] | { value: string; label: string }[];
  defaultValue?: string;
  placeholder?: string;
}

export function SelectField({ name, options, defaultValue, placeholder, ...rest }: SelectFieldProps) {
  return (
    <Field {...rest} name={name}>
      <select
        id={name}
        name={name}
        defaultValue={defaultValue || ''}
        required={rest.required}
        className="input-base"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt, idx) => {
          const value = typeof opt === 'string' ? opt : opt.value;
          const label = typeof opt === 'string' ? opt : opt.label;
          return (
            <option key={`${name}-${value}-${idx}`} value={value}>
              {label}
            </option>
          );
        })}
      </select>
    </Field>
  );
}
