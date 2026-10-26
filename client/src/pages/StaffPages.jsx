import { useEffect, useRef, useState } from 'react';
import {
  BarChart3, Building, CalendarDays, CheckCircle2, ClipboardList,
  Download, History, LayoutDashboard, MonitorPlay, Pause, Play,
  Plus, Scissors, Settings2, UserPlus, Navigation, ArrowUpDown
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import DashboardShell from '../components/DashboardShell.jsx';
import StatCard from '../components/StatCard.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import Tabs from '../components/Tabs.jsx';
import Modal from '../components/Modal.jsx';
import FormField from '../components/FormField.jsx';
import Pagination from '../components/Pagination.jsx';
import { SkeletonRow } from '../components/SkeletonRow.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useStaffStore } from '../store/staffStore.js';
import { apiRequest } from '../services/api.js';
import { announceToken, playChimeTone } from '../utils/audio.js';
import { openMapNavigation } from '../utils/geo.js';
import { useFormValidation } from '../hooks/useFormValidation.js';
import { useTableControls } from '../hooks/useTableControls.js';
import { usePagination } from '../hooks/usePagination.js';

const staffLinks = [
  { to: '/staff/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { to: '/staff/queue', label: "Today's Queue", icon: <ClipboardList size={18} /> },
  { to: '/staff/appointments', label: 'Appointments', icon: <CalendarDays size={18} /> },
  { to: '/staff/walk-in', label: 'Add Walk-in', icon: <UserPlus size={18} /> },
  { to: '/staff/services', label: 'Services', icon: <Settings2 size={18} /> },
  { to: '/staff/branch', label: 'Branch Settings', icon: <Building size={18} /> },
  { to: '/staff/statistics', label: 'Statistics', icon: <BarChart3 size={18} /> },
  { to: '/staff/history', label: 'History', icon: <History size={18} /> },
];

function downloadCSV(filename, data) {
  if (!data || !data.length) return;
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map((row) => headers.map((h) => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(','))
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
      onLogout={() => { logoutStaff(); navigate('/'); }}
    >
      {children}
    </DashboardShell>
  );
}

// ─── Staff Dashboard ──────────────────────────────────────────────────────────
// Uses Zustand store (Syllabus 49-54) — no more 4× useState
export function StaffDashboard() {
  const { staff } = useAuth();
  const { showToast } = useToast();
  const { queue, summary, branch, isPaused, isUpdatingPause, isLoading, fetchDashboard, togglePause } = useStaffStore();
  const businessId = staff?.business_id || 1;
  // Tabs on dashboard (Syllabus 61-66)
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 5000);
    return () => clearInterval(interval);
  }, []);

  async function handleTogglePause() {
    try {
      const msg = await togglePause();
      showToast(msg, isPaused ? 'success' : 'warning');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  const nextWaiting = queue?.find((q) => ['Waiting', 'Approaching'].includes(q.status));
  const currentServing = queue?.find((q) => q.status === 'Now Serving');

  const dashTabs = [
    { key: 'overview', label: 'Overview', icon: <LayoutDashboard size={16} /> },
    { key: 'queue', label: 'Live Queue', icon: <ClipboardList size={16} />, badge: summary.waiting_count || 0 },
  ];

  return (
    <StaffShell>
      <div className="toolbar-panel staff-quick-bar">
        <div className="staff-status-indicators">
          <span className={`queue-status-tag ${isPaused ? 'paused' : 'active'}`}>
            <span className="dot" /> {isPaused ? 'Queue Paused' : 'Queue Active'}
          </span>
          <span className="branch-id-tag">
            <Building size={14} /> {branch?.name || staff?.business_name}
          </span>
        </div>
        <div className="staff-actions-cluster">
          <button
            className={`button small ${isPaused ? 'primary' : 'ghost'}`}
            onClick={handleTogglePause}
            disabled={isUpdatingPause}
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

      {/* Tabs on dashboard (Syllabus 61-66) */}
      <Tabs tabs={dashTabs} activeTab={activeTab} onChange={setActiveTab} />

      <div className="tab-content" id={`tabpanel-${activeTab}`} role="tabpanel">
        {activeTab === 'overview' && (
          <>
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
                ) : <div className="spotlight-empty">Counter is currently ready for next token.</div>}
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
                ) : <div className="spotlight-empty">No waiting customers in line.</div>}
              </div>
            </div>
            <section className="stats-grid">
              <StatCard label="Waiting in Line" value={summary.waiting_count || 0} caption="Active queue" icon={<ClipboardList />} />
              <StatCard label="Now Serving" value={summary.serving_count || 0} caption="Current counter" icon={<Scissors />} />
              <StatCard label="Completed Today" value={summary.completed_count || 0} caption="Finished services" icon={<CheckCircle2 />} />
            </section>
          </>
        )}
        {activeTab === 'queue' && (
          <QueueTable rows={queue} onReload={fetchDashboard} />
        )}
      </div>
    </StaffShell>
  );
}

