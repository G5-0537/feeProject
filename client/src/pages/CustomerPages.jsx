import { useEffect, useState } from 'react';
import { Bell, Building2, CalendarDays, History, LayoutDashboard, RefreshCw, Settings, Ticket, UserRound, XCircle, Navigation, MapPin } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import DashboardShell from '../components/DashboardShell.jsx';
import StatCard from '../components/StatCard.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import QRCodePass from '../components/QRCodePass.jsx';
import SmartRecommendationCard from '../components/SmartRecommendationCard.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { apiRequest } from '../services/api.js';
import { openMapNavigation } from '../utils/geo.js';

const customerLinks = [
  { to: '/customer/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { to: '/businesses', label: 'Business Search', icon: <Building2 size={18} /> },
  { to: '/customer/appointments', label: 'Appointments', icon: <CalendarDays size={18} /> },
  { to: '/customer/queues', label: 'Queue History', icon: <History size={18} /> },
  { to: '/customer/notifications', label: 'Notifications', icon: <Bell size={18} /> },
  { to: '/customer/profile', label: 'Profile', icon: <UserRound size={18} /> },
  { to: '/customer/settings', label: 'Settings', icon: <Settings size={18} /> }
];

function CustomerShell({ children, title = 'Customer Dashboard', subtitle = 'Book, join and track queues from anywhere.' }) {
  const navigate = useNavigate();
  const { logoutCustomer } = useAuth();
  return (
    <DashboardShell
      title={title}
      subtitle={subtitle}
      links={customerLinks}
      onLogout={() => {
        logoutCustomer();
        navigate('/');
      }}
    >
      {children}
    </DashboardShell>
  );
}

export function CustomerDashboard() {
  const { customer } = useAuth();
  const [data, setData] = useState({ activeQueues: [], appointments: [], queueHistory: [], notifications: [] });
  const [status, setStatus] = useState({ loading: true, error: '' });

  async function loadDashboard() {
    setStatus((prev) => ({ ...prev, error: '' }));
    apiRequest('/customer/dashboard')
      .then((result) => {
        setData(result);
        setStatus({ loading: false, error: '' });
      })
      .catch((error) => setStatus({ loading: false, error: `${error.message}. Login as a customer to view your dashboard.` }));
  }

  async function cancelQueue(entryId) {
    if (!confirm('Are you sure you want to leave this queue?')) return;
    try {
      await apiRequest(`/customer/queues/${entryId}/cancel`, { method: 'PATCH' });
      loadDashboard();
    } catch (error) {
      setStatus({ loading: false, error: error.message });
    }
  }

  useEffect(() => {
    loadDashboard();
    const interval = setInterval(loadDashboard, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <CustomerShell title={`Welcome, ${customer?.name || 'Customer'}`} subtitle="Here is your real-time queue position, upcoming visits, and active status.">
      {status.error && <p className="soft-alert">{status.error}</p>}
      <div className="toolbar-panel">
        <button className="button ghost small" onClick={loadDashboard}><RefreshCw size={16} /> Refresh Status</button>
        <Link to="/businesses" className="button primary small"><Building2 size={16} /> Find &amp; Join Queue</Link>
        {status.loading && <span className="toolbar-message">Live updating...</span>}
      </div>
      <section className="stats-grid">
        <StatCard label="Active Queues" value={data.activeQueues.length} caption="Currently in line" icon={<Ticket />} />
        <StatCard label="Appointments" value={data.appointments.length} caption="Upcoming visits" icon={<CalendarDays />} />
        <StatCard label="Notifications" value={data.notifications.length} caption="Latest alerts" icon={<Bell />} />
      </section>
      <section className="content-grid">
        <div className="panel">
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
              <button className="icon-button" title="Cancel queue entry" onClick={() => cancelQueue(item.entry_id)}><XCircle size={17} /></button>
            </article>
          ))}
          {!status.loading && !data.activeQueues.length && (
            <div className="empty-callout">
              <p className="empty">You are not currently waiting in any queue.</p>
              <Link to="/businesses" className="button secondary small">Browse Nearby Queues</Link>
            </div>
          )}
        </div>
        <div className="panel">
          <h2>Recent Appointments</h2>
          {data.appointments.map((item) => (
            <div className="list-row" key={item.appointment_id}>
              <div>
                <strong>{item.service_name}</strong>
                <p className="sub-text">{item.business_name} &bull; {item.appointment_date} at {item.appointment_time}</p>
              </div>
              <StatusBadge status={item.status} />
            </div>
          ))}
          {!status.loading && !data.appointments.length && <p className="empty">No upcoming appointments.</p>}
        </div>
        <div className="panel">
          <h2>Queue History</h2>
          {data.queueHistory.map((item) => (
            <div className="list-row" key={item.entry_id}>
              <span>#{item.token_number} &bull; {item.business_name}</span>
              <StatusBadge status={item.status} />
            </div>
          ))}
          {!status.loading && !data.queueHistory.length && <p className="empty">No completed queues yet.</p>}
        </div>
      </section>
    </CustomerShell>
  );
}

