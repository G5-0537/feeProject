/**
 * QueueContext — Global queue state for customer side.
 * Demonstrates: Global vs Local State, Context API (Syllabus Topics 49-54)
 *
 * Shares active queue count across CustomerDashboard, QueueTracking,
 * and the sidebar badge — without duplicate API calls or prop-drilling.
 */
import { createContext, useContext, useMemo, useState } from 'react';

const QueueContext = createContext(null);

export function QueueProvider({ children }) {
  // Global: active queue list shared between Dashboard + Tracking page
  const [activeQueues, setActiveQueues] = useState([]);
  // Global: unread notification count for sidebar badge
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const value = useMemo(() => ({
    activeQueues,
    setActiveQueues,
    activeQueueCount: activeQueues.length,
    unreadNotifications,
    setUnreadNotifications,
  }), [activeQueues, unreadNotifications]);

  return <QueueContext.Provider value={value}>{children}</QueueContext.Provider>;
}

export function useQueue() {
  const ctx = useContext(QueueContext);
  if (!ctx) throw new Error('useQueue must be used inside <QueueProvider>');
  return ctx;
}

