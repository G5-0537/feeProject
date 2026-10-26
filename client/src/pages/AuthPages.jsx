import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, ArrowLeft, CheckCircle2, AlertCircle, Info, Building2, Briefcase, User } from 'lucide-react';
import PublicNav from '../components/PublicNav.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { apiRequest } from '../services/api.js';
import { useFormValidation } from '../hooks/useFormValidation.js';

const BUSINESS_CATEGORIES = [
  'Clinic',
  'Hospital',
  'Bank',
  'Salon & Spa',
  'Restaurant',
  'Government Office',
  'Service Center',
  'Retail Store',
  'Other'
];

export function CustomerLogin() {
  return (
    <AuthForm
      mode="customer-login"
      eyebrow="Customer access"
      title="Welcome back to QueLess"
      subtitle="Track your token, queue position and waiting time from one calm dashboard."
      buttonText="Customer Login"
    />
  );
}

export function CustomerSignup() {
  return (
    <AuthForm
      mode="customer-signup"
      eyebrow="Customer access"
      title="Join QueLess"
      subtitle="Book appointments, join queues remotely and arrive closer to your turn."
      buttonText="Create Customer Account"
    />
  );
}

export function StaffLogin() {
  return (
    <AuthForm
      mode="staff-login"
      eyebrow="Business access"
      title="Manage your queue smarter"
      subtitle="Call next customers, handle walk-ins and keep service moving."
      buttonText="Staff Login"
    />
  );
}

export function StaffSignup() {
  return (
    <AuthForm
      mode="staff-signup"
      eyebrow="Business access"
      title="Register Your Business"
      subtitle="Set up your organization, manage queues in real-time, and delight your visitors."
      buttonText="Create Staff Account"
    />
  );
}

export function ForgotPassword() {
  const location = useLocation();
  const initialMode = location.state?.from || 'customer-login';
  return (
    <>
      <PublicNav />
      <main className="auth-page">
        <ForgotPasswordCard backMode={initialMode} />
      </main>
    </>
  );
}