export function QueueTracking() {
  const { entryId } = useParams();
  const navigate = useNavigate();
  const [snapshot, setSnapshot] = useState(null);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const data = await apiRequest(`/customer/queues/${entryId}`);
        if (alive) setSnapshot(data);
      } catch {
        if (alive) {
          setNotice('Queue entry could not be loaded. Please verify your login session.');
          setSnapshot(null);
        }
      }
    }
    load();
    const interval = setInterval(load, 5000);
    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, [entryId]);

  async function handleCancelQueue() {
    if (!confirm('Are you sure you want to cancel this queue entry?')) return;
    try {
      await apiRequest(`/customer/queues/${entryId}/cancel`, { method: 'PATCH' });
      navigate('/customer/dashboard');
    } catch (error) {
      setNotice(error.message);
    }
  }

  if (!snapshot) {
    return (
      <CustomerShell title="Queue Tracking">
        <div className="panel">{notice || 'Loading queue status...'}</div>
      </CustomerShell>
    );
  }

  return (
    <CustomerShell title="Live Queue Tracking" subtitle={`${snapshot.business_name} • ${snapshot.service_name}`}>
      {notice && <p className="soft-alert">{notice}</p>}

      {/* If current branch is crowded, show Smart Recommendation */}
      {snapshot.recommendation && snapshot.status !== 'Completed' && (
        <SmartRecommendationCard
          currentBranch={{ name: snapshot.business_name }}
          recommendation={snapshot.recommendation}
          onSelectAlternative={(altId) => navigate(`/businesses/${altId}`)}
          onJoinAlternative={(altId) => navigate(`/businesses/${altId}`)}
        />
      )}

      <section className="tracking-board">
        <QueueMetric label="Your Token" value={`#${snapshot.token_number}`} />
        <QueueMetric label="Now Serving" value={`#${snapshot.current_token || 0}`} />
        <QueueMetric label="People Ahead" value={snapshot.people_ahead} />
        <QueueMetric label="Estimated Wait" value={snapshot.estimated_wait} />
      </section>

      <div className="tracking-details-grid">
        <div className="panel tracking-status">
          <StatusBadge status={snapshot.status} />
          <h2>{snapshot.position_message}</h2>
          <p>Estimated waiting time updates dynamically based on active queue throughput.</p>
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
            <button className="button danger small ghost" onClick={handleCancelQueue}>
              <XCircle size={14} /> Cancel Queue Entry
            </button>
          </div>
        </div>

        <div className="panel qr-pass-panel">
          <QRCodePass
            value={`QUELESS:${snapshot.business_name}:TOKEN-${snapshot.token_number}:ENTRY-${snapshot.entry_id}`}
            label={`Token #${snapshot.token_number} Digital Verification Pass`}
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

export function CustomerHistory({ type }) {
  const endpoint = type === 'appointments' ? '/customer/appointments/history' : '/customer/queues/history';
  const title = type === 'appointments' ? 'Appointment History' : 'Queue History';
  const [rows, setRows] = useState([]);

  useEffect(() => {
    apiRequest(endpoint).then(setRows).catch(() => setRows([]));
  }, [endpoint]);

  return (
    <CustomerShell title={title}>
      <div className="panel">
        <table>
          <thead><tr><th>Business Branch</th><th>Service</th><th>Token / Date</th><th>Status</th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.appointment_id || row.entry_id}>
                <td>{row.business_name}</td>
                <td>{row.service_name}</td>
                <td>{row.token_number ? `#${row.token_number}` : row.appointment_date}</td>
                <td><StatusBadge status={row.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <p className="empty">No records found.</p>}
      </div>
    </CustomerShell>
  );
}

export function NotificationsPage() {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    apiRequest('/customer/notifications').then(setRows).catch(() => setRows([]));
  }, []);
  return (
    <CustomerShell title="Notifications">
      <div className="panel">
        {rows.map((item) => <div className="list-row" key={item.notification_id}><span>{item.message}</span><StatusBadge status={item.type} /></div>)}
        {!rows.length && <p className="empty">No notifications yet.</p>}
      </div>
    </CustomerShell>
  );
}

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
