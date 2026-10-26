/**
 * usePagination — Pagination state + data slicing hook.
 * Demonstrates: Pagination (Syllabus Topics 67-72)
 *
 * @param {Array} data - Full data array
 * @param {number} pageSize - Rows per page (default 10)
 * @returns pagination state + sliced data
 */
import { useMemo, useState } from 'react';

export function usePagination(data, pageSize = 10) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));

  // Reset to page 1 if data changes (e.g. after filtering)
  const safePage = Math.min(page, totalPages);

  const paginated = useMemo(
    () => data.slice((safePage - 1) * pageSize, safePage * pageSize),
    [data, safePage, pageSize]
  );

  function goTo(p) {
    setPage(Math.max(1, Math.min(p, totalPages)));
  }

  return {
    paginated,
    page: safePage,
    totalPages,
    totalItems: data.length,
    pageSize,
    goTo,
    goNext: () => goTo(safePage + 1),
    goPrev: () => goTo(safePage - 1),
    hasNext: safePage < totalPages,
    hasPrev: safePage > 1,
  };
}

