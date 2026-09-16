import { useEffect, useState } from 'react';
import { BarChart3, Building, CalendarDays, CheckCircle2, ClipboardList, Download, History, LayoutDashboard, MonitorPlay, Pause, Play, Plus, Scissors, Settings2, UserPlus, MapPin, Navigation } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import DashboardShell from '../components/DashboardShell.jsx';
import StatCard from '../components/StatCard.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { apiRequest } from '../services/api.js';
import { announceToken, playChimeTone } from '../utils/audio.js';
import { openMapNavigation } from '../utils/geo.js';

const staffLinks = [
  { to: '/staff/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { to: '/staff/queue', label: "Today's Queue", icon: <ClipboardList size={18} /> },
  { to: '/staff/appointments', label: 'Appointments', icon: <CalendarDays size={18} /> },
  { to: '/staff/walk-in', label: 'Add Walk-in', icon: <UserPlus size={18} /> },
  { to: '/staff/services', label: 'Services', icon: <Settings2 size={18} /> },
  { to: '/staff/branch', label: 'Branch Settings', icon: <Building size={18} /> },
  { to: '/staff/statistics', label: 'Statistics', icon: <BarChart3 size={18} /> },
  { to: '/staff/history', label: 'History', icon: <History size={18} /> }
];

function downloadCSV(filename, data) {
  if (!data || !data.length) return;
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map((row) =>
      headers.map((h) => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', `${filename}-${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function StaffShell({ children, title = 'Staff Command Center', subtitle }) {
  const navigate = useNavigate();
  const { staff, logoutStaff } = useAuth();
  return (
    <DashboardShell
      title={title}
      subtitle={subtitle || `${staff?.business_name || 'Business'} Operational Queue Desk`}
      links={staffLinks}
      onLogout={() => {
        logoutStaff();
        navigate('/');
      }}
    >
      {children}
    </DashboardShell>
  );
}

export function StaffDashboard() {
  const { staff } = useAuth();
  const [data, setData] = useState({ summary: {}, branch: {}, queue: [] });
  const [notice, setNotice] = useState('');
  const [isPaused, setIsPaused] = useState(false);
  const businessId = staff?.business_id || 1;

  async function load() {
    try {
      const result = await apiRequest('/staff/dashboard', { staff: true });
      setData(result);
      setIsPaused(result.summary?.is_paused || result.branch?.is_paused || false);
    } catch (error) {
      setNotice(`${error.message}. Login as staff to control live data.`);
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  async function togglePause() {
    try {
      const res = await apiRequest('/staff/queue/pause', {
        method: 'PATCH',
        body: { is_paused: !isPaused },
        staff: true
      });
      setIsPaused(res.is_paused);
      setNotice(res.message);
      load();
    } catch (error) {
      setNotice(error.message);
    }
  }

  const nextWaiting = data.queue?.find((q) => ['Waiting', 'Approaching'].includes(q.status));
  const currentServing = data.queue?.find((q) => q.status === 'Now Serving');

  return (
    <StaffShell>
      {notice && <p className="soft-alert">{notice}</p>}

      {/* Operational Quick Command Bar */}
      <div className="toolbar-panel staff-quick-bar">
        <div className="staff-status-indicators">
          <span className={`queue-status-tag ${isPaused ? 'paused' : 'active'}`}>
            <span className="dot" /> {isPaused ? 'Queue Paused' : 'Queue Active'}
          </span>
          <span className="branch-id-tag">
            <Building size={14} /> {data.branch?.name || staff?.business_name}
          </span>
        </div>

        <div className="staff-actions-cluster">
          <button
            className={`button small ${isPaused ? 'primary' : 'ghost'}`}
            onClick={togglePause}
            title="Pause or Resume Queue Acceptance"
          >
            {isPaused ? <><Play size={15} /> Resume Queue</> : <><Pause size={15} /> Pause Queue</>}
          </button>
          <Link to="/staff/walk-in" className="button small secondary">
            <Plus size={15} /> Add Walk-in
          </Link>
          <Link to={`/display/${businessId}`} target="_blank" className="button small ghost" title="Open TV Waiting Room Screen">
            <MonitorPlay size={15} /> TV Display Screen
          </Link>
        </div>
      </div>

      {/* Next Customer Spotlight Card */}
      <div className="next-customer-spotlight">
        <div className="spotlight-card serving">
          <span className="spotlight-label">NOW SERVING AT COUNTER</span>
          {currentServing ? (
            <div className="spotlight-body">
              <span className="spotlight-token">#{currentServing.token_number}</span>
              <div className="spotlight-info">
                <strong>{currentServing.customer_name || 'Guest Customer'}</strong>
                <span>{currentServing.service_name} &bull; {currentServing.source || 'Online'}</span>
              </div>
            </div>
          ) : (
            <div className="spotlight-empty">Counter is currently ready for next token.</div>
          )}
        </div>

        <div className="spotlight-card next">
          <span className="spotlight-label">NEXT IN LINE</span>
          {nextWaiting ? (
            <div className="spotlight-body">
              <span className="spotlight-token next-tok">#{nextWaiting.token_number}</span>
              <div className="spotlight-info">
                <strong>{nextWaiting.customer_name || 'Guest Customer'}</strong>
                <span>{nextWaiting.service_name} &bull; {nextWaiting.source || 'Online'}</span>
              </div>
            </div>
          ) : (
            <div className="spotlight-empty">No waiting customers in line.</div>
          )}
        </div>
      </div>

      <section className="stats-grid">
        <StatCard label="Waiting in Line" value={data.summary.waiting_count || 0} caption="Active queue" icon={<ClipboardList />} />
        <StatCard label="Now Serving" value={data.summary.serving_count || 0} caption="Current counter" icon={<Scissors />} />
        <StatCard label="Completed Today" value={data.summary.completed_count || 0} caption="Finished services" icon={<CheckCircle2 />} />
      </section>

      <QueueTable rows={data.queue} onReload={load} />
    </StaffShell>
  );
}

export function TodaysQueue() {
  const { staff } = useAuth();
  const [rows, setRows] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState('');
  const [message, setMessage] = useState('');
  const businessId = staff?.business_id || 1;

  async function load() {
    try {
      const [queueRows, serviceRows] = await Promise.all([
        apiRequest('/staff/queue', { staff: true }),
        apiRequest('/staff/services', { staff: true })
      ]);
      setRows(queueRows);
      setServices(serviceRows);
      setSelectedService(String(serviceRows[0]?.service_id || ''));
    } catch {
      setRows([]);
      setServices([]);
      setMessage('Login as staff to manage the live queue.');
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  async function callNext() {
    try {
      const result = await apiRequest('/staff/queue/call-next', {
        method: 'POST',
        body: { service_id: Number(selectedService) },
        staff: true
      });
      setMessage(result.message);

      playChimeTone();
      if (result.entry?.token_number) {
        const srv = services.find((s) => s.service_id === Number(selectedService));
        announceToken(result.entry.token_number, 1, srv?.service_name);
      }

      load();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function updateStatus(entryId, status) {
    try {
      const result = await apiRequest(`/staff/queue/${entryId}/status`, {
        method: 'PATCH',
        body: { status },
        staff: true
      });
      setMessage(result.message);
      load();
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <StaffShell title="Live Queue Operations">
      <div className="toolbar-panel">
        <select value={selectedService} onChange={(e) => setSelectedService(e.target.value)}>
          {services.map((service) => <option key={service.service_id} value={service.service_id}>{service.service_name}</option>)}
        </select>
        <button className="button" onClick={callNext}>Call Next Customer</button>
        <Link to={`/display/${businessId}`} target="_blank" className="button ghost small" title="Open TV Screen for Waiting Area">
          <MonitorPlay size={16} /> TV Screen
        </Link>
        {message && <span className="toolbar-message">{message}</span>}
      </div>
      <QueueTable rows={rows} onUpdate={updateStatus} onReload={load} />
    </StaffShell>
  );
}

function QueueTable({ rows, onUpdate, onReload }) {
  async function handleAction(entryId, status) {
    if (onUpdate) {
      onUpdate(entryId, status);
    } else {
      try {
        await apiRequest(`/staff/queue/${entryId}/status`, {
          method: 'PATCH',
          body: { status },
          staff: true
        });
        if (onReload) onReload();
      } catch (err) {
        alert(err.message);
      }
    }
  }

  return (
    <div className="panel">
      <h2>Active Queue Tickets</h2>
      <table>
        <thead>
          <tr>
            <th>Token</th>
            <th>Customer</th>
            <th>Service</th>
            <th>Source</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {rows?.map((row) => (
            <tr key={row.entry_id} className={row.status === 'Now Serving' ? 'row-serving' : ''}>
              <td><strong>#{row.token_number}</strong></td>
              <td>{row.customer_name || 'Customer'}</td>
              <td>{row.service_name}</td>
              <td>{row.source || 'Online'}</td>
              <td><StatusBadge status={row.status} /></td>
              <td className="table-actions">
                <button className="button small primary" title="Complete visit" onClick={() => handleAction(row.entry_id, 'Completed')}>
                  <CheckCircle2 size={14} /> Complete
                </button>
                <button className="button small ghost" title="Skip token" onClick={() => handleAction(row.entry_id, 'Skipped')}>
                  <Scissors size={14} /> Skip
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!rows?.length && <p className="empty">No queue entries currently active.</p>}
    </div>
  );
}

export function StaffBranch() {
  const { staff } = useAuth();
  const [branch, setBranch] = useState(null);
  const [form, setForm] = useState({
    name: '',
    branch_name: '',
    address: '',
    contact: '',
    latitude: 30.7333,
    longitude: 76.7794,
    opening_time: '08:30:00',
    closing_time: '18:00:00'
  });
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState({ loading: true, error: '' });

  async function load() {
    setStatus({ loading: true, error: '' });
    try {
      const data = await apiRequest('/staff/branch', { staff: true });
      setBranch(data);
      setForm({
        name: data.name || '',
        branch_name: data.branch_name || '',
        address: data.address || '',
        contact: data.contact || '',
        latitude: data.latitude || 30.7333,
        longitude: data.longitude || 76.7794,
        opening_time: data.opening_time || '08:30:00',
        closing_time: data.closing_time || '18:00:00'
      });
      setStatus({ loading: false, error: '' });
    } catch (err) {
      setStatus({ loading: false, error: err.message });
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function submit(e) {
    e.preventDefault();
    setMessage('');
    try {
      const result = await apiRequest('/staff/branch', {
        method: 'PATCH',
        body: form,
        staff: true
      });
      setMessage(result.message || 'Branch settings saved.');
      load();
    } catch (err) {
      setMessage(err.message);
    }
  }

  return (
    <StaffShell title="Branch Profile &amp; Geo Settings">
      <div className="panel form-panel">
        <h2>Branch Information</h2>
        <p className="sub-text">This location data is used by the Smart Nearby Queue Recommendation system to calculate distance and navigate customers.</p>
        {status.error && <p className="soft-alert">{status.error}</p>}
        {message && <p className="soft-alert">{message}</p>}

        <form onSubmit={submit}>
          <label>Branch Name<input value={form.branch_name} onChange={(e) => setForm({ ...form, branch_name: e.target.value })} required /></label>
          <label>Display Full Name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>
          <label>Street Address<input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required /></label>
          <label>Contact Phone<input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} required /></label>
          <div className="grid-2">
            <label>Latitude<input type="number" step="0.0001" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: Number(e.target.value) })} required /></label>
            <label>Longitude<input type="number" step="0.0001" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: Number(e.target.value) })} required /></label>
          </div>
          <div className="grid-2">
            <label>Opening Time<input type="time" value={form.opening_time.slice(0, 5)} onChange={(e) => setForm({ ...form, opening_time: `${e.target.value}:00` })} required /></label>
            <label>Closing Time<input type="time" value={form.closing_time.slice(0, 5)} onChange={(e) => setForm({ ...form, closing_time: `${e.target.value}:00` })} required /></label>
          </div>
          <div className="form-actions-row">
            <button className="button primary">Save Branch Settings</button>
            <button
              type="button"
              className="button ghost"
              onClick={() => openMapNavigation(form.latitude, form.longitude, form.address, form.name)}
            >
              <Navigation size={14} /> Preview on Map
            </button>
          </div>
        </form>
      </div>
    </StaffShell>
  );
}

export function StaffAppointments() {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    apiRequest('/staff/appointments', { staff: true }).then(setRows).catch(() => setRows([]));
  }, []);
  return (
    <StaffShell title="Today's Appointments Schedule">
      <div className="panel">
        <div className="table-header-row">
          <h2>Appointments Schedule</h2>
          {rows.length > 0 && (
            <button className="button ghost small" onClick={() => downloadCSV('appointments-schedule', rows)}>
              <Download size={15} /> Export CSV
            </button>
          )}
        </div>
        <table>
          <thead><tr><th>Time</th><th>Customer</th><th>Phone</th><th>Service</th><th>Status</th></tr></thead>
          <tbody>{rows.map((row) => <tr key={row.appointment_id}><td>{row.appointment_time}</td><td>{row.customer_name}</td><td>{row.phone}</td><td>{row.service_name}</td><td><StatusBadge status={row.status} /></td></tr>)}</tbody>
        </table>
        {!rows.length && <p className="empty">No appointments loaded.</p>}
      </div>
    </StaffShell>
  );
}

export function AddWalkIn() {
  const [services, setServices] = useState([]);
  const [form, setForm] = useState({ service_id: '', name: '', phone: '' });
  const [message, setMessage] = useState('');
  useEffect(() => {
    apiRequest('/staff/services', { staff: true }).then((data) => {
      setServices(data);
      setForm((current) => ({ ...current, service_id: String(data[0]?.service_id || '') }));
    }).catch(() => setMessage('Login as staff to add real walk-ins.'));
  }, []);

  async function submit(event) {
    event.preventDefault();
    try {
      const data = await apiRequest('/staff/walk-ins', { method: 'POST', body: { ...form, service_id: Number(form.service_id) }, staff: true });
      setMessage(`Walk-in added with token #${data.token_number}.`);
      setForm({ ...form, name: '', phone: '' });
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <StaffShell title="Add Walk-in Customer">
      <form className="panel form-panel" onSubmit={submit}>
        <label>Service<select value={form.service_id} onChange={(e) => setForm({ ...form, service_id: e.target.value })}>{services.map((service) => <option key={service.service_id} value={service.service_id}>{service.service_name}</option>)}</select></label>
        <label>Customer Name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>
        <label>Phone<input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required /></label>
        <button className="button"><Plus size={18} /> Add to Queue</button>
        {message && <p className="soft-alert">{message}</p>}
      </form>
    </StaffShell>
  );
}

export function ServiceManagement() {
  const [services, setServices] = useState([]);
  const [form, setForm] = useState({ service_name: '', default_duration_minutes: 10 });
  const [message, setMessage] = useState('');

  async function load() {
    apiRequest('/staff/services', { staff: true }).then(setServices).catch(() => setServices([]));
  }
  useEffect(() => { load(); }, []);

  async function submit(event) {
    event.preventDefault();
    try {
      await apiRequest('/staff/services', { method: 'POST', body: form, staff: true });
      setForm({ service_name: '', default_duration_minutes: 10 });
      setMessage('Service added.');
      load();
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <StaffShell title="Service Management">
      <form className="toolbar-panel" onSubmit={submit}>
        <input placeholder="Service name" value={form.service_name} onChange={(e) => setForm({ ...form, service_name: e.target.value })} required />
        <input type="number" min="1" max="240" value={form.default_duration_minutes} onChange={(e) => setForm({ ...form, default_duration_minutes: Number(e.target.value) })} required />
        <button className="button">Add Service</button>
      </form>
      {message && <p className="soft-alert">{message}</p>}
      <div className="panel">
        <table>
          <thead><tr><th>Service</th><th>Default Duration</th><th>Historical Average</th><th>Completed</th></tr></thead>
          <tbody>{services.map((service) => <tr key={service.service_id}><td>{service.service_name}</td><td>{service.default_duration_minutes} min</td><td>{service.calculated_average_minutes || service.default_duration_minutes} min</td><td>{service.completed_count || 0}</td></tr>)}</tbody>
        </table>
      </div>
    </StaffShell>
  );
}

export function StaffStatistics() {
  const [data, setData] = useState({ statusCounts: [], serviceStats: [], busyServices: [] });
  useEffect(() => {
    apiRequest('/staff/statistics', { staff: true }).then(setData).catch(() => setData({ statusCounts: [], serviceStats: [], busyServices: [] }));
  }, []);

  function exportStats() {
    downloadCSV('queue-service-performance', data.serviceStats);
  }

  return (
    <StaffShell title="Queue Analytics &amp; Performance">
      <div className="toolbar-panel">
        <button className="button ghost small" onClick={exportStats}>
          <Download size={15} /> Export Analytics Report
        </button>
      </div>
      <section className="content-grid">
        <div className="panel"><h2>Status Summary</h2>{data.statusCounts.map((row) => <div className="list-row" key={row.status}><StatusBadge status={row.status} /><strong>{row.total}</strong></div>)}</div>
        <div className="panel"><h2>Service Performance</h2>{data.serviceStats.map((row) => <div className="list-row" key={row.service_name}><span>{row.service_name}</span><strong>{row.calculated_average_minutes} min avg</strong></div>)}</div>
      </section>
    </StaffShell>
  );
}

export function StaffHistory() {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    apiRequest('/staff/history', { staff: true }).then(setRows).catch(() => setRows([]));
  }, []);

  function exportHistory() {
    downloadCSV('queue-history', rows);
  }

  return (
    <StaffShell title="Historical Queue Logs">
      <div className="panel">
        <div className="table-header-row">
          <h2>Queue History Logs</h2>
          {rows.length > 0 && (
            <button className="button ghost small" onClick={exportHistory}>
              <Download size={15} /> Export CSV
            </button>
          )}
        </div>
        <table>
          <thead><tr><th>Date</th><th>Service</th><th>Status</th><th>Total</th></tr></thead>
          <tbody>{rows.map((row, index) => <tr key={index}><td>{row.queue_date}</td><td>{row.service_name}</td><td><StatusBadge status={row.status} /></td><td>{row.total}</td></tr>)}</tbody>
        </table>
        {!rows.length && <p className="empty">No historical data loaded.</p>}
      </div>
    </StaffShell>
  );
}
