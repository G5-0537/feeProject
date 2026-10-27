import { AlertCircle } from 'lucide-react';

/**
 * Reusable FormField Component
 * Features:
 * - Label with required indicator
 * - Icon prefix support
 * - Real-time error message presentation
 * - Touch-aware validation state styling
 * - Accessibility attributes (aria-invalid, aria-describedby)
 */
export default function FormField({
  id,
  name,
  label,
  type = 'text',
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  touched = false,
  required = false,
  icon: Icon,
  helperText,
  disabled = false,
  autoFocus = false,
  rightElement = null,
  className = '',
  ...props
}) {
  const hasError = Boolean(touched && error);
  const inputId = id || `form-field-${name}`;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;

  return (
    <div className={`reusable-form-field ${hasError ? 'has-error' : ''} ${className}`}>
      {label && (
        <label htmlFor={inputId} className="form-field-label">
          <span>{label}</span>
          {required && <span className="form-field-required" aria-hidden="true">*</span>}
        </label>
      )}

      <div className="form-field-input-wrapper">
        {Icon && (
          <span className="form-field-icon-prefix" aria-hidden="true">
            <Icon size={18} />
          </span>
        )}

        <input
          id={inputId}
          name={name}
          type={type}
          value={value ?? ''}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          required={required}
          aria-invalid={hasError ? 'true' : 'false'}
          aria-describedby={
            hasError ? errorId : helperText ? helperId : undefined
          }
          className={`form-field-input ${Icon ? 'with-prefix-icon' : ''} ${rightElement ? 'with-right-element' : ''} ${hasError ? 'is-invalid' : ''}`}
          {...props}
        />

        {rightElement && (
          <div className="form-field-right-element">
            {rightElement}
          </div>
        )}
      </div>

      {hasError ? (
        <p id={errorId} className="form-field-error-msg" role="alert">
          <AlertCircle size={14} className="error-icon" />
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p id={helperId} className="form-field-helper-text">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
