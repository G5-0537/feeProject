import { useEffect, useState } from 'react';
import { BarChart3, CalendarDays, CheckCircle2, ClipboardList, History, LayoutDashboard, Plus, Scissors, Settings2, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DashboardShell from '../components/DashboardShell.jsx';
import StatCard from '../components/StatCard.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { apiRequest } from '../services/api.js';

const staffLinks = [
  { to: '/staff/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { to: '/staff/queue', label: "Today's Queue", icon: <ClipboardList size={18} /> },
  { to: '/staff/appointments', label: 'Appointments', icon: <CalendarDays size={18} /> },
  { to: '/staff/walk-in', label: 'Add Walk-in', icon: <UserPlus size={18} /> },
  { to: '/staff/services', label: 'Services', icon: <Settings2 size={18} /> },
  { to: '/staff/statistics', label: 'Statistics', icon: <BarChart3 size={18} /> },
  { to: '/staff/history', label: 'History', icon: <History size={18} /> }
];

function StaffShell({ children, title = 'Staff Dashboard', subtitle }) {
  const navigate = useNavigate();
  const { staff, logoutStaff } = useAuth();
  return (
    <DashboardShell
      title={title}
      subtitle={subtitle || `${staff?.business_name || 'Business'} queue control center`}
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
  const [data, setData] = useState({ summary: {}, queue: [] });
  const [notice, setNotice] = useState('');

  useEffect(() => {
    apiRequest('/staff/dashboard', { staff: true })
      .then(setData)
      .catch((error) => setNotice(`${error.message}. Login as staff with a running MySQL database to control live data.`));
  }, []);

  return (
    <StaffShell>
      {notice && <p className="soft-alert">{notice}</p>}
      <section className="stats-grid">
        <StatCard label="Waiting" value={data.summary.waiting_count || 0} caption="In active queue" icon={<ClipboardList />} />
        <StatCard label="Now Serving" value={data.summary.serving_count || 0} caption="Current counters" icon={<Scissors />} />
        <StatCard label="Completed" value={data.summary.completed_count || 0} caption="Today" icon={<CheckCircle2 />} />
      </section>
      <QueueTable rows={data.queue} />
    </StaffShell>
  );
}

export function TodaysQueue() {
  const [rows, setRows] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState('');
  const [message, setMessage] = useState('');

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
      setMessage('Login as staff and connect MySQL to manage the live queue.');
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function callNext() {
    try {
      const result = await apiRequest('/staff/queue/call-next', {
        method: 'POST',
        body: { service_id: Number(selectedService) },
        staff: true
      });
      setMessage(result.message);
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
    <StaffShell title="Today's Queue">
      <div className="toolbar-panel">
        <select value={selectedService} onChange={(e) => setSelectedService(e.target.value)}>
          {services.map((service) => <option key={service.service_id} value={service.service_id}>{service.service_name}</option>)}
        </select>
        <button className="button" onClick={callNext}>Call Next Customer</button>
        {message && <span className="toolbar-message">{message}</span>}
      </div>
      <QueueTable rows={rows} onUpdate={updateStatus} />
    </StaffShell>
  );
}

function QueueTable({ rows, onUpdate }) {
  return (
    <div className="panel">
      <h2>Current Live Queue</h2>
      <table>
        <thead><tr><th>Token</th><th>Customer</th><th>Service</th><th>Source</th><th>Status</th><th>Action</th></tr></thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.entry_id}>
              <td>#{row.token_number}</td>
              <td>{row.customer_name || 'Customer'}</td>
              <td>{row.service_name}</td>
              <td>{row.source}</td>
              <td><StatusBadge status={row.status} /></td>
              <td className="table-actions">
                {onUpdate && (
                  <>
                    <button className="icon-button" title="Complete" onClick={() => onUpdate(row.entry_id, 'Completed')}><CheckCircle2 size={17} /></button>
                    <button className="icon-button" title="Skip" onClick={() => onUpdate(row.entry_id, 'Skipped')}><Scissors size={17} /></button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function StaffAppointments() {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    apiRequest('/staff/appointments', { staff: true }).then(setRows).catch(() => setRows([]));
  }, []);
  return (
    <StaffShell title="Today's Appointments">
      <div className="panel">
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
  return (
    <StaffShell title="Queue Statistics">
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
  return (
    <StaffShell title="Historical Queue Information">
      <div className="panel">
        <table>
          <thead><tr><th>Date</th><th>Service</th><th>Status</th><th>Total</th></tr></thead>
          <tbody>{rows.map((row, index) => <tr key={index}><td>{row.queue_date}</td><td>{row.service_name}</td><td><StatusBadge status={row.status} /></td><td>{row.total}</td></tr>)}</tbody>
        </table>
        {!rows.length && <p className="empty">No historical data loaded.</p>}
      </div>
    </StaffShell>
  );
}
