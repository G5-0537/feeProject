import { useEffect, useState } from 'react';
import {
  Bell, Building2, CalendarDays, History, LayoutDashboard,
  RefreshCw, Settings, Ticket, UserRound, XCircle, Navigation,
  ClipboardList, ArrowUpDown, Filter, Printer
} from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import DashboardShell from '../components/DashboardShell.jsx';
import StatCard from '../components/StatCard.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import QRCodePass from '../components/QRCodePass.jsx';
import DigitalTokenBoardingPass from '../components/DigitalTokenBoardingPass.jsx';
import SmartRecommendationCard from '../components/SmartRecommendationCard.jsx';
import AsyncHandler from '../components/AsyncHandler.jsx';
import Tabs from '../components/Tabs.jsx';
import Modal from '../components/Modal.jsx';
import Pagination from '../components/Pagination.jsx';
import { SkeletonRow } from '../components/SkeletonRow.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useQueue } from '../context/QueueContext.jsx';
import { apiRequest } from '../services/api.js';
import { useTableControls } from '../hooks/useTableControls.js';
import { usePagination } from '../hooks/usePagination.js';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll.js';
import { openMapNavigation } from '../utils/geo.js';

const customerLinks = [
  { to: '/customer/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { to: '/customer/businesses', label: 'Business Search', icon: <Building2 size={18} /> },
  { to: '/customer/appointments', label: 'Appointments', icon: <CalendarDays size={18} /> },
  { to: '/customer/queues', label: 'Queue History', icon: <History size={18} /> },
  { to: '/customer/notifications', label: 'Notifications', icon: <Bell size={18} /> },
  { to: '/customer/profile', label: 'Profile', icon: <UserRound size={18} /> },
  { to: '/customer/settings', label: 'Settings', icon: <Settings size={18} /> },
];

export function CustomerShell({ children, title = 'Customer Dashboard', subtitle = 'Book, join and track queues from anywhere.' }) {
  const navigate = useNavigate();
  const { logoutCustomer } = useAuth();
  return (
    <DashboardShell
      title={title}
      subtitle={subtitle}
      links={customerLinks}
      onLogout={() => { logoutCustomer(); navigate('/'); }}
    >
      {children}
    </DashboardShell>
  );
}

// ─── Customer Dashboard ───────────────────────────────────────────────────────
export function CustomerDashboard() {
  const { customer } = useAuth();
  const { showToast } = useToast();
  const { setActiveQueues, setUnreadNotifications } = useQueue();
  const [data, setData] = useState({ activeQueues: [], appointments: [], queueHistory: [], notifications: [] });
  const [loading, setLoading] = useState(true);
  // Tab state — demonstrates Tabs component (Syllabus 61-66)
  const [activeTab, setActiveTab] = useState('queues');
  // Modal state — replaces browser confirm() (Syllabus 61-66)
  const [cancelModal, setCancelModal] = useState({ open: false, entryId: null });

  async function loadDashboard() {
    apiRequest('/customer/dashboard')
      .then((result) => {
        setData(result);
        setLoading(false);
        // Sync global QueueContext state
        setActiveQueues(result.activeQueues || []);
        setUnreadNotifications(result.notifications?.length || 0);
      })
      .catch((error) => {
        setLoading(false);
        showToast(error.message + '. Login as a customer to view your dashboard.', 'error');
      });
  }

  useEffect(() => {
    loadDashboard();
    const interval = setInterval(loadDashboard, 6000);
    return () => clearInterval(interval);
  }, []);

  async function confirmCancelQueue() {
    const { entryId } = cancelModal;
    setCancelModal({ open: false, entryId: null });
    try {
      await apiRequest(`/customer/queues/${entryId}/cancel`, { method: 'PATCH' });
      showToast('Queue entry cancelled successfully.', 'success');
      loadDashboard();
    } catch (error) {
      showToast(error.message, 'error');
    }
  }

  const dashTabs = [
    { key: 'queues', label: 'Active Queues', icon: <Ticket size={16} />, badge: data.activeQueues.length },
    { key: 'appointments', label: 'Appointments', icon: <CalendarDays size={16} />, badge: data.appointments.length },
    { key: 'history', label: 'Recent History', icon: <History size={16} /> },
  ];

  return (
    <CustomerShell title={`Welcome, ${customer?.name || 'Customer'}`} subtitle="Your real-time queue position, upcoming visits, and active status.">
      {/* Confirm Cancel Modal — replaces browser confirm() */}
      <Modal
        isOpen={cancelModal.open}
        title="Leave Queue?"
        message="Are you sure you want to cancel this queue entry? You will lose your current position and token."
        confirmText="Leave Queue"
        danger
        onConfirm={confirmCancelQueue}
        onCancel={() => setCancelModal({ open: false, entryId: null })}
      />

      <div className="toolbar-panel">
        <button className="button ghost small" onClick={loadDashboard}><RefreshCw size={16} /> Refresh Status</button>
        <Link to="/customer/businesses" className="button primary small"><Building2 size={16} /> Find & Join Queue</Link>
        {loading && <span className="toolbar-message">Live updating...</span>}
      </div>

      <section className="stats-grid">
        <StatCard label="Active Queues" value={data.activeQueues.length} caption="Currently in line" icon={<Ticket />} />
        <StatCard label="Appointments" value={data.appointments.length} caption="Upcoming visits" icon={<CalendarDays />} />
        <StatCard label="Notifications" value={data.notifications.length} caption="Latest alerts" icon={<Bell />} />
      </section>
      {/* Tabs — demonstrates Tabs component (Syllabus 61-66) */}
      <Tabs tabs={dashTabs} activeTab={activeTab} onChange={setActiveTab} />

      <div className="tab-content panel" id={`tabpanel-${activeTab}`} role="tabpanel">
        {activeTab === 'queues' && (
          <>
            <h2>Active Queue Tickets</h2>
            {data.activeQueues.map((item) => (
              <article className="queue-row" key={item.entry_id}>
                <Link to={`/customer/queue/${item.entry_id}`}>
                  <strong>Token #{item.token_number}</strong>
                  <span>{item.business_name} &bull; {item.service_name}</span>
                </Link>
                <div className="queue-row-metrics">
                  <span>Serving #{item.current_token}</span>
                  <span>{item.people_ahead} ahead</span>
                  <span>{item.estimated_wait}</span>
                  <StatusBadge status={item.status} />
                </div>
                <button
                  className="icon-button"
                  title="Cancel queue entry"
                  onClick={() => setCancelModal({ open: true, entryId: item.entry_id })}
                >
                  <XCircle size={17} />
                </button>
              </article>
            ))}
            {!loading && !data.activeQueues.length && (
              <div className="empty-callout">
                <p className="empty">You are not currently waiting in any queue.</p>
                <Link to="/customer/businesses" className="button secondary small">Browse Nearby Queues</Link>
              </div>
            )}
          </>
        )}

        {activeTab === 'appointments' && (
          <>
            <h2>Upcoming Appointments</h2>
            {data.appointments.map((item) => (
              <div className="list-row" key={item.appointment_id}>
                <div>
                  <strong>{item.service_name}</strong>
                  <p className="sub-text">{item.business_name} &bull; {item.appointment_date} at {item.appointment_time}</p>
                </div>
                <StatusBadge status={item.status} />
              </div>
            ))}
            {!loading && !data.appointments.length && <p className="empty">No upcoming appointments.</p>}
          </>
        )}

        {activeTab === 'history' && (
          <>
            <h2>Queue History</h2>
            {data.queueHistory.map((item) => (
              <div className="list-row" key={item.entry_id}>
                <span>#{item.token_number} &bull; {item.business_name}</span>
                <StatusBadge status={item.status} />
              </div>
            ))}
            {!loading && !data.queueHistory.length && <p className="empty">No completed queues yet.</p>}
          </>
        )}
      </div>
    </CustomerShell>
  );
}

// ─── Queue Tracking ───────────────────────────────────────────────────────────
export function QueueTracking() {
  const { entryId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  // Modal replaces browser confirm() (Syllabus 61-66)
  const [cancelModal, setCancelModal] = useState(false);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const data = await apiRequest(`/customer/queues/${entryId}`);
        if (alive) { setSnapshot(data); setLoading(false); }
      } catch {
        if (alive) {
          setLoading(false);
          showToast('Queue entry could not be loaded. Please verify your login session.', 'error');
        }
      }
    }
    load();
    const interval = setInterval(load, 5000);
    return () => { alive = false; clearInterval(interval); };
  }, [entryId]);

  async function handleCancelQueue() {
    setCancelModal(false);
    try {
      await apiRequest(`/customer/queues/${entryId}/cancel`, { method: 'PATCH' });
      showToast('Queue entry cancelled.', 'success');
      navigate('/customer/dashboard');
    } catch (error) {
      showToast(error.message, 'error');
    }
  }

  if (loading || !snapshot) {
    return (
      <CustomerShell title="Queue Tracking">
        <div className="panel"><p className="empty">Loading queue status...</p></div>
      </CustomerShell>
    );
  }

  return (
    <CustomerShell title="Live Queue Tracking" subtitle={`${snapshot.business_name} • ${snapshot.service_name}`}>
      {/* Cancel Modal */}
      <Modal
        isOpen={cancelModal}
        title="Cancel Queue Entry"
        message={`Are you sure you want to cancel Token #${snapshot.token_number}? You will lose your current position.`}
        confirmText="Cancel My Entry"
        danger
        onConfirm={handleCancelQueue}
        onCancel={() => setCancelModal(false)}
      />

      {snapshot.recommendation && snapshot.status !== 'Completed' && (
        <SmartRecommendationCard
          currentBranch={{ name: snapshot.business_name }}
          recommendation={snapshot.recommendation}
          onSelectAlternative={(altId) => navigate(`/customer/businesses/${altId}`)}
          onJoinAlternative={(altId) => navigate(`/customer/businesses/${altId}`)}
        />
      )}

      {/* Interactive Apple-Wallet style Digital Boarding Pass */}
      <DigitalTokenBoardingPass
        snapshot={snapshot}
        onNavigate={() => openMapNavigation(snapshot.latitude, snapshot.longitude, snapshot.business_address, snapshot.business_name)}
      />

      <div className="tracking-details-grid" style={{ marginTop: '24px' }}>
        <div className="panel tracking-status">
          <StatusBadge status={snapshot.status} />
          <h2>{snapshot.position_message}</h2>
          <p>Estimated waiting time updates dynamically based on active counter throughput and patient callouts.</p>
          <div className="progress-track">
            <span style={{ width: `${Math.max(10, 100 - snapshot.people_ahead * 9)}%` }} />
          </div>
          <div className="tracking-actions-bar">
            <button
              className="button ghost small"
              onClick={() => openMapNavigation(snapshot.latitude, snapshot.longitude, snapshot.business_address, snapshot.business_name)}
            >
              <Navigation size={14} /> Navigate to Branch
            </button>
            {/* Print Token — bonus feature */}
            <button className="button ghost small print-hide" onClick={() => window.print()}>
              <Printer size={14} /> Print Token
            </button>
            <button className="button danger small ghost" onClick={() => setCancelModal(true)}>
              <XCircle size={14} /> Cancel Queue Entry
            </button>
          </div>
        </div>

        <div className="panel qr-pass-panel">
          <QRCodePass
            value={`QUELESS:${snapshot.business_name}:TOKEN-${snapshot.token_number}:ENTRY-${snapshot.entry_id}`}
            label={`Token #${snapshot.token_number} Official Gate Validation Code`}
          />
        </div>
      </div>
    </CustomerShell>
  );
}

