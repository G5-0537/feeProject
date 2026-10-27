/**
 * SkeletonRow — Animated loading placeholder for table rows.
 * Demonstrates: Loading states (Syllabus Topics 67-72)
 */
export function SkeletonRow({ cols = 5 }) {
  return (
    <tr className="skeleton-row" aria-hidden="true">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i}>
          <span className="skeleton-block" style={{ width: `${60 + (i % 3) * 20}%` }} />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonCard({ lines = 3 }) {
  return (
    <div className="skeleton-card" aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <span key={i} className="skeleton-block" style={{ width: `${90 - i * 20}%`, marginBottom: 10 }} />
      ))}
    </div>
  );
}

