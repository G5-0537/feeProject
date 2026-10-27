/**
 * FormField — Reusable labeled input component with error/hint display.
 * Demonstrates: Reusable input components (Syllabus Topics 55-60)
 */
export default function FormField({ label, id, error, helperText, as: Tag = 'input', children, required, ...inputProps }) {
  return (
    <div className={`form-field${error ? ' has-error' : ''}`}>
      {label && (
        <label htmlFor={id} className="form-field-label">
          {label}
          {required && <span className="form-required" aria-hidden="true"> *</span>}
        </label>
      )}
      {Tag === 'select' ? (
        <select id={id} className="form-field-input" aria-describedby={error ? `${id}-error` : helperText ? `${id}-hint` : undefined} aria-invalid={!!error} required={required} {...inputProps}>
          {children}
        </select>
      ) : Tag === 'textarea' ? (
        <textarea id={id} className="form-field-input" aria-describedby={error ? `${id}-error` : helperText ? `${id}-hint` : undefined} aria-invalid={!!error} required={required} {...inputProps} />
      ) : (
        <input id={id} className="form-field-input" aria-describedby={error ? `${id}-error` : helperText ? `${id}-hint` : undefined} aria-invalid={!!error} required={required} {...inputProps} />
      )}
      {error && (
        <span id={`${id}-error`} className="form-field-error" role="alert">{error}</span>
      )}
      {helperText && !error && (
        <span id={`${id}-hint`} className="form-field-hint">{helperText}</span>
      )}
    </div>
  );
}

