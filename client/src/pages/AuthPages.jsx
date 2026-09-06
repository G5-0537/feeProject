import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import PublicNav from '../components/PublicNav.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { apiRequest } from '../services/api.js';

export function CustomerLogin() {
  return <AuthForm mode="customer-login" title="Welcome back to QueLess" buttonText="Customer Login" subtitle="Track your token, queue position and waiting time from one calm dashboard." />;
}

export function CustomerSignup() {
  return <AuthForm mode="customer-signup" title="Join QueLess" buttonText="Create Customer Account" subtitle="Book appointments, join queues remotely and arrive closer to your turn." />;
}

export function StaffLogin() {
  return <AuthForm mode="staff-login" title="Manage your queue smarter" buttonText="Staff Login" subtitle="Call next customers, handle walk-ins and keep service moving." />;
}

function AuthForm({ mode, title, subtitle, buttonText }) {
  const navigate = useNavigate();
  const { saveCustomer, saveStaff } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const isSignup = mode === 'customer-signup';
  const isStaff = mode === 'staff-login';
  const strength = getPasswordStrength(form.password);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (!form.email.includes('@')) {
      setError('Enter a valid email address.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (isSignup && form.password !== form.confirmPassword) {
      setError('Password and confirm password must match.');
      return;
    }
    setLoading(true);
    try {
      const endpoint = isSignup ? '/auth/customer/signup' : isStaff ? '/auth/staff/login' : '/auth/customer/login';
      const { confirmPassword, ...payload } = form;
      const data = await apiRequest(endpoint, { method: 'POST', body: payload, staff: isStaff });
      setSuccess('Success. Redirecting to your dashboard...');
      if (isStaff) {
        saveStaff(data);
        navigate('/staff/dashboard');
      } else {
        saveCustomer(data);
        navigate('/customer/dashboard');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PublicNav />
      <main className="auth-page">
        <form className="auth-card" onSubmit={submit}>
          <span className="eyebrow">{isStaff ? 'Business access' : 'Customer access'}</span>
          <h1>{title}</h1>
          <p>{subtitle}</p>
          {isSignup && (
            <>
              <label>Name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>
              <label>Phone<input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required /></label>
            </>
          )}
          <label>Email<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></label>
          <label>Password
            <span className="password-field">
              <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
              <button type="button" className="password-toggle" onClick={() => setShowPassword((value) => !value)} aria-label="Show or hide password">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </span>
          </label>
          {!isSignup && <button type="button" className="forgot-link">Forgot password?</button>}
          {isSignup && (
            <label>Confirm Password
              <input type={showPassword ? 'text' : 'password'} value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required />
            </label>
          )}
          {isSignup && (
            <div className="strength-meter" data-strength={strength.level}>
              <span><i /></span>
              <small>Password strength: {strength.label}</small>
            </div>
          )}
          {error && <p className="form-error">{error}</p>}
          {success && <p className="form-success">{success}</p>}
          <button className="button full" disabled={loading}>{loading ? 'Please wait...' : buttonText}</button>
          {!isStaff && (
            <p className="switch-link">
              {isSignup ? 'Already registered?' : 'New to QueLess?'}{' '}
              <Link to={isSignup ? '/login' : '/signup'}>{isSignup ? 'Login' : 'Create account'}</Link>
            </p>
          )}
        </form>
      </main>
    </>
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
