import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  returnHome = () => {
    window.location.href = window.location.pathname.split('#')[0];
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '70vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '30px',
          textAlign: 'center'
        }}>
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            borderRadius: '16px',
            padding: '36px',
            maxWidth: '520px',
            boxShadow: 'var(--shadow)'
          }}>
            <AlertTriangle size={48} color="var(--brand-2)" style={{ marginBottom: '14px' }} />
            <h2 style={{ margin: '0 0 8px' }}>Something went wrong</h2>
            <p style={{ color: 'var(--muted)', lineHeight: 1.6, marginBottom: '24px' }}>
              An unexpected interface error occurred. You can retry or reload the application cleanly.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="button" onClick={this.handleReset}>
                <RefreshCw size={16} /> Try Again
              </button>
              <button className="button secondary" onClick={this.returnHome}>
                Return Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
