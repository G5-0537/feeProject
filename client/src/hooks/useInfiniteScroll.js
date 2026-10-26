/**
 * useInfiniteScroll — progressively reveals an in-memory result list as its
 * sentinel enters the viewport. Use with server pagination when APIs expose it;
 * this project currently retrieves history in one request, so batching is local.
 */
import { useEffect, useMemo, useRef, useState } from 'react';

export function useInfiniteScroll(data, pageSize = 10) {
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const sentinelRef = useRef(null);

  useEffect(() => setVisibleCount(pageSize), [data, pageSize]);

  const visible = useMemo(() => data.slice(0, visibleCount), [data, visibleCount]);
  const hasMore = visibleCount < data.length;

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setVisibleCount((count) => Math.min(count + pageSize, data.length));
    }, { rootMargin: '160px' });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [data.length, hasMore, pageSize]);

  return { visible, sentinelRef, hasMore };
}
