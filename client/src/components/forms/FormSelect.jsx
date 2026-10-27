import { AlertCircle } from 'lucide-react';

/**
 * Reusable FormSelect Component
 * Provides a standardized dropdown with error handling and accessibility.
 */
export default function FormSelect({
  id,
  name,
  label,
  value,
  onChange,
  onBlur,
  options = [],
  error,
  touched = false,
  required = false,
  disabled = false,
  helperText,
  icon: Icon,
  className = '',
  ...props
}) {
  const hasError = Boolean(touched && error);
  const selectId = id || `form-select-${name}`;
  const errorId = `${selectId}-error`;
  const helperId = `${selectId}-helper`;

  return (
    <div className={`reusable-form-field ${hasError ? 'has-error' : ''} ${className}`}>
      {label && (
        <label htmlFor={selectId} className="form-field-label">
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

        <select
          id={selectId}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          required={required}
          aria-invalid={hasError ? 'true' : 'false'}
          aria-describedby={hasError ? errorId : helperText ? helperId : undefined}
          className={`form-field-input form-field-select ${Icon ? 'with-prefix-icon' : ''} ${hasError ? 'is-invalid' : ''}`}
          {...props}
        >
          {options.map((opt) => {
            const optVal = typeof opt === 'string' ? opt : opt.value;
            const optLbl = typeof opt === 'string' ? opt : opt.label;
            return (
              <option key={optVal} value={optVal}>
                {optLbl}
              </option>
            );
          })}
        </select>
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
