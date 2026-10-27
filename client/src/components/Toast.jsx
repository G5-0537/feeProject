/**
 * Toast — Individual toast notification component.
 * Demonstrates: Toast notifications (Syllabus Topics 61-66)
 * Types: 'success' | 'error' | 'info' | 'warning'
 */
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const ICONS = {
  success: <CheckCircle2 size={18} />,
  error: <AlertCircle size={18} />,
  info: <Info size={18} />,
  warning: <AlertTriangle size={18} />,
};

export default function Toast({ message, type = 'info', onClose }) {
  return (
    <div className={`toast toast-${type}`} role="alert">
      <span className="toast-icon">{ICONS[type] || ICONS.info}</span>
      <span className="toast-message">{message}</span>
      <button className="toast-close" onClick={onClose} aria-label="Dismiss notification">
        <X size={15} />
      </button>
    </div>
  );
}

