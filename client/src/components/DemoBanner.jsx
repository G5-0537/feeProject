import { useState, useEffect } from 'react';
import { Database, RotateCcw, X } from 'lucide-react';
import { isMockModeActive, resetMockDB } from '../services/mockData.js';
import Modal from './Modal.jsx';

export default function DemoBanner() {
  const [active, setActive] = useState(() => isMockModeActive());
  const [dismissed, setDismissed] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    const check = () => {
      setActive(isMockModeActive());
    };
    check();
    window.addEventListener('queless:mock-mode-change', check);
    return () => window.removeEventListener('queless:mock-mode-change', check);
  }, []);

  if (!active || dismissed) return null;

  function handleReset() {
    resetMockDB();
    setConfirmReset(false);
    window.location.reload();
  }

  return (
    <>
    <Modal isOpen={confirmReset} title="Reset demo data?" message="This restores the in-browser demo database to its original seed data." confirmText="Reset Data" danger onConfirm={handleReset} onCancel={() => setConfirmReset(false)} />
    <div className="demo-banner" role="status">
      <div className="demo-banner-content">
        <span className="demo-badge">
          <Database size={13} /> Demo / Offline Mode
        </span>
        <span className="demo-text">
          Running interactive in-browser storage. <strong>Customer:</strong> <code>john@example.com</code> / <code>password123</code> &bull; <strong>Staff:</strong> <code>clinic_staff</code> / <code>staff123</code>
        </span>
        <div className="demo-actions">
          <button className="demo-reset-btn" onClick={() => setConfirmReset(true)} title="Reset demo data to initial state">
            <RotateCcw size={12} /> Reset Data
          </button>
          <button className="demo-close-btn" onClick={() => setDismissed(true)} aria-label="Dismiss banner">
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
    </>
  );
}
