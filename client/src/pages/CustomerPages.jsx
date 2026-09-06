import { useEffect, useState } from 'react';
import { Bell, Building2, CalendarDays, History, LayoutDashboard, RefreshCw, Settings, Ticket, UserRound, XCircle } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import DashboardShell from '../components/DashboardShell.jsx';
import StatCard from '../components/StatCard.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { apiRequest } from '../services/api.js';

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
    setStatus({ loading: true, error: '' });
    apiRequest('/customer/dashboard')
      .then((result) => {
        setData(result);
        setStatus({ loading: false, error: '' });
      })
      .catch((error) => setStatus({ loading: false, error: `${error.message}. Login as a customer to view your dashboard.` }));
  }

  async function cancelQueue(entryId) {
    try {
      await apiRequest(`/customer/queues/${entryId}/cancel`, { method: 'PATCH' });
      loadDashboard();
    } catch (error) {
      setStatus({ loading: false, error: error.message });
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  return (
    <CustomerShell title={`Welcome, ${customer?.name || 'Customer'}`} subtitle="Here is your queue position, appointments and recent queue history.">
      {status.error && <p className="soft-alert">{status.error}</p>}
      <div className="toolbar-panel">
        <button className="button ghost small" onClick={loadDashboard}><RefreshCw size={16} /> Refresh Status</button>
        {status.loading && <span className="toolbar-message">Updating dashboard...</span>}
      </div>
      <section className="stats-grid">
        <StatCard label="Active Queues" value={data.activeQueues.length} caption="Currently waiting" icon={<Ticket />} />
        <StatCard label="Upcoming" value={data.appointments.length} caption="Recent appointments" icon={<CalendarDays />} />
        <StatCard label="Notifications" value={data.notifications.length} caption="Latest updates" icon={<Bell />} />
      </section>
      <section className="content-grid">
        <div className="panel">
          <h2>Active Queue</h2>
          {data.activeQueues.map((item) => (
            <article className="queue-row" key={item.entry_id}>
              <Link to={`/customer/queue/${item.entry_id}`}>
                <strong>Token #{item.token_number}</strong>
                <span>{item.business_name} • {item.service_name}</span>
              </Link>
              <div className="queue-row-metrics">
                <span>Now #{item.current_token}</span>
                <span>{item.people_ahead} ahead</span>
                <span>{item.estimated_wait}</span>
                <StatusBadge status={item.status} />
              </div>
              <button className="icon-button" title="Cancel queue entry" onClick={() => cancelQueue(item.entry_id)}><XCircle size={17} /></button>
            </article>
          ))}
          {!status.loading && !data.activeQueues.length && <p className="empty">No active queue entries.</p>}
        </div>
        <div className="panel">
          <h2>Recent Appointments</h2>
          {data.appointments.map((item) => (
            <div className="list-row" key={item.appointment_id}>
              <span>{item.business_name} • {item.service_name}</span>
              <StatusBadge status={item.status} />
            </div>
          ))}
          {!status.loading && !data.appointments.length && <p className="empty">No appointments yet.</p>}
        </div>
        <div className="panel">
          <h2>Queue History</h2>
          {data.queueHistory.map((item) => (
            <div className="list-row" key={item.entry_id}>
              <span>#{item.token_number} • {item.business_name}</span>
              <StatusBadge status={item.status} />
            </div>
          ))}
          {!status.loading && !data.queueHistory.length && <p className="empty">No completed or cancelled queues yet.</p>}
        </div>
      </section>
    </CustomerShell>
  );
}

export function QueueTracking() {
  const { entryId } = useParams();
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
          setNotice('Queue entry could not be loaded. Make sure you are logged in and MySQL is running.');
          setSnapshot(null);
        }
      }
    }
    load();
    const interval = setInterval(load, 10000);
    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, [entryId]);

  if (!snapshot) return <CustomerShell title="Queue Tracking"><div className="panel">{notice || 'Loading queue...'}</div></CustomerShell>;

  return (
    <CustomerShell title="Queue Tracking" subtitle={`${snapshot.business_name} • ${snapshot.service_name}`}>
      {notice && <p className="soft-alert">{notice}</p>}
      <section className="tracking-board">
        <QueueMetric label="Your Token" value={`#${snapshot.token_number}`} />
        <QueueMetric label="Now Serving" value={`#${snapshot.current_token}`} />
        <QueueMetric label="People Ahead" value={snapshot.people_ahead} />
        <QueueMetric label="Estimated Wait" value={snapshot.estimated_wait} />
      </section>
      <div className="panel tracking-status">
        <StatusBadge status={snapshot.status} />
        <h2>{snapshot.position_message}</h2>
        <p>Waiting time is an estimate based on people ahead and historical average service duration.</p>
        <div className="progress-track"><span style={{ width: `${Math.max(8, 100 - snapshot.people_ahead * 9)}%` }} /></div>
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
          <thead><tr><th>Business</th><th>Service</th><th>Token/Date</th><th>Status</th></tr></thead>
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
        {!rows.length && <p className="empty">No records yet.</p>}
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
