import { useState } from 'react';
import { Mail, User, MessageSquare, Send, CheckCircle2, Sparkles } from 'lucide-react';
import FormField from '../../components/forms/FormField.jsx';
import FormSelect from '../../components/forms/FormSelect.jsx';
import LoadingButton from '../../components/forms/LoadingButton.jsx';
import ValidationMessage from '../../components/forms/ValidationMessage.jsx';
import { validateEmail, validateRequired } from '../../utils/validation.js';
import { useToast } from '../../context/ToastContext.jsx';

export default function PortfolioContact() {
  const toast = useToast();
  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: 'Project Inquiry',
    message: ''
  });
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState('');

  const nameError = validateRequired(form.name, 'Full name');
  const emailError = validateEmail(form.email);
  const messageError = validateRequired(form.message, 'Message');

  const isFormValid = !nameError && !emailError && !messageError;

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ name: true, email: true, message: true });

    if (!isFormValid) {
      toast.warning('Please fix the validation errors before submitting.');
      return;
    }

    setLoading(true);
    setServerError('');

    try {
      // Simulate async network operation
      await new Promise((resolve) => setTimeout(resolve, 800));
      setSubmitted(true);
      toast.success('Message sent successfully! Thank you for reaching out.');
    } catch (err) {
      setServerError('Failed to submit message. Please try again.');
      toast.error('Failed to submit message.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="portfolio-page-wrap">
      <div className="portfolio-page-header">
        <span className="portfolio-page-eyebrow">Form Handling & Validation Demo</span>
        <h1 className="portfolio-page-title">Get in Touch</h1>
        <p className="portfolio-page-desc">
          Interactive contact form showcasing reusable input components, touched-state tracking, client-side regex validation, and async toast feedback.
        </p>
      </div>

      <div className="portfolio-contact-layout">
        {/* Contact Form Card */}
        <div className="portfolio-contact-card glass-elevation">
          {submitted ? (
            <div className="contact-success-state">
              <CheckCircle2 size={48} className="text-teal" />
              <h3>Message Received!</h3>
              <p>
                Thank you, <strong>{form.name}</strong>. Your message regarding <em>{form.subject}</em> has been recorded.
              </p>
              <button 
                type="button" 
                className="button primary small"
                onClick={() => {
                  setSubmitted(false);
                  setForm({ name: '', email: '', subject: 'Project Inquiry', message: '' });
                  setTouched({});
                }}
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <ValidationMessage message={serverError} type="error" />

              <FormField
                id="contact-name"
                name="name"
                label="Your Name"
                placeholder="Jane Doe"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                onBlur={() => handleBlur('name')}
                error={nameError}
                touched={touched.name}
                required
                icon={User}
              />

              <FormField
                id="contact-email"
                name="email"
                type="email"
                label="Email Address"
                placeholder="jane@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                onBlur={() => handleBlur('email')}
                error={emailError}
                touched={touched.email}
                required
                icon={Mail}
                helperText="We will never share your email with anyone."
              />

              <FormSelect
                id="contact-subject"
                name="subject"
                label="Subject Category"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                options={[
                  'Project Inquiry',
                  'Evaluation Feedback',
                  'Technical Discussion',
                  'Other'
                ]}
              />

              <div className="reusable-form-field">
                <label htmlFor="contact-msg" className="form-field-label">
                  <span>Message</span>
                  <span className="form-field-required">*</span>
                </label>
                <textarea
                  id="contact-msg"
                  name="message"
                  rows={4}
                  className={`form-field-input ${touched.message && messageError ? 'is-invalid' : ''}`}
                  placeholder="Write your message or inquiry here..."
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  onBlur={() => handleBlur('message')}
                  required
                />
                {touched.message && messageError && (
                  <ValidationMessage message={messageError} type="error" />
                )}
              </div>

              <div className="contact-submit-row">
                <LoadingButton
                  type="submit"
                  loading={loading}
                  loadingText="Transmitting Message..."
                  fullWidth
                  icon={Send}
                >
                  Send Message
                </LoadingButton>
              </div>
            </form>
          )}
        </div>

        {/* Sidebar info */}
        <div className="portfolio-contact-sidebar glass-elevation">
          <div className="sidebar-badge">
            <Sparkles size={16} />
            <span>Form Architecture</span>
          </div>
          <h3>Technical Highlights</h3>
          <ul className="sidebar-features-list">
            <li>
              <strong>Reusable Components:</strong> Implemented with <code>&lt;FormField /&gt;</code>, <code>&lt;FormSelect /&gt;</code>, and <code>&lt;LoadingButton /&gt;</code>.
            </li>
            <li>
              <strong>Live Validation:</strong> Errors trigger dynamically on <code>onBlur</code> and <code>onChange</code>.
            </li>
            <li>
              <strong>RFC Regex:</strong> Standardized email syntax checking.
            </li>
            <li>
              <strong>Async Toast Pipeline:</strong> Dispatches real-time alerts through <code>useToast()</code> Context.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
