/**
 * useTableControls — Combined search + filter + sort state for tables.
 * Demonstrates: Search, filter, sort patterns (Syllabus Topics 61-66)
 *
 * @param {Array} data - Raw data array
 * @param {Object} config - { searchFields: string[], filterField?: string }
 * @returns processed data + control state setters
 */
import { useMemo, useState } from 'react';

export function useTableControls(data, config = {}) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [sortKey, setSortKey] = useState('');
  const [sortDir, setSortDir] = useState('asc');

  function toggleSort(key) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  const processed = useMemo(() => {
    let result = [...data];

    // Search across specified fields
    if (search && config.searchFields?.length) {
      const lower = search.toLowerCase();
      result = result.filter((row) =>
        config.searchFields.some((f) => String(row[f] ?? '').toLowerCase().includes(lower))
      );
    }

    // Filter by exact field value
    if (filter && config.filterField) {
      result = result.filter((row) =>
        String(row[config.filterField] ?? '').toLowerCase() === filter.toLowerCase()
      );
    }

    // Sort by key
    if (sortKey) {
      result.sort((a, b) => {
        const av = a[sortKey] ?? '';
        const bv = b[sortKey] ?? '';
        const cmp = typeof av === 'number' && typeof bv === 'number'
          ? av - bv
          : String(av).localeCompare(String(bv));
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }

    return result;
  }, [data, search, filter, sortKey, sortDir, config.searchFields, config.filterField]);

  return { processed, search, setSearch, filter, setFilter, sortKey, sortDir, toggleSort };
}

