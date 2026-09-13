import { useState, useEffect } from 'react';
import { Database, RotateCcw, X, Info } from 'lucide-react';
import { isMockModeActive, resetMockDB } from '../services/mockData.js';

export default function DemoBanner() {
  const [active, setActive] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const check = () => {
      if (isMockModeActive()) setActive(true);
    };
    check();
    const interval = setInterval(check, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!active || dismissed) return null;

  function handleReset() {
    if (confirm('Reset demo database to default seed state?')) {
      resetMockDB();
      window.location.reload();
    }
  }

  return (
    <div className="demo-banner" role="status">
      <div className="demo-banner-content">
        <span className="demo-badge">
          <Database size={13} /> Demo / Offline Mode
        </span>
        <span className="demo-text">
          Running interactive in-browser storage. <strong>Customer:</strong> <code>john@example.com</code> / <code>password123</code> &bull; <strong>Staff:</strong> <code>clinic_staff</code> / <code>staff123</code>
        </span>
        <div className="demo-actions">
          <button className="demo-reset-btn" onClick={handleReset} title="Reset demo data to initial state">
            <RotateCcw size={12} /> Reset Data
          </button>
          <button className="demo-close-btn" onClick={() => setDismissed(true)} aria-label="Dismiss banner">
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
