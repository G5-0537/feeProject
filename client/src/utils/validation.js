/**
 * Form Validation Strategies Utility
 * Implements client-side validation rules, regex patterns, and field-level validators.
 * Aligned with React Form Handling syllabus requirements.
 */

export const VALIDATION_RULES = {
  EMAIL_REGEX: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  PHONE_REGEX: /^[6-9]\d{9}$/, // Indian 10-digit mobile starting with 6,7,8,9
  NAME_REGEX: /^[a-zA-Z\s.'-]{2,50}$/,
};

/**
 * Validates an email address.
 * @param {string} email
 * @returns {string|null} Error message or null if valid.
 */
export function validateEmail(email) {
  if (!email || !email.trim()) {
    return 'Email address is required.';
  }
  if (!VALIDATION_RULES.EMAIL_REGEX.test(email.trim())) {
    return 'Please enter a valid email address (e.g., name@domain.com).';
  }
  return null;
}

/**
 * Validates password strength & length.
 * @param {string} password
 * @param {number} minLength
 * @returns {string|null} Error message or null if valid.
 */
export function validatePassword(password, minLength = 6) {
  if (!password) {
    return 'Password is required.';
  }
  if (password.length < minLength) {
    return `Password must be at least ${minLength} characters long.`;
  }
  return null;
}

/**
 * Validates a mobile phone number.
 * @param {string} phone
 * @returns {string|null} Error message or null if valid.
 */
export function validatePhone(phone) {
  if (!phone || !phone.trim()) {
    return null; // Phone is optional in some forms unless explicitly required
  }
  const cleanPhone = phone.replace(/[\s-]/g, '');
  if (!VALIDATION_RULES.PHONE_REGEX.test(cleanPhone)) {
    return 'Please enter a valid 10-digit mobile number.';
  }
  return null;
}

/**
 * Validates required text field.
 * @param {string} value
 * @param {string} fieldLabel
 * @returns {string|null} Error message or null if valid.
 */
export function validateRequired(value, fieldLabel = 'This field') {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return `${fieldLabel} is required.`;
  }
  return null;
}

/**
 * Validates confirmation match (e.g. confirm password).
 * @param {string} val1
 * @param {string} val2
 * @param {string} label
 * @returns {string|null}
 */
export function validateMatch(val1, val2, label = 'Passwords') {
  if (val1 !== val2) {
    return `${label} do not match.`;
  }
  return null;
}

/**
 * Evaluates password strength score (0-4).
 * @param {string} password
 * @returns {{ score: number, label: string, color: string }}
 */
export function evaluatePasswordStrength(password = '') {
  if (!password) return { score: 0, label: 'None', color: 'var(--muted)' };
  let score = 0;
  if (password.length >= 6) score += 1;
  if (password.length >= 10) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;

  switch (score) {
    case 1:
      return { score: 1, label: 'Weak', color: '#ef4444' };
    case 2:
      return { score: 2, label: 'Fair', color: '#f59e0b' };
    case 3:
      return { score: 3, label: 'Good', color: '#3b82f6' };
    case 4:
      return { score: 4, label: 'Strong', color: '#10b981' };
    default:
      return { score: 0, label: 'Very Weak', color: '#ef4444' };
  }
}
