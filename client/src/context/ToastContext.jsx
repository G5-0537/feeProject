import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext(null);

let toastIdCounter = 0;

/**
 * Global Toast Notification Provider
 * Manages async state feedback (Success, Error, Info, Warning) across the multi-page SPA.
 * Demonstrates Context API state architecture and global notification dispatch.
 * Backwards compatible with both `toast.success(...)` and `const { showToast } = useToast()`.
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(({ message, type = 'info', duration = 4000 }) => {
    const id = ++toastIdCounter;
    const newToast = { id, message, type, duration };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, [removeToast]);

  const showToast = useCallback((message, type = 'info', duration = 3500) => {
    return addToast({ message, type, duration });
  }, [addToast]);

  const toastMethods = useMemo(() => {
    const fn = (message, type, duration) => showToast(message, type, duration);
    fn.showToast = showToast;
    fn.success = (message, duration) => addToast({ message, type: 'success', duration });
    fn.error = (message, duration) => addToast({ message, type: 'error', duration });
    fn.info = (message, duration) => addToast({ message, type: 'info', duration });
    fn.warning = (message, duration) => addToast({ message, type: 'warning', duration });
    fn.remove = removeToast;
    return fn;
  }, [addToast, removeToast, showToast]);

  return (
    <ToastContext.Provider value={toastMethods}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

function ToastContainer({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;

  return (
    <div className="global-toast-container toast-container" role="region" aria-label="Notifications" aria-live="polite">
      {toasts.map((item) => (
        <div key={item.id} className={`toast-card toast-${item.type}`} role="status">
          <div className="toast-icon">
            {item.type === 'success' && <CheckCircle2 size={18} />}
            {item.type === 'error' && <AlertCircle size={18} />}
            {item.type === 'warning' && <AlertTriangle size={18} />}
            {item.type === 'info' && <Info size={18} />}
          </div>
          <div className="toast-message">{item.message}</div>
          <button
            type="button"
            className="toast-close-btn"
            onClick={() => onDismiss(item.id)}
            aria-label="Dismiss notification"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