// ─── Today's Queue ────────────────────────────────────────────────────────────
// Uses Zustand store + search/filter/sort (Syllabus 49-54, 61-66)
export function TodaysQueue() {
  const { staff } = useAuth();
  const { showToast } = useToast();
  const { queue, services, isPaused, fetchDashboard, fetchServices, callNext, updateStatus } = useStaffStore();
  const [selectedService, setSelectedService] = useState('');
  const businessId = staff?.business_id || 1;

  useEffect(() => {
    fetchDashboard();
    fetchServices();
    const interval = setInterval(fetchDashboard, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (services.length && !selectedService) {
      setSelectedService(String(services[0]?.service_id || ''));
    }
  }, [services]);

  async function handleCallNext() {
    try {
      const result = await callNext(selectedService);
      showToast(result.message || `Token #${result.entry?.token_number} called!`, 'success');
      playChimeTone();
      if (result.entry?.token_number) {
        const srv = services.find((s) => s.service_id === Number(selectedService));
        announceToken(result.entry.token_number, 1, srv?.service_name);
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function handleUpdateStatus(entryId, status) {
    try {
      const result = await updateStatus(entryId, status);
      showToast(result.message || `Entry marked as ${status}.`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  // Search + Filter on the queue table (Syllabus 61-66)
  const { processed, search, setSearch, filter, setFilter } = useTableControls(queue || [], {
    searchFields: ['customer_name', 'token_number'],
    filterField: 'status',
  });

  const statuses = [...new Set((queue || []).map((r) => r.status))];

  return (
    <StaffShell title="Live Queue Operations">
      <div className="toolbar-panel">
        <select value={selectedService} onChange={(e) => setSelectedService(e.target.value)}>
          {services.map((service) => (
            <option key={service.service_id} value={service.service_id}>{service.service_name}</option>
          ))}
        </select>
        <button className="button" onClick={handleCallNext}>Call Next Customer</button>
        <Link to={`/display/${businessId}`} target="_blank" className="button ghost small" title="Open TV Screen">
          <MonitorPlay size={16} /> TV Screen
        </Link>
      </div>

      {/* Search + Filter (Syllabus 61-66) */}
      <div className="toolbar-panel">
        <input
          className="table-search-input"
          placeholder="Search by name or token..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="table-filter-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <QueueTable rows={processed} onUpdate={handleUpdateStatus} onReload={fetchDashboard} />
    </StaffShell>
  );
}

function QueueTable({ rows, onUpdate, onReload }) {
  // Sort (Syllabus 61-66)
  const { processed, sortKey, sortDir, toggleSort } = useTableControls(rows || [], {});

  function SortHeader({ label, field }) {
    return (
      <th onClick={() => toggleSort(field)} className="sortable-th" style={{ cursor: 'pointer' }}>
        {label} {sortKey === field ? (sortDir === 'asc' ? '↑' : '↓') : <ArrowUpDown size={13} style={{ opacity: 0.4 }} />}
      </th>
    );
  }

  async function handleAction(entryId, status) {
    if (onUpdate) {
      onUpdate(entryId, status);
    } else {
      try {
        await apiRequest(`/staff/queue/${entryId}/status`, { method: 'PATCH', body: { status }, staff: true });
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
            <SortHeader label="Token" field="token_number" />
            <SortHeader label="Customer" field="customer_name" />
            <th>Service</th>
            <th>Source</th>
            <SortHeader label="Status" field="status" />
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {processed?.map((row) => (
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
      {!processed?.length && <p className="empty">No queue entries currently active.</p>}
    </div>
  );
}

// ─── Staff Branch ─────────────────────────────────────────────────────────────
// Uses FormField + useFormValidation (Syllabus 55-60)
export function StaffBranch() {
  const { showToast } = useToast();
  const [branch, setBranch] = useState(null);
  const [form, setForm] = useState({
    name: '', branch_name: '', address: '', contact: '',
    latitude: 30.7333, longitude: 76.7794,
    opening_time: '08:30:00', closing_time: '18:00:00'
  });
  const [loading, setLoading] = useState(true);

  // Validation (Syllabus 55-60)
  const { errors, validate, clearField } = useFormValidation({
    branch_name: { required: true, label: 'Branch Name', minLength: 2 },
    name: { required: true, label: 'Display Name', minLength: 2 },
    address: { required: true, label: 'Street Address', minLength: 5 },
    contact: { required: true, label: 'Contact', pattern: /^\+?[\d\s\-().]{7,}$/, message: 'Enter a valid phone number.' },
    latitude: { required: true, label: 'Latitude', min: -90, max: 90 },
    longitude: { required: true, label: 'Longitude', min: -180, max: 180 },
  });

  async function load() {
    setLoading(true);
    try {
      const data = await apiRequest('/staff/branch', { staff: true });
      setBranch(data);
      setForm({
        name: data.name || '', branch_name: data.branch_name || '',
        address: data.address || '', contact: data.contact || '',
        latitude: data.latitude || 30.7333, longitude: data.longitude || 76.7794,
        opening_time: data.opening_time || '08:30:00', closing_time: data.closing_time || '18:00:00'
      });
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function submit(e) {
    e.preventDefault();
    if (!validate(form)) return; // validation hook prevents submit on error
    try {
      const result = await apiRequest('/staff/branch', { method: 'PATCH', body: form, staff: true });
      showToast(result.message || 'Branch settings saved successfully!', 'success');
      load();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  function field(key) {
    return { value: form[key], onChange: (e) => { setForm((current) => ({ ...current, [key]: e.target.value })); clearField(key); }, error: errors[key] };
  }

  return (
    <StaffShell title="Branch Profile & Geo Settings">
      <div className="panel form-panel">
        <h2>Branch Information</h2>
        <p className="sub-text">This location data powers the Smart Nearby Queue Recommendation system.</p>
        {loading && <p className="empty">Loading branch data...</p>}
        {!loading && (
          <form onSubmit={submit} noValidate>
            {/* FormField reusable component (Syllabus 55-60) */}
            <FormField id="branch_name" label="Branch Name" required placeholder="e.g. Main Branch" {...field('branch_name')} />
            <FormField id="name" label="Display Full Name" required placeholder="e.g. Apex Health Clinic Main Branch" {...field('name')} />
            <FormField id="address" label="Street Address" required placeholder="e.g. 104 Medical Plaza" {...field('address')} />
            <FormField id="contact" label="Contact Phone" required placeholder="+1 (555) 000-0000" type="tel" {...field('contact')} />
            <div className="grid-2">
              <FormField id="latitude" label="Latitude" required type="number" step="0.0001"
                helperText="Range: -90 to 90"
                value={form.latitude}
                onChange={(e) => setForm({ ...form, latitude: Number(e.target.value) })}
                error={errors.latitude}
              />
              <FormField id="longitude" label="Longitude" required type="number" step="0.0001"
                helperText="Range: -180 to 180"
                value={form.longitude}
                onChange={(e) => setForm({ ...form, longitude: Number(e.target.value) })}
                error={errors.longitude}
              />
            </div>
            <div className="grid-2">
              <FormField id="opening_time" label="Opening Time" required type="time"
                value={form.opening_time.slice(0, 5)}
                onChange={(e) => setForm({ ...form, opening_time: `${e.target.value}:00` })}
                error={errors.opening_time}
              />
              <FormField id="closing_time" label="Closing Time" required type="time"
                value={form.closing_time.slice(0, 5)}
                onChange={(e) => setForm({ ...form, closing_time: `${e.target.value}:00` })}
                error={errors.closing_time}
              />
            </div>
            <div className="form-actions-row">
              <button className="button primary">Save Branch Settings</button>
              <button
                type="button" className="button ghost"
                onClick={() => openMapNavigation(form.latitude, form.longitude, form.address, form.name)}
              >
                <Navigation size={14} /> Preview on Map
              </button>
            </div>
          </form>
        )}
      </div>
    </StaffShell>
  );
}

// ─── Staff Appointments ───────────────────────────────────────────────────────
export function StaffAppointments() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest('/staff/appointments', { staff: true })
      .then((data) => { setRows(data); setLoading(false); })
      .catch(() => { setRows([]); setLoading(false); });
  }, []);

  // Search + Pagination (Syllabus 61-66, 67-72)
  const { processed, search, setSearch } = useTableControls(rows, { searchFields: ['customer_name', 'service_name'] });
  const pg = usePagination(processed, 10);

  return (
    <StaffShell title="Today's Appointments Schedule">
      <div className="toolbar-panel">
        <input className="table-search-input" placeholder="Search customer or service..." value={search} onChange={(e) => setSearch(e.target.value)} />
        {rows.length > 0 && (
          <button className="button ghost small" onClick={() => downloadCSV('appointments-schedule', rows)}>
            <Download size={15} /> Export CSV
          </button>
        )}
      </div>
      <div className="panel">
        <h2>Appointments Schedule</h2>
        <table>
          <thead><tr><th>Time</th><th>Customer</th><th>Phone</th><th>Service</th><th>Status</th></tr></thead>
          <tbody>
            {loading && Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={5} />)}
            {!loading && pg.paginated.map((row) => (
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
        {!loading && !pg.paginated.length && <p className="empty">No appointments loaded.</p>}
        <Pagination {...pg} />
      </div>
    </StaffShell>
  );
}

// ─── Add Walk-in ──────────────────────────────────────────────────────────────
// Uses FormField + useFormValidation (Syllabus 55-60)
export function AddWalkIn() {
  const { showToast } = useToast();
  const [services, setServices] = useState([]);
  const [form, setForm] = useState({ service_id: '', name: '', phone: '' });

  // Validation rules (Syllabus 55-60)
  const { errors, validate, clearField } = useFormValidation({
    service_id: { required: true, label: 'Service' },
    name: { required: true, label: 'Customer Name', minLength: 2, maxLength: 80 },
    phone: {
      required: true, label: 'Phone',
      pattern: /^\+?[\d\s\-().]{7,}$/,
      message: 'Enter a valid phone number (e.g. +1 555-0199).'
    },
  });

  useEffect(() => {
    apiRequest('/staff/services', { staff: true })
      .then((data) => { setServices(data); setForm((f) => ({ ...f, service_id: String(data[0]?.service_id || '') })); })
      .catch(() => showToast('Login as staff to add real walk-ins.', 'warning'));
  }, []);

  async function submit(event) {
    event.preventDefault();
    if (!validate(form)) return;
    try {
      const data = await apiRequest('/staff/walk-ins', {
        method: 'POST',
        body: { ...form, service_id: Number(form.service_id) },
        staff: true
      });
      showToast(`Walk-in added! Token #${data.token_number} assigned.`, 'success');
      setForm({ ...form, name: '', phone: '' });
    } catch (error) {
      showToast(error.message, 'error');
    }
  }

  return (
    <StaffShell title="Add Walk-in Customer">
      <form className="panel form-panel" onSubmit={submit} noValidate>
        <h2>Walk-in Registration</h2>
        {/* FormField reusable component (Syllabus 55-60) */}
        <FormField
          id="walkin-service" label="Service" required as="select"
          value={form.service_id}
          onChange={(e) => { setForm({ ...form, service_id: e.target.value }); clearField('service_id'); }}
          error={errors.service_id}
        >
          {services.map((service) => (
            <option key={service.service_id} value={service.service_id}>{service.service_name}</option>
          ))}
        </FormField>
        <FormField
          id="walkin-name" label="Customer Name" required
          placeholder="Full name"
          value={form.name}
          onChange={(e) => { setForm({ ...form, name: e.target.value }); clearField('name'); }}
          error={errors.name}
          helperText="Minimum 2 characters"
        />
        <FormField
          id="walkin-phone" label="Phone Number" required type="tel"
          placeholder="+1 (555) 000-0000"
          value={form.phone}
          onChange={(e) => { setForm({ ...form, phone: e.target.value }); clearField('phone'); }}
          error={errors.phone}
          helperText="Include country code if needed"
        />
        <button className="button"><Plus size={18} /> Add to Queue</button>
      </form>
    </StaffShell>
  );
}

// ─── Service Management ───────────────────────────────────────────────────────
// Uses FormField + useFormValidation (Syllabus 55-60)
export function ServiceManagement() {
  const { showToast } = useToast();
  const [services, setServices] = useState([]);
  const [form, setForm] = useState({ service_name: '', default_duration_minutes: 10 });

  // Validation (Syllabus 55-60)
  const { errors, validate, clearField } = useFormValidation({
    service_name: { required: true, label: 'Service Name', minLength: 2 },
    default_duration_minutes: { required: true, label: 'Duration', min: 1, max: 240 },
  });

  async function load() {
    apiRequest('/staff/services', { staff: true }).then(setServices).catch(() => setServices([]));
  }
  useEffect(() => { load(); }, []);

  async function submit(event) {
    event.preventDefault();
    if (!validate(form)) return;
    try {
      await apiRequest('/staff/services', { method: 'POST', body: form, staff: true });
      setForm({ service_name: '', default_duration_minutes: 10 });
      showToast('Service added successfully!', 'success');
      load();
    } catch (error) {
      showToast(error.message, 'error');
    }
  }

  return (
    <StaffShell title="Service Management">
      <div className="panel form-panel">
        <h2>Add New Service</h2>
        <form onSubmit={submit} noValidate className="service-add-form">
          {/* FormField reusable component (Syllabus 55-60) */}
          <FormField
            id="svc-name" label="Service Name" required
            placeholder="e.g. General Physician Consultation"
            value={form.service_name}
            onChange={(e) => { setForm({ ...form, service_name: e.target.value }); clearField('service_name'); }}
            error={errors.service_name}
          />
          <FormField
            id="svc-duration" label="Default Duration (minutes)" required
            type="number" min="1" max="240"
            value={form.default_duration_minutes}
            onChange={(e) => { setForm({ ...form, default_duration_minutes: Number(e.target.value) }); clearField('default_duration_minutes'); }}
            error={errors.default_duration_minutes}
            helperText="Recommended: 5–60 min"
          />
          <button className="button">Add Service</button>
        </form>
      </div>

      <div className="panel">
        <h2>Active Services</h2>
        <table>
          <thead><tr><th>Service</th><th>Default Duration</th><th>Historical Average</th><th>Completed</th></tr></thead>
          <tbody>
            {services.map((service) => (
              <tr key={service.service_id}>
                <td>{service.service_name}</td>
                <td>{service.default_duration_minutes} min</td>
                <td>{service.calculated_average_minutes || service.default_duration_minutes} min</td>
                <td>{service.completed_count || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!services.length && <p className="empty">No services found.</p>}
      </div>
    </StaffShell>
  );
}

// ─── Staff Statistics ─────────────────────────────────────────────────────────
// Uses Recharts for data visualization (Bonus beyond syllabus)
const CHART_COLORS = ['var(--brand)', 'var(--brand-2)', 'var(--accent)', '#8884d8', '#82ca9d'];

export function StaffStatistics() {
  const [data, setData] = useState({ statusCounts: [], serviceStats: [], busyServices: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest('/staff/statistics', { staff: true })
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => { setData({ statusCounts: [], serviceStats: [], busyServices: [] }); setLoading(false); });
  }, []);

  // Recharts PieChart data (Syllabus 67-72 bonus — working with data visualization)
  const pieData = data.statusCounts.map((row) => ({ name: row.status, value: Number(row.total) }));

  // Recharts BarChart data
  const barData = data.serviceStats.map((row) => ({
    name: row.service_name?.length > 15 ? row.service_name.slice(0, 15) + '…' : row.service_name,
    'Avg (min)': Number(row.calculated_average_minutes) || 0,
    Completed: Number(row.completed_count) || 0,
  }));

  return (
    <StaffShell title="Queue Analytics & Performance">
      <div className="toolbar-panel">
        <button className="button ghost small" onClick={() => downloadCSV('queue-service-performance', data.serviceStats)}>
          <Download size={15} /> Export Analytics Report
        </button>
      </div>

      {loading && (
        <section className="content-grid">
          <div className="panel"><div className="skeleton-card"><span className="skeleton-block" style={{ width: '90%', height: 200 }} /></div></div>
          <div className="panel"><div className="skeleton-card"><span className="skeleton-block" style={{ width: '90%', height: 200 }} /></div></div>
        </section>
      )}

      {!loading && (
        <section className="content-grid">
          {/* Recharts PieChart — Status Breakdown */}
          <div className="panel chart-panel">
            <h2>Status Breakdown</h2>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, value }) => `${name}: ${value}`}>
                    {pieData.map((_, index) => (
                      <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="empty">No status data available.</p>}
          </div>

          {/* Recharts BarChart — Service Performance */}
          <div className="panel chart-panel">
            <h2>Service Performance</h2>
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Avg (min)" fill="var(--brand)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Completed" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="empty">No service data available.</p>}
          </div>
        </section>
      )}

      {/* Raw data summary */}
      {!loading && (
        <section className="content-grid" style={{ marginTop: 16 }}>
          <div className="panel">
            <h2>Status Summary</h2>
            {data.statusCounts.map((row) => (
              <div className="list-row" key={row.status}>
                <StatusBadge status={row.status} />
                <strong>{row.total}</strong>
              </div>
            ))}
          </div>
          <div className="panel">
            <h2>Service Performance Details</h2>
            {data.serviceStats.map((row) => (
              <div className="list-row" key={row.service_name}>
                <span>{row.service_name}</span>
                <strong>{row.calculated_average_minutes} min avg</strong>
              </div>
            ))}
          </div>
        </section>
      )}
    </StaffShell>
  );
}

// ─── Staff History ────────────────────────────────────────────────────────────
// Search + Filter + Sort + Pagination (Syllabus 61-66, 67-72)
export function StaffHistory() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    apiRequest('/staff/history', { staff: true, signal: controller.signal })
      .then((data) => { setRows(data); setLoading(false); })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setError(err.message || 'Could not load queue history.');
        setLoading(false);
      });
    return () => controller.abort();
  }, [reloadKey]);

  // Search + Filter + Sort (Syllabus 61-66)
  const { processed, search, setSearch, filter, setFilter, sortKey, sortDir, toggleSort } = useTableControls(rows, {
    searchFields: ['service_name', 'queue_date'],
    filterField: 'status',
  });

  // Pagination (Syllabus 67-72)
  const pg = usePagination(processed, 10);
  const statuses = [...new Set(rows.map((r) => r.status))];

  function SortHeader({ label, field }) {
    return (
      <th onClick={() => toggleSort(field)} className="sortable-th" style={{ cursor: 'pointer' }}>
        {label} {sortKey === field ? (sortDir === 'asc' ? '↑' : '↓') : <ArrowUpDown size={13} style={{ opacity: 0.4 }} />}
      </th>
    );
  }

  return (
    <StaffShell title="Historical Queue Logs">
      <div className="toolbar-panel">
        <input className="table-search-input" placeholder="Search service or date..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="table-filter-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button className="button ghost small" type="button" onClick={() => setReloadKey((key) => key + 1)} disabled={loading}>Retry / Refresh</button>
        {rows.length > 0 && (
          <button className="button ghost small" onClick={() => downloadCSV('queue-history', rows)}>
            <Download size={15} /> Export CSV
          </button>
        )}
      </div>

      {error && <div className="soft-alert" role="alert">{error} <button className="button small" type="button" onClick={() => setReloadKey((key) => key + 1)}>Retry</button></div>}

      <div className="panel">
        <div className="table-header-row">
          <h2>Queue History Logs</h2>
          <span className="table-count">{processed.length} records</span>
        </div>
        <table>
          <thead>
            <tr>
              <SortHeader label="Date" field="queue_date" />
              <SortHeader label="Service" field="service_name" />
              <SortHeader label="Status" field="status" />
              <SortHeader label="Total" field="total" />
            </tr>
          </thead>
          <tbody>
            {loading && Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={4} />)}
            {!loading && pg.paginated.map((row, index) => (
              <tr key={index}>
                <td>{row.queue_date}</td>
                <td>{row.service_name}</td>
                <td><StatusBadge status={row.status} /></td>
                <td>{row.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && !pg.paginated.length && !error && <p className="empty">No historical data loaded.</p>}
        <Pagination {...pg} />
      </div>
    </StaffShell>
  );
}
