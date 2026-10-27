import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

/**
 * Reusable ValidationMessage Component
 * Displays standardized feedback messages for forms and inputs.
 * Types: 'error', 'success', 'info', 'warning'
 */
export default function ValidationMessage({
  message,
  type = 'error',
  className = '',
  id,
  role = 'alert'
}) {
  if (!message) return null;

  return (
    <div id={id} className={`validation-msg-box msg-${type} ${className}`} role={role}>
      <span className="validation-msg-icon" aria-hidden="true">
        {type === 'error' && <AlertCircle size={15} />}
        {type === 'success' && <CheckCircle2 size={15} />}
        {type === 'warning' && <AlertTriangle size={15} />}
        {type === 'info' && <Info size={15} />}
      </span>
      <span className="validation-msg-text">{message}</span>
    </div>
  );
}
