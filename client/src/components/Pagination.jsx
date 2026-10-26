/**
 * Pagination — Prev/Next pagination controls UI component.
 * Demonstrates: Pagination UI (Syllabus Topics 67-72)
 */
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, totalPages, totalItems, pageSize, goNext, goPrev, goTo, hasNext, hasPrev }) {
  if (totalPages <= 1) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  return (
    <div className="pagination-bar">
      <span className="pagination-info">
        Showing <strong>{start}–{end}</strong> of <strong>{totalItems}</strong>
      </span>
      <div className="pagination-controls">
        <button className="button ghost small" onClick={goPrev} disabled={!hasPrev} aria-label="Previous page">
          <ChevronLeft size={16} /> Prev
        </button>
        <span className="pagination-page-indicator">Page {page} of {totalPages}</span>
        <button className="button ghost small" onClick={goNext} disabled={!hasNext} aria-label="Next page">
          Next <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

