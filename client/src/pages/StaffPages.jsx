import { useEffect, useState } from 'react';
import { BarChart3, Building, CalendarDays, CheckCircle2, ClipboardList, Download, History, LayoutDashboard, MonitorPlay, Pause, Play, Plus, Scissors, Settings2, UserPlus, MapPin, Navigation, Phone, User, Search, RotateCcw } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import DashboardShell from '../components/DashboardShell.jsx';
import StatCard from '../components/StatCard.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { apiRequest } from '../services/api.js';
import { announceToken, playChimeTone } from '../utils/audio.js';
import { openMapNavigation } from '../utils/geo.js';
import QueueAnalyticsVisualizer from '../components/QueueAnalyticsVisualizer.jsx';
import { FormField, FormSelect, LoadingButton, ValidationMessage } from '../components/forms/index.js';
import { validatePhone, validateRequired } from '../utils/validation.js';
import AsyncHandler from '../components/AsyncHandler.jsx';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [status, setStatus] = useState({ loading: true, error: '' });
  const toast = useToast();
  const businessId = staff?.business_id || 1;

  async function load() {
    setStatus((prev) => ({ ...prev, loading: true, error: '' }));
    try {
      const [queueRows, serviceRows] = await Promise.all([
        apiRequest('/staff/queue', { staff: true }),
        apiRequest('/staff/services', { staff: true })
      ]);
      setRows(queueRows);
      setServices(serviceRows);
      if (!selectedService && serviceRows[0]?.service_id) {
        setSelectedService(String(serviceRows[0].service_id));
      }
      setStatus({ loading: false, error: '' });
    } catch (err) {
      setRows([]);
      setServices([]);
      setStatus({ loading: false, error: err.message || 'Login as staff to manage live queue.' });
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
      toast.success(result.message);

      playChimeTone();
      if (result.entry?.token_number) {
        const srv = services.find((s) => s.service_id === Number(selectedService));
        announceToken(result.entry.token_number, 1, srv?.service_name);
      }

      load();
    } catch (error) {
      setMessage(error.message);
      toast.warning(error.message);
    }
  }

  async function updateStatus(entryId, targetStatus) {
    try {
      const result = await apiRequest(`/staff/queue/${entryId}/status`, {
        method: 'PATCH',
        body: { status: targetStatus },
        staff: true
      });
      setMessage(result.message);
      toast.success(result.message);
      if (targetStatus === 'Now Serving') {
        playChimeTone();
      }
      load();
    } catch (error) {
      setMessage(error.message);
      toast.error(error.message);
    }
  }

  // Filter rows based on search and status
  const filteredRows = rows.filter((row) => {
    const term = searchTerm.trim().toLowerCase();
    const matchesSearch = !term ||
      String(row.token_number).includes(term) ||
      row.customer_name?.toLowerCase().includes(term) ||
      row.service_name?.toLowerCase().includes(term) ||
      row.source?.toLowerCase().includes(term);

    const matchesStatus = statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && ['Waiting', 'Approaching', 'Now Serving'].includes(row.status)) ||
      row.status.toUpperCase() === statusFilter.toUpperCase();

    return matchesSearch && matchesStatus;
  });

  return (
    <StaffShell title="Live Queue Operations">
      <div className="toolbar-panel">
        <select value={selectedService} onChange={(e) => setSelectedService(e.target.value)}>
          {services.map((service) => <option key={service.service_id} value={service.service_id}>{service.service_name}</option>)}
        </select>
        <button className="button primary" onClick={callNext}>
          <Play size={15} /> Call Next Customer
        </button>
        <Link to={`/display/${businessId}`} target="_blank" className="button ghost small" title="Open TV Screen for Waiting Area">
          <MonitorPlay size={16} /> TV Screen
        </Link>

        {/* Real-time search & filter bar */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={15} style={{ position: 'absolute', left: '10px', color: 'var(--muted)', pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Search token or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '32px', width: '180px', height: '36px', fontSize: '0.86rem' }}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: '140px', height: '36px', fontSize: '0.86rem' }}
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Queue</option>
            <option value="WAITING">Waiting</option>
            <option value="NOW SERVING">Now Serving</option>
            <option value="COMPLETED">Completed</option>
            <option value="SKIPPED">Skipped</option>
          </select>
        </div>
      </div>

      {message && <p className="soft-alert" style={{ marginBottom: '16px' }}>{message}</p>}

      <AsyncHandler
        loading={status.loading && !rows.length}
        error={status.error}
        onRetry={load}
        isEmpty={!status.loading && !filteredRows.length}
        emptyMessage={searchTerm || statusFilter !== 'ALL' ? 'No queue tickets match your search or filter.' : 'No active queue tickets currently in line.'}
      >
        <QueueTable rows={filteredRows} onUpdate={updateStatus} onReload={load} />
      </AsyncHandler>
    </StaffShell>
  );
}