function QueueMetric({ label, value }) {
  return (
    <article className="queue-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

// ─── Customer History ─────────────────────────────────────────────────────────
// Demonstrates: Pagination, Search, Filter, Sort (Syllabus 61-66, 67-72)
export function CustomerHistory({ type }) {
  const endpoint = type === 'appointments' ? '/customer/appointments/history' : '/customer/queues/history';
  const title = type === 'appointments' ? 'Appointment History' : 'Queue History';
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [viewMode, setViewMode] = useState('pages');

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    apiRequest(endpoint, { signal: controller.signal })
      .then((data) => { setRows(data); setLoading(false); })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setError(err.message || 'Could not load history.');
        setLoading(false);
      });
    return () => controller.abort();
  }, [endpoint, reloadKey]);

  // Search + Filter + Sort (Syllabus 61-66)
  const { processed, search, setSearch, filter, setFilter, sortKey, sortDir, toggleSort } = useTableControls(rows, {
    searchFields: ['business_name', 'service_name'],
    filterField: 'status',
  });

  // Pagination (Syllabus 67-72)
  const pg = usePagination(processed, 10);
  const infinite = useInfiniteScroll(processed, 10);
  const displayedRows = viewMode === 'pages' ? pg.paginated : infinite.visible;

  const statuses = [...new Set(rows.map((r) => r.status))];

  function SortHeader({ label, field }) {
    return (
      <th onClick={() => toggleSort(field)} className="sortable-th" style={{ cursor: 'pointer' }}>
        {label} {sortKey === field ? (sortDir === 'asc' ? '↑' : '↓') : <ArrowUpDown size={13} style={{ opacity: 0.4 }} />}
      </th>
    );
  }

  return (
    <CustomerShell title={title}>
      {/* Search + Filter controls */}
      <div className="toolbar-panel">
        <input
          className="table-search-input"
          placeholder="Search business or service..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="table-filter-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button className="button ghost small" type="button" onClick={() => setViewMode((mode) => mode === 'pages' ? 'infinite' : 'pages')}>
          Use {viewMode === 'pages' ? 'infinite scroll' : 'pagination'}
        </button>
        <button className="button ghost small" type="button" onClick={() => setReloadKey((key) => key + 1)} disabled={loading}>Retry / Refresh</button>
      </div>

      {error && <div className="soft-alert" role="alert">{error} <button className="button small" type="button" onClick={() => setReloadKey((key) => key + 1)}>Retry</button></div>}
      <div className="panel">
        <table>
          <thead>
            <tr>
              <SortHeader label="Business Branch" field="business_name" />
              <SortHeader label="Service" field="service_name" />
              <th>Token / Date</th>
              <SortHeader label="Status" field="status" />
            </tr>
          </thead>
          <tbody>
            {loading && Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={4} />)}
            {!loading && displayedRows.map((row) => (
              <tr key={row.appointment_id || row.entry_id}>
                <td>{row.business_name}</td>
                <td>{row.service_name}</td>
                <td>{row.token_number ? `#${row.token_number}` : row.appointment_date}</td>
                <td><StatusBadge status={row.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && !displayedRows.length && !error && <p className="empty">No records found.</p>}
        {!loading && viewMode === 'pages' && <Pagination {...pg} />}
        {!loading && viewMode === 'infinite' && infinite.hasMore && <div ref={infinite.sentinelRef} className="pagination-info" aria-live="polite">Showing {displayedRows.length} of {processed.length}; scroll for more…</div>}
        {!loading && viewMode === 'infinite' && !infinite.hasMore && processed.length > 0 && <div className="pagination-info">All {processed.length} records shown.</div>}
      </div>
    </CustomerShell>
  );
}

// ─── Notifications Page ───────────────────────────────────────────────────────
export function NotificationsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest('/customer/notifications').then((data) => { setRows(data); setLoading(false); }).catch(() => { setRows([]); setLoading(false); });
  }, []);

  // Filter by notification type (Syllabus 61-66)
  const { processed, filter, setFilter } = useTableControls(rows, { filterField: 'type' });
  const pg = usePagination(processed, 10);
  const types = [...new Set(rows.map((r) => r.type))];

  return (
    <CustomerShell title="Notifications">
      <div className="toolbar-panel">
        <select className="table-filter-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All Types</option>
          {types.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div className="panel">
        {loading && Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton-card" style={{ margin: '8px 0' }}><span className="skeleton-block" style={{ width: '80%', marginBottom: 6 }} /><span className="skeleton-block" style={{ width: '40%' }} /></div>)}
        {pg.paginated.map((item) => (
          <div className="list-row" key={item.notification_id}>
            <span>{item.message}</span>
            <StatusBadge status={item.type} />
          </div>
        ))}
        {!loading && !pg.paginated.length && <p className="empty">No notifications yet.</p>}
        <Pagination {...pg} />
      </div>
    </CustomerShell>
  );
}

// ─── Profile Page ─────────────────────────────────────────────────────────────
export function ProfilePage() {
  const { customer } = useAuth();
  return (
    <CustomerShell title="Profile">
      <div className="panel profile-card">
        <UserRound size={42} />
        <h2>{customer?.name || 'Customer'}</h2>
        <p>{customer?.email || 'Login to load your profile.'}</p>
        <p>{customer?.phone}</p>
      </div>
    </CustomerShell>
  );
}

// ─── Settings Page ────────────────────────────────────────────────────────────
export function SettingsPage() {
  return (
    <CustomerShell title="Settings">
      <div className="panel">
        <h2>Preferences</h2>
        <p>Theme preference is saved automatically and stays after refresh.</p>
      </div>
    </CustomerShell>
  );
}
