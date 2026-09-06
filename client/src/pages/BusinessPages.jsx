import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CalendarClock, MapPin, Search, Ticket } from 'lucide-react';
import PublicNav from '../components/PublicNav.jsx';
import { apiRequest } from '../services/api.js';
import { today, shortTime } from '../utils/format.js';

const businessTypes = ['', 'Clinic', 'Hospital', 'Restaurant', 'Government Office', 'Bank', 'Salon', 'Service Center', 'Other'];

export function BusinessSearch() {
  const [query, setQuery] = useState('');
  const [type, setType] = useState('');
  const [businesses, setBusinesses] = useState([]);
  const [status, setStatus] = useState({ loading: true, error: '' });

  useEffect(() => {
    const timeout = setTimeout(async () => {
      setStatus({ loading: true, error: '' });
      try {
        const params = new URLSearchParams({ search: query });
        if (type) params.set('type', type);
        const data = await apiRequest(`/businesses?${params.toString()}`);
        setBusinesses(data);
        setStatus({ loading: false, error: '' });
      } catch (error) {
        setBusinesses([]);
        setStatus({ loading: false, error: `${error.message}. Start MySQL and import the seed data to load businesses.` });
      }
    }, 250);
    return () => clearTimeout(timeout);
  }, [query, type]);

  return (
    <>
      <PublicNav />
      <main className="page-wrap">
        <div className="page-title">
          <span className="eyebrow">Find a queue</span>
          <h1>Search Businesses</h1>
          <p>Choose a business, select a service, then book an appointment or join the live queue.</p>
        </div>
        <div className="filter-row">
          <label className="search-box">
            <Search size={20} />
            <input placeholder="Search by name, area, category..." value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
          <select value={type} onChange={(e) => setType(e.target.value)} aria-label="Filter by business type">
            {businessTypes.map((item) => <option key={item || 'all'} value={item}>{item || 'All Types'}</option>)}
          </select>
        </div>
        {status.error && <p className="soft-alert">{status.error}</p>}
        {status.loading && <p className="empty">Loading businesses...</p>}
        <div className="business-grid">
          {businesses.map((business) => (
            <Link className="business-card" to={`/businesses/${business.business_id}`} key={business.business_id}>
              <span className="type-pill">{business.type}</span>
              <h2>{business.name}</h2>
              <p><MapPin size={16} /> {business.address}</p>
              <div className="card-meta">
                <span>{business.service_count || 0} services</span>
                <span>{business.waiting_now || 0} waiting</span>
                <span>{shortTime(business.opening_time)}-{shortTime(business.closing_time)}</span>
              </div>
            </Link>
          ))}
        </div>
        {!status.loading && !businesses.length && !status.error && <p className="empty">No businesses match your filters.</p>}
      </main>
    </>
  );
}

export function BusinessDetails() {
  const { businessId } = useParams();
  const navigate = useNavigate();
  const [business, setBusiness] = useState(null);
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState('');
  const [appointmentDate, setAppointmentDate] = useState(today());
  const [appointmentTime, setAppointmentTime] = useState('10:00');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState({ loading: true, error: '' });

  useEffect(() => {
    async function load() {
      setStatus({ loading: true, error: '' });
      try {
        const data = await apiRequest(`/businesses/${businessId}`);
        setBusiness(data.business);
        setServices(data.services);
        setSelectedService(String(data.services[0]?.service_id || ''));
        setStatus({ loading: false, error: '' });
      } catch (error) {
        setStatus({ loading: false, error: `${error.message}. Check backend and MySQL setup.` });
      }
    }
    load();
  }, [businessId]);

  async function bookAppointment(serviceId = selectedService) {
    try {
      const data = await apiRequest('/customer/appointments', {
        method: 'POST',
        body: {
          business_id: Number(businessId),
          service_id: Number(serviceId),
          appointment_date: appointmentDate,
          appointment_time: appointmentTime
        }
      });
      navigate(`/customer/queue/${data.entry_id}`);
    } catch (error) {
      setMessage(`${error.message}. Please login as a customer before booking.`);
    }
  }

  async function joinQueue(serviceId = selectedService) {
    try {
      const data = await apiRequest('/customer/queues/join', {
        method: 'POST',
        body: { business_id: Number(businessId), service_id: Number(serviceId) }
      });
      navigate(`/customer/queue/${data.entry_id}`);
    } catch (error) {
      setMessage(`${error.message}. Please login as a customer before joining.`);
    }
  }

  if (status.loading) return <><PublicNav /><main className="page-wrap"><p className="empty">Loading business details...</p></main></>;
  if (status.error) return <><PublicNav /><main className="page-wrap"><p className="soft-alert">{status.error}</p></main></>;

  return (
    <>
      <PublicNav />
      <main className="page-wrap two-column">
        <section className="details-panel">
          <span className="type-pill">{business.type}</span>
          <h1>{business.name}</h1>
          <p><MapPin size={16} /> {business.address}</p>
          <p>Open {shortTime(business.opening_time)} to {shortTime(business.closing_time)} • {business.contact}</p>
          <div className="business-summary">
            <span>Now serving #{business.current_token || 0}</span>
            <span>{business.waiting_now || 0} people waiting</span>
          </div>
          <h2>Available Services</h2>
          <div className="service-list">
            {services.map((service) => (
              <article className={`service-option ${selectedService === String(service.service_id) ? 'selected' : ''}`} key={service.service_id}>
                <label>
                  <input type="radio" name="service" value={service.service_id} checked={selectedService === String(service.service_id)} onChange={(e) => setSelectedService(e.target.value)} />
                  <span>
                    <strong>{service.service_name}</strong>
                    <small>Appointment slots use your selected date and time.</small>
                  </span>
                </label>
                <div className="service-meta">
                  <small>
                    Avg {service.calculated_average_minutes || service.default_duration_minutes} min
                    {' '}• Current #{service.current_token || 0}
                    {' '}• {service.waiting_now || 0} waiting
                  </small>
                </div>
                <div className="service-actions">
                  <button className="button ghost small" onClick={() => bookAppointment(service.service_id)}>Book Appointment</button>
                  <button className="button secondary small" onClick={() => joinQueue(service.service_id)}>Join Live Queue</button>
                </div>
              </article>
            ))}
          </div>
        </section>
        <aside className="booking-panel">
          <h2><CalendarClock size={20} /> Book Appointment</h2>
          <label>Date<input type="date" value={appointmentDate} min={today()} onChange={(e) => setAppointmentDate(e.target.value)} /></label>
          <label>Time<input type="time" value={appointmentTime} onChange={(e) => setAppointmentTime(e.target.value)} /></label>
          <button className="button full" onClick={() => bookAppointment()}>Book Appointment</button>
          <div className="divider">or</div>
          <button className="button secondary full" onClick={() => joinQueue()}><Ticket size={18} /> Join Live Queue</button>
          {message && <p className="soft-alert">{message}</p>}
          <div className="mini-ticket">
            <strong>Current queue info</strong>
            <span>Token and wait details are loaded from MySQL after you join or book.</span>
          </div>
        </aside>
      </main>
    </>
  );
}