function QueueTable({ rows, onUpdate, onReload }) {
  const toast = useToast();

  async function handleAction(row, targetStatus) {
    // Guardrail against invalid state transitions
    if (targetStatus === 'Completed' && row.status !== 'Now Serving') {
      toast.warning(`Token #${row.token_number} must be called to the counter before marking as Completed.`);
      return;
    }

    if (onUpdate) {
      onUpdate(row.entry_id, targetStatus);
    } else {
      try {
        await apiRequest(`/staff/queue/${row.entry_id}/status`, {
          method: 'PATCH',
          body: { status: targetStatus },
          staff: true
        });
        toast.success(`Token #${row.token_number} updated to ${targetStatus}.`);
        if (targetStatus === 'Now Serving') {
          playChimeTone();
        }
        if (onReload) onReload();
      } catch (err) {
        toast.error(err.message || 'Failed to update token status.');
      }
    }
  }

  return (
    <div className="panel">
      <div className="table-header-row">
        <h2>Active Queue Tickets ({rows?.length || 0})</h2>
      </div>
      <table>
        <thead>
          <tr>
            <th>Token</th>
            <th>Customer</th>
            <th>Service</th>
            <th>Source</th>
            <th>Status</th>
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows?.map((row) => {
            const isServing = row.status === 'Now Serving';
            const isWaiting = ['Waiting', 'Approaching'].includes(row.status);
            const isSkipped = row.status === 'Skipped';
            const isCompleted = row.status === 'Completed';

            return (
              <tr key={row.entry_id} className={isServing ? 'row-serving' : ''}>
                <td><strong>#{row.token_number}</strong></td>
                <td>{row.customer_name || 'Customer'}</td>
                <td>{row.service_name}</td>
                <td>{row.source || 'Online'}</td>
                <td><StatusBadge status={row.status} /></td>
                <td className="table-actions" style={{ justifyContent: 'flex-end' }}>
                  {isServing && (
                    <>
                      <button
                        className="button small primary"
                        title="Complete service visit"
                        onClick={() => handleAction(row, 'Completed')}
                      >
                        <CheckCircle2 size={14} /> Complete
                      </button>
                      <button
                        className="button small ghost"
                        title="Skip customer"
                        onClick={() => handleAction(row, 'Skipped')}
                      >
                        <Scissors size={14} /> Skip
                      </button>
                    </>
                  )}

                  {isWaiting && (
                    <>
                      <button
                        className="button small secondary"
                        title="Call customer to counter"
                        onClick={() => handleAction(row, 'Now Serving')}
                      >
                        <Play size={14} /> Call Now
                      </button>
                      <button
                        className="button small ghost"
                        title="Skip token"
                        onClick={() => handleAction(row, 'Skipped')}
                      >
                        <Scissors size={14} /> Skip
                      </button>
                    </>
                  )}

                  {isSkipped && (
                    <button
                      className="button small ghost"
                      title="Recall customer back into queue"
                      onClick={() => handleAction(row, 'Waiting')}
                    >
                      <RotateCcw size={14} /> Re-queue
                    </button>
                  )}

                  {isCompleted && (
                    <span className="sub-text" style={{ color: 'var(--success)' }}>
                      <CheckCircle2 size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                      Done
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
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
  const [status, setStatus] = useState({ loading: true, error: '' });

  async function load() {
    setStatus({ loading: true, error: '' });
    try {
      const data = await apiRequest('/staff/appointments', { staff: true });
      setRows(data);
      setStatus({ loading: false, error: '' });
    } catch (err) {
      setRows([]);
      setStatus({ loading: false, error: err.message || 'Failed to load appointments.' });
    }
  }

  useEffect(() => {
    load();
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
        <AsyncHandler
          loading={status.loading && !rows.length}
          error={status.error}
          onRetry={load}
          isEmpty={!status.loading && !rows.length}
          emptyMessage="No appointments scheduled for today."
        >
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Customer</th>
                <th>Phone</th>
                <th>Service</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.appointment_id}>
                  <td>{row.appointment_time}</td>
                  <td>{row.customer_name}</td>
                  <td>{row.phone}</td>
                  <td>{row.service_name}</td>
                  <td><StatusBadge status={row.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </AsyncHandler>
      </div>
    </StaffShell>
  );
}

export function AddWalkIn() {
  const [services, setServices] = useState([]);
  const [form, setForm] = useState({ service_id: '', name: '', phone: '' });
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const toast = useToast();

  useEffect(() => {
    apiRequest('/staff/services', { staff: true }).then((data) => {
      setServices(data);
      setForm((current) => ({ ...current, service_id: String(data[0]?.service_id || '') }));
    }).catch(() => setMessage('Login as staff to add real walk-ins.'));
  }, []);

  const nameError = validateRequired(form.name, 'Customer Name');
  const phoneError = validatePhone(form.phone);
  const isValid = !nameError && !phoneError;

  async function submit(event) {
    event.preventDefault();
    setTouched({ name: true, phone: true });

    if (!isValid) {
      toast.warning('Please correct form validation errors.');
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      const data = await apiRequest('/staff/walk-ins', { 
        method: 'POST', 
        body: { ...form, service_id: Number(form.service_id) }, 
        staff: true 
      });
      const successMsg = `Walk-in customer added with Token #${data.token_number}!`;
      setMessage(successMsg);
      toast.success(successMsg);
      playChimeTone();
      setForm({ service_id: String(services[0]?.service_id || ''), name: '', phone: '' });
      setTouched({});
    } catch (error) {
      setMessage(error.message);
      toast.error(error.message || 'Failed to add walk-in ticket.');
    } finally {
      setLoading(false);
    }
  }

  const serviceOptions = services.map((s) => ({
    value: s.service_id,
    label: `${s.service_name} (~${s.default_duration_minutes || 15} mins)`
  }));

  return (
    <StaffShell title="Add Walk-in Customer">
      <form className="panel form-panel" onSubmit={submit} noValidate>
        <h2>Register Walk-in Visitor</h2>
        <p className="sub-text">Generate a physical or digital queue token for patients and clients arriving without smartphones.</p>
        
        {message && <ValidationMessage message={message} type={message.includes('Token') ? 'success' : 'error'} />}

        <FormSelect
          id="walkin-service"
          name="service_id"
          label="Service Category"
          value={form.service_id}
          onChange={(e) => setForm({ ...form, service_id: e.target.value })}
          options={serviceOptions}
          required
        />

        <FormField
          id="walkin-name"
          name="name"
          label="Customer Full Name"
          placeholder="e.g. Rahul Sharma"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          onBlur={() => setTouched((p) => ({ ...p, name: true }))}
          error={nameError}
          touched={touched.name}
          required
          icon={User}
        />

        <FormField
          id="walkin-phone"
          name="phone"
          type="tel"
          label="Mobile Phone Number"
          placeholder="e.g. 9876543210"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          onBlur={() => setTouched((p) => ({ ...p, phone: true }))}
          error={phoneError}
          touched={touched.phone}
          required
          icon={Phone}
          helperText="Standard 10-digit mobile number for SMS/ticket lookup."
        />

        <LoadingButton
          type="submit"
          loading={loading}
          loadingText="Generating Token..."
          icon={Plus}
        >
          Add to Live Queue
        </LoadingButton>
      </form>
    </StaffShell>
  );
}

export function ServiceManagement() {
  const [services, setServices] = useState([]);
  const [form, setForm] = useState({ service_name: '', default_duration_minutes: 15 });
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ loading: true, error: '' });
  const toast = useToast();

  async function load() {
    setStatus({ loading: true, error: '' });
    try {
      const data = await apiRequest('/staff/services', { staff: true });
      setServices(data);
      setStatus({ loading: false, error: '' });
    } catch (err) {
      setServices([]);
      setStatus({ loading: false, error: err.message || 'Failed to load services.' });
    }
  }

  useEffect(() => { load(); }, []);

  const nameError = validateRequired(form.service_name, 'Service Name');

  async function submit(event) {
    event.preventDefault();
    setTouched({ service_name: true });

    if (nameError) {
      toast.warning('Please enter a valid service name.');
      return;
    }

    setLoading(true);
    try {
      await apiRequest('/staff/services', {
        method: 'POST',
        body: {
          ...form,
          default_duration_minutes: Number(form.default_duration_minutes) || 15
        },
        staff: true
      });
      toast.success(`Service "${form.service_name}" created successfully.`);
      setForm({ service_name: '', default_duration_minutes: 15 });
      setTouched({});
      load();
    } catch (error) {
      toast.error(error.message || 'Failed to create service.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <StaffShell title="Service Management">
      <form className="panel form-panel" onSubmit={submit} noValidate style={{ marginBottom: '24px' }}>
        <h2>Configure Branch Services</h2>
        <p className="sub-text">Add custom consultation, diagnostic or counter service types with estimated duration benchmarks.</p>

        <div className="grid-2">
          <FormField
            id="service-name-input"
            name="service_name"
            label="Service Title"
            placeholder="e.g. Dental Cleaning"
            value={form.service_name}
            onChange={(e) => setForm({ ...form, service_name: e.target.value })}
            onBlur={() => setTouched((p) => ({ ...p, service_name: true }))}
            error={nameError}
            touched={touched.service_name}
            required
            icon={Scissors}
          />

          <FormField
            id="service-duration-input"
            name="default_duration_minutes"
            type="number"
            label="Estimated Minutes"
            placeholder="15"
            value={form.default_duration_minutes}
            onChange={(e) => setForm({ ...form, default_duration_minutes: e.target.value })}
            required
            helperText="Average consultation time per client."
          />
        </div>

        <div style={{ marginTop: '12px' }}>
          <LoadingButton
            type="submit"
            loading={loading}
            loadingText="Saving Service..."
            icon={Plus}
          >
            Add New Service
          </LoadingButton>
        </div>
      </form>

      <div className="panel">
        <div className="table-header-row">
          <h2>Active Services ({services.length})</h2>
        </div>
        <AsyncHandler
          loading={status.loading && !services.length}
          error={status.error}
          onRetry={load}
          isEmpty={!status.loading && !services.length}
          emptyMessage="No services registered for this business yet."
        >
          <table>
            <thead>
              <tr>
                <th>Service Name</th>
                <th>Default Duration</th>
                <th>Historical Average</th>
                <th>Total Served</th>
              </tr>
            </thead>
            <tbody>
              {services.map((service) => (
                <tr key={service.service_id}>
                  <td><strong>{service.service_name}</strong></td>
                  <td>{service.default_duration_minutes} min</td>
                  <td>{service.calculated_average_minutes || service.default_duration_minutes} min</td>
                  <td>{service.completed_count || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </AsyncHandler>
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
    <StaffShell title="Queue Analytics &amp; Peak Performance Intelligence">
      <div className="toolbar-panel">
        <button className="button ghost small" onClick={exportStats}>
          <Download size={15} /> Export Analytics Report (CSV)
        </button>
      </div>

      {/* Visual Analytics, Peak Rush Hour Bars & Ratio Gauges */}
      <QueueAnalyticsVisualizer
        statusCounts={data.statusCounts}
        serviceStats={data.serviceStats}
        busyServices={data.busyServices}
      />

      <section className="content-grid" style={{ marginTop: '20px' }}>
        <div className="panel">
          <h2>Counter Status Ledger</h2>
          {data.statusCounts.map((row) => (
            <div className="list-row" key={row.status}>
              <StatusBadge status={row.status} />
              <strong>{row.total} customers</strong>
            </div>
          ))}
          {!data.statusCounts.length && <p className="empty">No active tickets today yet.</p>}
        </div>

        <div className="panel">
          <h2>Service Speed &amp; Durations</h2>
          {data.serviceStats.map((row) => (
            <div className="list-row" key={row.service_name}>
              <span>{row.service_name}</span>
              <strong>{row.calculated_average_minutes || 10} min avg / ticket</strong>
            </div>
          ))}
          {!data.serviceStats.length && <p className="empty">No services recorded.</p>}
        </div>
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
