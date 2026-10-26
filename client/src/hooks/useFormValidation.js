/**
 * useFormValidation — Form validation logic as a reusable hook.
 * Demonstrates: Validation strategies (Syllabus Topics 55-60)
 *
 * @param {Object} rules - Field validation rules map
 * @returns {{ errors, validate, clearErrors, clearField }}
 *
 * Rule shape per field:
 *   required?: boolean
 *   minLength?: number
 *   maxLength?: number
 *   min?: number
 *   max?: number
 *   pattern?: RegExp
 *   message?: string   (used with pattern)
 *   custom?: (value, formData) => string | null
 */
import { useCallback, useState } from 'react';

export function useFormValidation(rules = {}) {
  const [errors, setErrors] = useState({});

  const validate = useCallback((formData) => {
    const newErrors = {};

    for (const [field, rule] of Object.entries(rules)) {
      const raw = formData[field];
      const value = typeof raw === 'string' ? raw.trim() : raw;

      if (rule.required && (value === '' || value === null || value === undefined)) {
        newErrors[field] = `${rule.label || field} is required.`;
        continue;
      }

      if (value === '' || value === null || value === undefined) continue;

      if (rule.minLength && String(value).length < rule.minLength) {
        newErrors[field] = `${rule.label || field} must be at least ${rule.minLength} characters.`;
        continue;
      }

      if (rule.maxLength && String(value).length > rule.maxLength) {
        newErrors[field] = `${rule.label || field} must be at most ${rule.maxLength} characters.`;
        continue;
      }

      if (rule.min !== undefined && Number(value) < rule.min) {
        newErrors[field] = `${rule.label || field} must be at least ${rule.min}.`;
        continue;
      }

      if (rule.max !== undefined && Number(value) > rule.max) {
        newErrors[field] = `${rule.label || field} must be at most ${rule.max}.`;
        continue;
      }

      if (rule.pattern && !rule.pattern.test(String(value))) {
        newErrors[field] = rule.message || `${rule.label || field} format is invalid.`;
        continue;
      }

      if (rule.custom) {
        const customError = rule.custom(value, formData);
        if (customError) {
          newErrors[field] = customError;
          continue;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [rules]);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const clearField = useCallback((field) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  return { errors, validate, clearErrors, clearField };
}

