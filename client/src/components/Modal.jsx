/**
 * Modal — Reusable confirm/dialog modal component.
 * Demonstrates: Modal (Syllabus Topics 61-66)
 * Replaces browser confirm() which blocks the JS thread and cannot be styled.
 */
import { useEffect } from 'react';
import { AlertTriangle, Info, X } from 'lucide-react';

export default function Modal({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel', danger = false, info = false }) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    function onKey(e) {
      if (e.key === 'Escape') onCancel?.();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className={`modal-icon ${danger ? 'danger' : info ? 'info' : ''}`}>
            {danger ? <AlertTriangle size={20} /> : <Info size={20} />}
          </span>
          <h3 id="modal-title" className="modal-title">{title}</h3>
          <button className="modal-close-btn" onClick={onCancel} aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>
        {message && <p className="modal-message">{message}</p>}
        <div className="modal-actions">
          {onCancel && (
            <button className="button ghost" onClick={onCancel}>{cancelText}</button>
          )}
          {onConfirm && (
            <button className={`button ${danger ? 'danger' : 'primary'}`} onClick={onConfirm} autoFocus>
              {confirmText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