function AuthForm({ mode, eyebrow, title, subtitle, buttonText }) {
  const navigate = useNavigate();
  const { saveCustomer, saveStaff } = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    business_name: '',
    business_type: 'Clinic'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  const isCustomerSignup = mode === 'customer-signup';
  const isStaffSignup = mode === 'staff-signup';
  const isSignup = isCustomerSignup || isStaffSignup;
  const isStaff = mode === 'staff-login' || mode === 'staff-signup';
  const strength = getPasswordStrength(form.password);
  const { errors: fieldErrors, validate, clearField } = useFormValidation({
    email: { required: true, label: 'Email', pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email address.' },
    password: { required: true, label: 'Password', minLength: 6 },
    name: { required: isSignup, label: 'Full Name', minLength: 2 },
    phone: { required: isSignup, label: 'Phone Number', pattern: /^\+?[\d\s\-().]{7,}$/, message: 'Enter a valid phone number.' },
    confirmPassword: { required: isSignup, label: 'Confirm Password', custom: (value, values) => value !== values.password ? 'Passwords do not match.' : null },
    business_name: { required: isStaffSignup, label: 'Business Name', minLength: 2 },
  });

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    clearField(field);
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!validate(form)) return;

    setLoading(true);
    try {
      let endpoint = '/auth/customer/login';
      if (mode === 'customer-signup') endpoint = '/auth/customer/signup';
      if (mode === 'staff-login') endpoint = '/auth/staff/login';
      if (mode === 'staff-signup') endpoint = '/auth/staff/signup';

      const { confirmPassword, ...payload } = form;
      const data = await apiRequest(endpoint, { method: 'POST', body: payload, staff: isStaff });
      setSuccess('Success! Redirecting to your dashboard...');
      
      setTimeout(() => {
        if (isStaff) {
          saveStaff(data);
          navigate('/staff/dashboard');
        } else {
          saveCustomer(data);
          navigate('/customer/dashboard');
        }
      }, 400);
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  if (showForgotModal) {
    return (
      <>
        <PublicNav />
        <main className="auth-page">
          <ForgotPasswordCard onBack={() => setShowForgotModal(false)} isStaff={isStaff} />
        </main>
      </>
    );
  }

  return (
    <>
      <PublicNav />
      <main className="auth-page">
        <div className="auth-card-container">
          <form className="auth-card" onSubmit={submit} noValidate>
            {/* Header section with clean visual hierarchy */}
            <div className="auth-card-header">
              <span className="auth-pill-badge">{eyebrow}</span>
              <h1 className="auth-card-title">{title}</h1>
              <p className="auth-card-subtitle">{subtitle}</p>
            </div>

            {/* Error / Success Alerts */}
            {error && (
              <div className="auth-alert error" role="alert">
                <AlertCircle size={18} className="alert-icon" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="auth-alert success" role="status">
                <CheckCircle2 size={18} className="alert-icon" />
                <span>{success}</span>
              </div>
            )}

            <div className="auth-fields-body">
              {/* Staff Signup Specific Fields */}
              {isStaffSignup && (
                <>
                  <div className="auth-field-group">
                    <label htmlFor="auth-biz-name" className="auth-field-label">Business / Clinic Name</label>
                    <input
                      id="auth-biz-name"
                      type="text"
                      className="auth-input"
                      placeholder="e.g. Apex Health Clinic"
                      value={form.business_name}
                      onChange={(e) => updateField('business_name', e.target.value)}
                      required
                      autoFocus
                    />
                    {fieldErrors.business_name && <span className="form-field-error" role="alert">{fieldErrors.business_name}</span>}
                  </div>

                  <div className="auth-field-group">
                    <label htmlFor="auth-biz-type" className="auth-field-label">Category / Sector</label>
                    <select
                      id="auth-biz-type"
                      className="auth-input auth-select"
                      value={form.business_type}
                      onChange={(e) => setForm({ ...form, business_type: e.target.value })}
                    >
                      {BUSINESS_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* Name field for Signups */}
              {isSignup && (
                <>
                  <div className="auth-field-group">
                    <label htmlFor="auth-name" className="auth-field-label">
                      {isStaffSignup ? 'Staff / Manager Full Name' : 'Full Name'}
                    </label>
                    <input
                      id="auth-name"
                      type="text"
                      className="auth-input"
                      placeholder="Jane Doe"
                      value={form.name}
                      onChange={(e) => updateField('name', e.target.value)}
                      required
                      autoComplete="name"
                    />
                    {fieldErrors.name && <span className="form-field-error" role="alert">{fieldErrors.name}</span>}
                  </div>

                  <div className="auth-field-group">
                    <label htmlFor="auth-phone" className="auth-field-label">Phone Number</label>
                    <input
                      id="auth-phone"
                      type="tel"
                      className="auth-input"
                      placeholder="+1 (555) 000-0000"
                      value={form.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                      required
                      autoComplete="tel"
                    />
                    {fieldErrors.phone && <span className="form-field-error" role="alert">{fieldErrors.phone}</span>}
                  </div>
                </>
              )}

              {/* Email Field */}
              <div className="auth-field-group">
                <label htmlFor="auth-email" className="auth-field-label">
                  {isStaff ? 'Work Email' : 'Email'}
                </label>
                <input
                  id="auth-email"
                  type="email"
                  className="auth-input"
                  placeholder="name@example.com"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  required
                  autoComplete="email"
                />
                {fieldErrors.email && <span className="form-field-error" role="alert">{fieldErrors.email}</span>}
              </div>

              {/* Password Field */}
              <div className="auth-field-group">
                <label htmlFor="auth-password" className="auth-field-label">Password</label>
                <div className="password-input-wrapper">
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    className="auth-input password-input"
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={(e) => updateField('password', e.target.value)}
                    required
                    autoComplete={isSignup ? 'new-password' : 'current-password'}
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {fieldErrors.password && <span className="form-field-error" role="alert">{fieldErrors.password}</span>}
              </div>

              {/* Forgot password link for logins with proper spacing */}
              {!isSignup && (
                <div className="auth-forgot-row">
                  <button
                    type="button"
                    className="auth-forgot-link"
                    onClick={() => setShowForgotModal(true)}
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {/* Confirm Password for Signup */}
              {isSignup && (
                <div className="auth-field-group">
                  <label htmlFor="auth-confirm-password" className="auth-field-label">Confirm Password</label>
                  <div className="password-input-wrapper">
                    <input
                      id="auth-confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      className="auth-input password-input"
                      placeholder="Repeat your password"
                      value={form.confirmPassword}
                      onChange={(e) => updateField('confirmPassword', e.target.value)}
                      required
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {fieldErrors.confirmPassword && <span className="form-field-error" role="alert">{fieldErrors.confirmPassword}</span>}
                </div>
              )}

              {/* Password Strength Meter for Signup */}
              {isSignup && (
                <div className="strength-meter-box" data-strength={strength.level}>
                  <div className="strength-bar-track">
                    <div className="strength-bar-fill" />
                  </div>
                  <span className="strength-label">Password strength: <strong>{strength.label}</strong></span>
                </div>
              )}
            </div>

            {/* Action Submit Button */}
            <div className="auth-actions-group">
              <button
                type="submit"
                className="button full auth-submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <span className="btn-loading-state">
                    <span className="spinner-dot" />
                    <span>Processing...</span>
                  </span>
                ) : (
                  buttonText
                )}
              </button>
            </div>

            {/* Role-Specific Switch Footers */}
            <div className="auth-card-footer">
              {mode === 'customer-login' && (
                <>
                  <p className="auth-switch-text">
                    New to QueLess?{' '}
                    <Link to="/signup" className="auth-highlight-link">
                      Create account
                    </Link>
                  </p>
                  <p className="auth-sub-switch-text">
                    Business / Staff member?{' '}
                    <Link to="/staff/login" className="auth-sub-link">
                      Staff Login
                    </Link>
                  </p>
                </>
              )}

              {mode === 'customer-signup' && (
                <>
                  <p className="auth-switch-text">
                    Already registered?{' '}
                    <Link to="/login" className="auth-highlight-link">
                      Login
                    </Link>
                  </p>
                  <p className="auth-sub-switch-text">
                    Registering a business?{' '}
                    <Link to="/staff/signup" className="auth-sub-link">
                      Staff Signup
                    </Link>
                  </p>
                </>
              )}

              {mode === 'staff-login' && (
                <>
                  <p className="auth-switch-text">
                    New business on QueLess?{' '}
                    <Link to="/staff/signup" className="auth-highlight-link">
                      Create Staff Account
                    </Link>
                  </p>
                  <p className="auth-sub-switch-text">
                    Looking for customer queues?{' '}
                    <Link to="/login" className="auth-sub-link">
                      Customer Login
                    </Link>
                  </p>
                </>
              )}

              {mode === 'staff-signup' && (
                <>
                  <p className="auth-switch-text">
                    Already have a staff account?{' '}
                    <Link to="/staff/login" className="auth-highlight-link">
                      Staff Login
                    </Link>
                  </p>
                  <p className="auth-sub-switch-text">
                    Are you a customer?{' '}
                    <Link to="/signup" className="auth-sub-link">
                      Customer Signup
                    </Link>
                  </p>
                </>
              )}
            </div>
          </form>
        </div>
      </main>
    </>
  );
}

function ForgotPasswordCard({ onBack, isStaff: propIsStaff, backMode }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const { errors: validationErrors, validate, clearField } = useFormValidation({
    email: { required: true, label: 'Email', pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email address.' },
  });

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (backMode === 'staff-login' || backMode === 'staff-signup') {
      navigate('/staff/login');
    } else {
      navigate('/login');
    }
  };

  async function handleResetSubmit(e) {
    e.preventDefault();
    setError('');

    if (!validate({ email })) return;

    setLoading(true);
    try {
      await apiRequest('/auth/forgot-password', {
        method: 'POST',
        body: { email }
      });
      setSubmitted(true);
    } catch (err) {
      setError(err.message || 'Unable to process reset request. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-card-container">
      <div className="auth-card">
        <div className="auth-card-header">
          <span className="auth-pill-badge">Password recovery</span>
          <h1 className="auth-card-title">Reset your password</h1>
          <p className="auth-card-subtitle">
            Enter your registered email address and we&apos;ll send you instructions to reset your password.
          </p>
        </div>

        {error && (
          <div className="auth-alert error" role="alert">
            <AlertCircle size={18} className="alert-icon" />
            <span>{error}</span>
          </div>
        )}

        {submitted ? (
          <div className="forgot-success-flow">
            <div className="auth-alert success" role="status">
              <CheckCircle2 size={20} className="alert-icon" />
              <div>
                <strong>Reset instructions sent</strong>
                <p style={{ margin: '4px 0 0', fontSize: '0.88rem' }}>
                  If an account exists with <strong>{email}</strong>, a password reset link has been sent.
                </p>
              </div>
            </div>

            <div className="demo-flow-info-box">
              <div className="demo-info-header">
                <Info size={16} />
                <span>Demo Mode Active</span>
              </div>
              <p>
                In offline / browser demo mode, no physical email is dispatched. Your account remains accessible using standard test credentials.
              </p>
            </div>

            <button
              type="button"
              className="button full auth-submit-btn"
              onClick={handleBack}
            >
              Back to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleResetSubmit} noValidate>
            <div className="auth-fields-body">
              <div className="auth-field-group">
                <label htmlFor="reset-email" className="auth-field-label">Registered Email</label>
                <input
                  id="reset-email"
                  type="email"
                  className="auth-input"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); clearField('email'); }}
                  required
                  autoFocus
                  aria-invalid={!!validationErrors.email}
                  aria-describedby={validationErrors.email ? 'reset-email-error' : undefined}
                />
                {validationErrors.email && <span id="reset-email-error" className="form-field-error" role="alert">{validationErrors.email}</span>}
              </div>

              <div className="demo-flow-info-box subtle">
                <div className="demo-info-header">
                  <Info size={15} />
                  <span>Browser Storage Notice</span>
                </div>
                <p>
                  Reset verification is simulated safely in demo mode without modifying external mail servers.
                </p>
              </div>
            </div>

            <div className="auth-actions-group">
              <button
                type="submit"
                className="button full auth-submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <span className="btn-loading-state">
                    <span className="spinner-dot" />
                    <span>Sending Reset Link...</span>
                  </span>
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </div>

            <div className="auth-card-footer">
              <button
                type="button"
                className="auth-back-btn"
                onClick={handleBack}
              >
                <ArrowLeft size={16} />
                <span>Back to Login</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function getPasswordStrength(password) {
  let score = 0;
  if (password.length >= 6) score += 1;
  if (password.length >= 10) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (!password) return { level: 'empty', label: 'Not entered' };
  if (score <= 2) return { level: 'weak', label: 'Weak' };
  if (score <= 4) return { level: 'good', label: 'Good' };
  return { level: 'strong', label: 'Strong' };
}
