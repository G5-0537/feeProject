/**
 * useDebounce — Delays updating a value until the user has stopped changing it.
 * Demonstrates: Debounce pattern (Syllabus Topics 67-72)
 *
 * @param {*} value - The value to debounce
 * @param {number} delay - Milliseconds to wait (default 400ms)
 * @returns {*} debounced value
 *
 * Usage:
 *   const debouncedSearch = useDebounce(searchQuery, 400);
 *   useEffect(() => { fetchData(debouncedSearch); }, [debouncedSearch]);
 */
import { useEffect, useState } from 'react';

export function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

