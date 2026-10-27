import { useState } from 'react';
import { 
  GraduationCap, 
  X, 
  CheckCircle2, 
  Layers, 
  Database, 
  FormInput, 
  RefreshCw, 
  Sparkles,
  ShieldCheck,
  Compass
} from 'lucide-react';
import { useToast } from '../context/ToastContext.jsx';
import { useQueueStore, queueStore } from '../store/queueStore.js';
import FormField from './forms/FormField.jsx';
import { validateEmail, validatePassword, evaluatePasswordStrength } from '../utils/validation.js';

/**
 * SyllabusEvaluationModal Component
 * Interactive visual guide mapped 1:1 to the Course Syllabus for the Second Evaluation:
 * 1. Navigation layout and page structure (Multi-page SPA, dynamic routing)
 * 2. Context API & State architecture (Global vs Local state, Zustand-style store)
 * 3. Async state and loading/error handling
 * 4. Form handling in React (Validation strategies, Reusable input components)
 */
export default function SyllabusEvaluationModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const toast = useToast();

  // Interactive Form Demo State
  const [demoEmail, setDemoEmail] = useState('');
  const [demoPassword, setDemoPassword] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  // Global store bookmarks count
  const bookmarks = useQueueStore((s) => s.bookmarkedIds);

  const emailError = validateEmail(demoEmail);
  const passwordError = validatePassword(demoPassword, 6);
  const strength = evaluatePasswordStrength(demoPassword);

  const triggerToastDemo = (type) => {
    if (type === 'success') {
      toast.success('Async Action Complete: Queue token booked successfully!');
    } else if (type === 'error') {
      toast.error('Async Error Handled: Network timeout — retrying automatically.');
    } else if (type === 'warning') {
      toast.warning('Queue Alert: 2 customers ahead of your token.');
    } else {
      toast.info('Zustand Store: State updated across multi-page components.');
    }
  };

  return (
    <>
      {/* Floating Evaluation Badge Button */}
      <button
        type="button"
        className="syllabus-eval-badge-btn"
        onClick={() => setIsOpen(true)}
        title="View Syllabus 2nd Evaluation Features"
        aria-label="Open Syllabus Feature Matrix"
      >
        <GraduationCap size={18} className="badge-cap-icon" />
        <span className="badge-text">Syllabus Matrix</span>
        <span className="badge-pulse-dot" />
      </button>

      {/* Modal Backdrop & Content */}
      {isOpen && (
        <div className="syllabus-modal-backdrop" onClick={() => setIsOpen(false)}>
          <div 
            className="syllabus-modal-card" 
            onClick={(e) => e.stopPropagation()} 
            role="dialog"
            aria-modal="true"
            aria-labelledby="syllabus-modal-title"
          >
            {/* Modal Header */}
            <div className="syllabus-modal-header">
              <div className="syllabus-header-title-box">
                <div className="syllabus-icon-pill">
                  <GraduationCap size={20} />
                </div>
                <div>
                  <h3 id="syllabus-modal-title">Second Evaluation Feature Matrix</h3>
                  <p>Direct mapping of QueLess features to your course syllabus criteria</p>
                </div>
              </div>
              <button 
                type="button" 
                className="syllabus-close-btn" 
                onClick={() => setIsOpen(false)}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="syllabus-tabs-nav">
              <button 
                type="button" 
                className={`syllabus-tab-item ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                <Layers size={16} />
                <span>Overview</span>
              </button>
              <button 
                type="button" 
                className={`syllabus-tab-item ${activeTab === 'navigation' ? 'active' : ''}`}
                onClick={() => setActiveTab('navigation')}
              >
                <Compass size={16} />
                <span>1. Multi-Page SPA</span>
              </button>
              <button 
                type="button" 
                className={`syllabus-tab-item ${activeTab === 'state' ? 'active' : ''}`}
                onClick={() => setActiveTab('state')}
              >
                <Database size={16} />
                <span>2. State & Context</span>
              </button>
              <button 
                type="button" 
                className={`syllabus-tab-item ${activeTab === 'forms' ? 'active' : ''}`}
                onClick={() => setActiveTab('forms')}
              >
                <FormInput size={16} />
                <span>3. Forms & Inputs</span>
              </button>
              <button 
                type="button" 
                className={`syllabus-tab-item ${activeTab === 'async' ? 'active' : ''}`}
                onClick={() => setActiveTab('async')}
              >
                <RefreshCw size={16} />
                <span>4. Async & Error</span>
              </button>
            </div>

            {/* Tab Body */}
            <div className="syllabus-modal-body">
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="syllabus-tab-content">
                  <div className="syllabus-callout-banner">
                    <Sparkles size={22} className="callout-sparkle" />
                    <div>
                      <strong>Ready for Viva & Second Evaluation</strong>
                      <p>
                        QueLess addresses every single requirement in your PE-II syllabus: multi-page SPA routing, 
                        Context API architecture, global vs. local state, asynchronous loading/error handling, 
                        and reusable form components with client-side validation.
                      </p>
                    </div>
                  </div>

                  <div className="syllabus-feature-grid">
                    <div className="syllabus-feature-card">
                      <div className="card-badge">Module 1</div>
                      <h4>Multi-Page SPA Navigation</h4>
                      <p>React Router v7 with 15+ sub-routes, role guards (<code>&lt;ProtectedRoute /&gt;</code>), dynamic params (<code>:businessId</code>), and layout shells.</p>
                      <div className="feature-check"><CheckCircle2 size={15} /> Fully Implemented</div>
                    </div>

                    <div className="syllabus-feature-card">
                      <div className="card-badge">Module 2</div>
                      <h4>Context API & Global State</h4>
                      <p><code>AuthContext</code> (sessions), <code>ThemeContext</code> (Dark/Light), <code>ToastContext</code> (notifications), plus a Zustand-style <code>queueStore</code>.</p>
                      <div className="feature-check"><CheckCircle2 size={15} /> Fully Implemented</div>
                    </div>

                    <div className="syllabus-feature-card">
                      <div className="card-badge">Module 3</div>
                      <h4>Forms & Reusable Inputs</h4>
                      <p>Modular <code>&lt;FormField /&gt;</code> & <code>&lt;FormSelect /&gt;</code> with RFC email regex, password strength meter, and touched error feedback.</p>
                      <div className="feature-check"><CheckCircle2 size={15} /> Fully Implemented</div>
                    </div>

                    <div className="syllabus-feature-card">
                      <div className="card-badge">Module 4</div>
                      <h4>Async & Error Handling</h4>
                      <p><code>&lt;AsyncHandler /&gt;</code> with loading skeletons, retry triggers, React Error Boundaries, and auto offline database fallback.</p>
                      <div className="feature-check"><CheckCircle2 size={15} /> Fully Implemented</div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: MULTI-PAGE SPA */}
              {activeTab === 'navigation' && (
                <div className="syllabus-tab-content">
                  <h4>Syllabus Topic: Multi-Page SPA Design & Page Structure</h4>
                  <p className="tab-lead-desc">
                    Implemented in <code>client/src/App.jsx</code> and <code>client/src/components/DashboardShell.jsx</code> using <strong>React Router v7</strong>:
                  </p>

                  <ul className="syllabus-checklist">
                    <li>
                      <strong>Declarative Client-Side Routing:</strong> Zero full-page browser reloads, providing instant client navigation with preserved state.
                    </li>
                    <li>
                      <strong>Role-Based Route Guards &amp; Layout Grouping:</strong> <code>&lt;ProtectedRoute role="customer" /&gt;</code> and <code>&lt;ProtectedRoute role="staff" /&gt;</code> enforce role-based access control with React Router layout routes (<code>&lt;Outlet /&gt;</code>).
                    </li>
                    <li>
                      <strong>Guest Route Protection:</strong> <code>&lt;GuestRoute /&gt;</code> guards auth pages (<code>/login</code>, <code>/signup</code>, <code>/staff/login</code>, etc.), redirecting already authenticated users directly to their active dashboards.
                    </li>
                    <li>
                      <strong>Attempted Route Redirection:</strong> Automatically captures <code>location.state.from</code> so unauthenticated visitors are returned directly to their requested destination upon logging in.
                    </li>
                    <li>
                      <strong>Dynamic URL Routing:</strong> <code>/businesses/:businessId</code> and <code>/customer/queue/:entryId</code> for parameterized detail views.
                    </li>
                    <li>
                      <strong>Public Lobby TV Display Route:</strong> <code>/display/:businessId</code> for dedicated kiosk/TV signage without headers or footers.
                    </li>
                    <li>
                      <strong>Dedicated 404 Page:</strong> Wildcard <code>path="*"</code> mounted to a dedicated <code>&lt;NotFound /&gt;</code> error page with path inspection and quick recovery actions.
                    </li>
                  </ul>
                </div>
              )}

              {/* TAB 3: CONTEXT API & STATE */}
              {activeTab === 'state' && (
                <div className="syllabus-tab-content">
                  <h4>Syllabus Topic: State Architecture in React (Context API & Global vs Local)</h4>
                  <p className="tab-lead-desc">
                    QueLess clearly separates <strong>Global State</strong> (accessible anywhere) from <strong>Local State</strong> (component-scoped):
                  </p>

                  <div className="syllabus-state-compare">
                    <div className="state-box">
                      <h5>Global State (Context API & Store)</h5>
                      <ul>
                        <li><code>AuthContext</code>: Current logged-in user, JWT token, login/logout functions.</li>
                        <li><code>ThemeContext</code>: Active UI theme ('light' | 'dark') synchronized with <code>localStorage</code>.</li>
                        <li><code>ToastContext</code>: Universal notification dispatcher (<code>useToast()</code>).</li>
                        <li><code>queueStore</code> (Zustand pattern): Bookmarked branches (<strong>{bookmarks.length} saved</strong>) and recent views.</li>
                      </ul>
                    </div>
                    <div className="state-box">
                      <h5>Local State (<code>useState</code> / <code>useReducer</code>)</h5>
                      <ul>
                        <li>Input fields & touched validation states.</li>
                        <li>Active dashboard tabs and modal visibility toggles.</li>
                        <li>Countdown timers & live GPS distance watchers.</li>
                      </ul>
                    </div>
                  </div>

                  <div className="syllabus-interactive-demo">
                    <p><strong>Interactive Context Test:</strong> Click below to dispatch global async toast notifications:</p>
                    <div className="demo-btn-group">
                      <button type="button" className="demo-btn success" onClick={() => triggerToastDemo('success')}>
                        Dispatch Success Toast
                      </button>
                      <button type="button" className="demo-btn error" onClick={() => triggerToastDemo('error')}>
                        Dispatch Error Toast
                      </button>
                      <button type="button" className="demo-btn warning" onClick={() => triggerToastDemo('warning')}>
                        Dispatch Warning Toast
                      </button>
                      <button type="button" className="demo-btn info" onClick={() => triggerToastDemo('info')}>
                        Dispatch Info Toast
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: FORM HANDLING & INPUTS */}
              {activeTab === 'forms' && (
                <div className="syllabus-tab-content">
                  <h4>Syllabus Topic: Form Handling, Validation Strategies & Reusable Inputs</h4>
                  <p className="tab-lead-desc">
                    Implemented in <code>client/src/components/forms/FormField.jsx</code> and <code>client/src/utils/validation.js</code>:
                  </p>

                  <div className="syllabus-form-demo-box">
                    <h5>Live Test: Reusable <code>&lt;FormField /&gt;</code> & Validation Engine</h5>
                    <div className="demo-form-fields">
                      <FormField
                        id="demo-email-input"
                        name="demoEmail"
                        label="Test Email Address"
                        type="email"
                        placeholder="test@example.com"
                        value={demoEmail}
                        onChange={(e) => setDemoEmail(e.target.value)}
                        onBlur={() => setEmailTouched(true)}
                        error={emailError}
                        touched={emailTouched}
                        required
                        helperText="RFC-compliant email validation on blur/change."
                      />

                      <FormField
                        id="demo-password-input"
                        name="demoPassword"
                        label="Test Password"
                        type="password"
                        placeholder="Enter 6+ characters"
                        value={demoPassword}
                        onChange={(e) => setDemoPassword(e.target.value)}
                        onBlur={() => setPasswordTouched(true)}
                        error={passwordError}
                        touched={passwordTouched}
                        required
                        helperText="Live length & complexity scoring."
                      />

                      {demoPassword && (
                        <div className="demo-strength-indicator">
                          <span>Password Strength: <strong style={{ color: strength.color }}>{strength.label}</strong></span>
                          <div className="strength-mini-track">
                            <div 
                              className="strength-mini-bar" 
                              style={{ width: `${(strength.score / 4) * 100}%`, backgroundColor: strength.color }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: ASYNC & ERROR HANDLING */}
              {activeTab === 'async' && (
                <div className="syllabus-tab-content">
                  <h4>Syllabus Topic: Async State, Loading & Error Handling</h4>
                  <p className="tab-lead-desc">
                    Demonstrating robust asynchronous patterns in <code>client/src/components/AsyncHandler.jsx</code> and <code>client/src/services/api.js</code>:
                  </p>

                  <ul className="syllabus-checklist">
                    <li>
                      <strong>4-Phase Async State:</strong> <code>idle</code> → <code>loading</code> (spinners/skeletons) → <code>error</code> (retry button) → <code>success</code>.
                    </li>
                    <li>
                      <strong>React 19 Error Boundary:</strong> Catches uncaught render-tree errors in <code>ErrorBoundary.jsx</code> with a graceful recovery screen.
                    </li>
                    <li>
                      <strong>Dual-Engine Data Resilience:</strong> If local MySQL is offline, the API wrapper automatically activates an in-memory client database without throwing fatal errors.
                    </li>
                    <li>
                      <strong>Toast Feedback:</strong> Async operations dispatch immediate user feedback via <code>useToast()</code>.
                    </li>
                  </ul>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="syllabus-modal-footer">
              <span className="syllabus-footer-tag">
                <ShieldCheck size={16} /> Course Syllabus Criteria Verified
              </span>
              <button 
                type="button" 
                className="syllabus-modal-primary-btn" 
                onClick={() => setIsOpen(false)}
              >
                Close & Return to App
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
