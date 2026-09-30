import React, { useId } from "react";

/** Champ de formulaire : label + contrôle + aide/erreur. */
export function Field({ label, hint, error, required, children, className = "" }) {
  const id = useId();
  const control = React.isValidElement(children)
    ? React.cloneElement(children, {
        id: children.props.id || id,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": hint || error ? `${id}-help` : undefined,
        required: children.props.required ?? required,
      })
    : children;
  return (
    <div className={`field ${error ? "field--error" : ""} ${className}`}>
      {label && (
        <label htmlFor={children?.props?.id || id} className="field__label">
          {label}
          {required && <span className="field__required" aria-hidden="true"> *</span>}
        </label>
      )}
      {control}
      {(error || hint) && (
        <span id={`${id}-help`} className={error ? "field__error" : "field__hint"}>
          {error || hint}
        </span>
      )}
    </div>
  );
}

export const Input = React.forwardRef(function Input({ className = "", ...props }, ref) {
  return <input ref={ref} className={`input ${className}`} {...props} />;
});

export function Select({ options = [], placeholder, className = "", ...props }) {
  return (
    <select className={`input select ${className}`} {...props}>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((option) => (
        <option key={option.value} value={option.value} disabled={option.disabled}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export function Textarea({ className = "", ...props }) {
  return <textarea className={`input textarea ${className}`} {...props} />;
}

export function FormGrid({ children, columns = 2 }) {
  return <div className={`form-grid form-grid--${columns}`}>{children}</div>;
}

export function FormError({ message }) {
  if (!message) return null;
  return (
    <div className="form-error" role="alert">
      {message}
    </div>
  );
}
