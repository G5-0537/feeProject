import { useState, useEffect } from 'react';
import { Database, RotateCcw, X, Server } from 'lucide-react';
import { isMockModeActive, resetMockDB } from '../services/mockData.js';
import Modal from './Modal.jsx';

/**
 * DemoBanner Component
 * Fulfills syllabus requirement for honesty in persistence:
 * Clearly distinguishes live MySQL backend connection from offline in-browser reactive database.
 */
export default function DemoBanner() {
  const [dbStatus, setDbStatus] = useState({
    mode: isMockModeActive() ? 'mock' : 'detecting',
    message: ''
  });
  const [dismissed, setDismissed] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    let mounted = true;
    const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5001/api';

    // Probe backend health endpoint
    fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(2000) })
      .then((res) => res.json())
      .then((data) => {
        if (!mounted) return;
        if (data.status === 'ok') {
          setDbStatus({
            mode: 'mysql',
            message: 'Connected to live MySQL Database (Port 5001)'
          });
        } else {
          setDbStatus({
            mode: 'mock',
            message: 'In-Browser Reactive DB (Backend reachable, MySQL starting)'
          });
        }
      })
      .catch(() => {
        if (!mounted) return;
        setDbStatus({
          mode: 'mock',
          message: 'In-Browser Reactive Database (Offline Demo Engine Active)'
        });
      });

    const check = () => {
      if (isMockModeActive()) {
        setDbStatus({ mode: 'mock', message: 'In-Browser Reactive Database (Offline Demo Engine Active)' });
      }
    };
    window.addEventListener('queless:mock-mode-change', check);

    return () => {
      mounted = false;
      window.removeEventListener('queless:mock-mode-change', check);
    };
  }, []);

  if (dismissed || dbStatus.mode === 'detecting') return null;

  function handleReset() {
    resetMockDB();
    setConfirmReset(false);
    window.location.reload();
  }

  const isLiveMySQL = dbStatus.mode === 'mysql';

  return (
    <>
      <Modal
        isOpen={confirmReset}
        title="Reset demo data?"
        message="This restores the in-browser demo database to its original seed data."
        confirmText="Reset Data"
        danger
        onConfirm={handleReset}
        onCancel={() => setConfirmReset(false)}
      />
      <div className={`demo-banner ${isLiveMySQL ? 'banner-mysql-live' : 'banner-mock-active'}`} role="status">
        <div className="demo-banner-content">
          <span className="demo-badge">
            {isLiveMySQL ? (
              <>
                <Server size={13} /> Live MySQL Mode
              </>
            ) : (
              <>
                <Database size={13} /> In-Browser Mock DB
              </>
            )}
          </span>
          <span className="demo-text">
            {isLiveMySQL ? (
              <>
                Connected to <strong>MySQL 8</strong> persistent engine. Queries and appointments commit directly to the relational database.
              </>
            ) : (
              <>
                Running <strong>Reactive In-Browser Storage</strong> (Offline / GitHub Pages Fallback). Customer: <code>john@example.com</code> &bull; Staff: <code>clinic_staff</code>
              </>
            )}
          </span>
          <div className="demo-actions">
            {!isLiveMySQL && (
              <button
                className="demo-reset-btn"
                onClick={() => setConfirmReset(true)}
                title="Reset in-browser storage to initial seed data"
              >
                <RotateCcw size={12} /> Reset Data
              </button>
            )}
            <button
              className="demo-close-btn"
              onClick={() => setDismissed(true)}
              aria-label="Dismiss status banner"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
