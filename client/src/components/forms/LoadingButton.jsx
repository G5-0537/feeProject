import { Loader2 } from 'lucide-react';

/**
 * Reusable LoadingButton Component
 * Supports:
 * - Loading spinner with disabled state
 * - Variants: 'primary', 'secondary', 'danger', 'ghost', 'outline'
 * - Sizes: 'small', 'medium', 'large'
 * - Full-width option
 * - Icon prefix/suffix
 */
export default function LoadingButton({
  children,
  loading = false,
  loadingText,
  disabled = false,
  type = 'button',
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  icon: Icon = null,
  onClick,
  className = '',
  ...props
}) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      className={`reusable-btn btn-${variant} btn-${size} ${fullWidth ? 'btn-full-width' : ''} ${loading ? 'is-loading' : ''} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="btn-loading-content">
          <Loader2 size={16} className="btn-spinner animate-spin" />
          <span>{loadingText || children}</span>
        </span>
      ) : (
        <span className="btn-default-content">
          {Icon && <Icon size={16} className="btn-prefix-icon" />}
          <span>{children}</span>
        </span>
      )}
    </button>
  );
}
