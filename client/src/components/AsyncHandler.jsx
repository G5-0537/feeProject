import { Loader2, AlertCircle, RefreshCw, Inbox } from 'lucide-react';

/**
 * AsyncHandler Component
 * Implements standard UI states for asynchronous data operations:
 * 1. Loading state (with animated spinner / skeletons)
 * 2. Error state (with user-friendly message & retry trigger)
 * 3. Empty data state (with clean message)
 * 4. Success state (renders children)
 *
 * Aligned with React Syllabus: "Async state and loading/error handling".
 */
export default function AsyncHandler({
  loading = false,
  error = null,
  onRetry = null,
  isEmpty = false,
  emptyMessage = 'No data available at this time.',
  loadingMessage = 'Loading data...',
  children
}) {
  // 1. Loading State
  if (loading) {
    return (
      <div className="async-state-box async-loading" role="status" aria-live="polite">
        <Loader2 className="async-spinner animate-spin" size={32} />
        <p className="async-loading-text">{loadingMessage}</p>
      </div>
    );
  }

  // 2. Error State
  if (error) {
    const errorText = typeof error === 'string' ? error : error.message || 'An unexpected error occurred.';
    return (
      <div className="async-state-box async-error" role="alert">
        <AlertCircle size={32} className="async-error-icon" />
        <div className="async-error-content">
          <h4>Failed to load data</h4>
          <p>{errorText}</p>
        </div>
        {onRetry && (
          <button type="button" className="async-retry-btn" onClick={onRetry}>
            <RefreshCw size={15} />
            <span>Try Again</span>
          </button>
        )}
      </div>
    );
  }

  // 3. Empty State
  if (isEmpty) {
    return (
      <div className="async-state-box async-empty">
        <Inbox size={36} className="async-empty-icon" />
        <p className="async-empty-text">{emptyMessage}</p>
      </div>
    );
  }

  // 4. Success State
  return children;
}
