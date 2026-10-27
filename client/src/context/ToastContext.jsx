import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext(null);

let toastIdCounter = 0;

/**
 * Global Toast Notification Provider
 * Manages async state feedback (Success, Error, Info, Warning) across the multi-page SPA.
 * Demonstrates Context API state architecture and global notification dispatch.
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

  const toast = useMemo(() => ({
    success: (message, duration) => addToast({ message, type: 'success', duration }),
    error: (message, duration) => addToast({ message, type: 'error', duration }),
    info: (message, duration) => addToast({ message, type: 'info', duration }),
    warning: (message, duration) => addToast({ message, type: 'warning', duration }),
    remove: removeToast
  }), [addToast, removeToast]);

  return (
    <ToastContext.Provider value={toast}>
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
    <div className="global-toast-container" role="region" aria-label="Notifications">
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
