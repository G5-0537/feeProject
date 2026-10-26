import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  CalendarClock,
  MapPin,
  Search,
  Ticket,
  Navigation,
  Building,
  AlertTriangle,
  Clock,
  Phone,
  CheckCircle2,
  Users,
  Compass,
  ArrowRight
} from 'lucide-react';
import PublicNav from '../components/PublicNav.jsx';
import SmartRecommendationCard from '../components/SmartRecommendationCard.jsx';
import MapplsNavigationModal from '../components/MapplsNavigationModal.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { CustomerShell } from './CustomerPages.jsx';
import { useDebounce } from '../hooks/useDebounce.js';
import { useFormValidation } from '../hooks/useFormValidation.js';
import { apiRequest } from '../services/api.js';
import { today, shortTime, formatTime12h, isBusinessOpen } from '../utils/format.js';
import { getUserCoordinates, formatDistance, calculateDistance } from '../utils/geo.js';

const businessTypes = ['', 'Clinic', 'Hospital', 'Restaurant', 'Government Office', 'Bank', 'Salon', 'Service Center', 'Other'];

function BusinessPageShell({ title, subtitle, children }) {
  const { customer } = useAuth();
  if (customer) {
    return (
      <CustomerShell title={title} subtitle={subtitle}>
        <div className="page-wrap">{children}</div>
      </CustomerShell>
    );
  }
  return <><PublicNav /><main className="page-wrap">{children}</main></>;
}

export function BusinessSearch() {
  const { customer } = useAuth();
  const { showToast } = useToast();
  const [query, setQuery] = useState('');
  const [type, setType] = useState('');
  const [businesses, setBusinesses] = useState([]);
  const [status, setStatus] = useState({ loading: true, error: '' });
  const [reloadKey, setReloadKey] = useState(0);
  const [userCoords, setUserCoords] = useState(null);
  const [navTarget, setNavTarget] = useState(null);

  // useDebounce — prevents API call on every keystroke (Syllabus Topics 67-72)
  const debouncedQuery = useDebounce(query, 400);
  const businessPath = customer ? '/customer/businesses' : '/businesses';

  useEffect(() => {
    getUserCoordinates().then(setUserCoords);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setStatus({ loading: true, error: '' });
    const params = new URLSearchParams({ search: debouncedQuery });
    if (type) params.set('type', type);
    apiRequest(`/businesses?${params.toString()}`, { signal: controller.signal })
      .then((data) => { setBusinesses(data); setStatus({ loading: false, error: '' }); })
      .catch((error) => {
        if (error.name === 'AbortError') return;
        setBusinesses([]);
        setStatus({ loading: false, error: error.message });
        showToast(error.message + '. Check network connection.', 'error');
      });
    return () => controller.abort();
  }, [debouncedQuery, type, reloadKey]);


  return (
      <BusinessPageShell title="Find a queue" subtitle="Search businesses, compare live waits, and join a queue.">
        <div className="page-title">
          <span className="eyebrow">Find a queue</span>
          <h1>Search Businesses &amp; Branches</h1>
          <p>Choose a business branch, view live wait times, and join virtual queues remotely.</p>
        </div>

        <div className="filter-row">
          <label className="search-box">
            <Search size={20} />
            <input
              placeholder="Search by name, branch, area, category..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <select value={type} onChange={(e) => setType(e.target.value)} aria-label="Filter by business type">
            {businessTypes.map((item) => (
              <option key={item || 'all'} value={item}>
                {item || 'All Types'}
              </option>
            ))}
          </select>
        </div>

        {status.error && <p className="soft-alert" role="alert">{status.error} <button className="button small" type="button" onClick={() => setReloadKey((key) => key + 1)}>Retry</button></p>}
        {status.loading && <p className="empty">Loading businesses...</p>}

        <div className="business-grid">
          {businesses.map((business) => {
            const dist = userCoords && business.latitude && business.longitude
              ? calculateDistance(userCoords.lat, userCoords.lng, business.latitude, business.longitude)
              : null;
            const isOpen = isBusinessOpen(business.opening_time, business.closing_time);
            const estWait = (business.waiting_now || 0) * (business.average_duration || 12);

            return (
              <article className="business-card detailed-card" key={business.business_id}>
                {/* Card Top Row: Type Pill, Status Badge & Distance */}
                <div className="card-top-row">
                  <span className="type-pill">{business.type}</span>
                  <div className="card-status-cluster">
                    <span className={`status-badge-inline ${isOpen ? 'open' : 'closed'}`}>
                      {isOpen ? 'OPEN' : 'CLOSED'}
                    </span>
                    {dist !== null && (
                      <span className="distance-pill">
                        <Navigation size={11} /> {formatDistance(dist)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Business Name & Description */}
                <div className="card-body-content">
                  <h2 className="card-business-name">
                    <Link to={`${businessPath}/${business.business_id}`}>{business.name}</Link>
                  </h2>
                  <p className="card-business-desc">
                    {business.description || `${business.type} facility providing specialized consultations and swift queue service.`}
                  </p>
                </div>

                {/* Location & Timings Details */}
                <div className="card-info-stack">
                  <p className="card-info-item">
                    <MapPin size={15} /> <span>{business.address}</span>
                  </p>
                  <p className="card-info-item">
                    <Clock size={15} /> <span>{formatTime12h(business.opening_time)} – {formatTime12h(business.closing_time)}</span>
                  </p>
                  {business.contact && (
                    <p className="card-info-item">
                      <Phone size={15} /> <span>{business.contact}</span>
                    </p>
                  )}
                </div>

                {/* Real-Time Queue Metrics */}
                <div className="card-queue-banner">
                  <div className="queue-banner-stat">
                    <Users size={14} />
                    <span><strong>{business.waiting_now || 0}</strong> waiting</span>
                  </div>
                  <div className="queue-banner-stat">
                    <Clock size={14} />
                    <span>Est. <strong>~{estWait}m</strong></span>
                  </div>
                  <div className="queue-banner-stat">
                    <Ticket size={14} />
                    <span>Serving <strong>#{business.current_token || 0}</strong></span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="card-actions-row">
                  <Link
                    to={`${businessPath}/${business.business_id}`}
                    className="button small primary"
                  >
                    View Details
                  </Link>
                  <button
                    type="button"
                    className="button small ghost mappls-btn"
                    onClick={() => setNavTarget(business)}
                    title="Get Directions via Mappls"
                  >
                    <Compass size={14} /> Get Directions
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        {!status.loading && !businesses.length && !status.error && (
          <p className="empty">No businesses match your filters.</p>
        )}

        {/* In-App Mappls Navigation Modal */}
        {navTarget && (
          <MapplsNavigationModal
            business={navTarget}
            userCoords={userCoords}
            onClose={() => setNavTarget(null)}
          />
        )}
      </BusinessPageShell>
  );
}

export function BusinessDetails() {
  const { customer } = useAuth();
  const { businessId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [business, setBusiness] = useState(null);
  const [services, setServices] = useState([]);
  const [siblingBranches, setSiblingBranches] = useState([]);
  const [recommendation, setRecommendation] = useState(null);
  const [selectedService, setSelectedService] = useState('');
  const [appointmentDate, setAppointmentDate] = useState(today());
  const [appointmentTime, setAppointmentTime] = useState('10:00');
  const [status, setStatus] = useState({ loading: true, error: '' });
  const [reloadKey, setReloadKey] = useState(0);
  const [userCoords, setUserCoords] = useState(null);
  const [navTarget, setNavTarget] = useState(null);
  const { errors: bookingErrors, validate: validateBooking, clearField: clearBookingField } = useFormValidation({
    service_id: { required: true, label: 'Service' },
    appointment_date: { required: true, label: 'Appointment date', custom: (value) => value < today() ? 'Choose today or a future date.' : null },
    appointment_time: { required: true, label: 'Appointment time' },
  });
  const businessPath = customer ? '/customer/businesses' : '/businesses';

  async function loadData(signal) {
    setStatus({ loading: true, error: '' });
    try {
      const coords = await getUserCoordinates();
      setUserCoords(coords);
      const params = coords ? `?lat=${coords.lat}&lng=${coords.lng}` : '';
      const data = await apiRequest(`/businesses/${businessId}${params}`, { signal });
      setBusiness(data.business);
      setServices(data.services || []);
      setSiblingBranches(data.siblingBranches || []);
      setRecommendation(data.recommendation || null);
      setSelectedService(String(data.services?.[0]?.service_id || ''));
      setStatus({ loading: false, error: '' });
    } catch (error) {
      if (error.name === 'AbortError') return;
      setStatus({ loading: false, error: `${error.message}. Check backend connection.` });
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    loadData(controller.signal);
    return () => controller.abort();
  }, [businessId, reloadKey]);

  async function bookAppointment(serviceId = selectedService, targetBizId = businessId) {
    if (!validateBooking({ service_id: String(serviceId || ''), appointment_date: appointmentDate, appointment_time: appointmentTime })) return;
    try {
      const data = await apiRequest('/customer/appointments', {
        method: 'POST',
        body: {
          business_id: Number(targetBizId),
          service_id: Number(serviceId),
          appointment_date: appointmentDate,
          appointment_time: appointmentTime
        }
      });
      navigate(`/customer/queue/${data.entry_id}`);
    } catch (error) {
      showToast(error.message + '. Please login as a customer before booking.', 'error');
    }
  }

  async function joinQueue(serviceId = selectedService, targetBizId = businessId) {
    try {
      const data = await apiRequest('/customer/queues/join', {
        method: 'POST',
        body: { business_id: Number(targetBizId), service_id: Number(serviceId) }
      });
      navigate(`/customer/queue/${data.entry_id}`);
    } catch (error) {
      showToast(error.message + '. Please login as a customer before joining.', 'error');
    }
  }

  function handleSelectAlternative(alternativeId) {
    navigate(`${businessPath}/${alternativeId}`);
  }

  function handleJoinAlternative(alternativeId) {
    joinQueue(selectedService, alternativeId);
  }

  if (status.loading) {
    return (
      <BusinessPageShell title="Business Details" subtitle="Loading the selected branch.">
        <p className="empty">Loading business details...</p>
      </BusinessPageShell>
    );
  }

  if (status.error || !business) {
    return (
      <BusinessPageShell title="Business Details" subtitle="Branch information could not be loaded.">
        <p className="soft-alert" role="alert">{status.error || 'Business not found'} {status.error && <button className="button small" type="button" onClick={() => setReloadKey((key) => key + 1)}>Retry</button>}</p>
      </BusinessPageShell>
    );
  }

  const isOpen = isBusinessOpen(business.opening_time, business.closing_time);
  const distanceKm = userCoords && business.latitude && business.longitude
    ? calculateDistance(userCoords.lat, userCoords.lng, business.latitude, business.longitude)
    : null;
  const estWait = (business.waiting_now || 0) * (business.average_duration || 12);

  return (
      <BusinessPageShell title={business.name} subtitle="View branch details, services, and current wait times.">
        {/* Smart Queue Recommendation Card if current wait is long */}
        {recommendation && (
          <SmartRecommendationCard
            currentBranch={business}
            recommendation={recommendation}
            onSelectAlternative={handleSelectAlternative}
            onJoinAlternative={handleJoinAlternative}
            onNavigateAlternative={(alt) => setNavTarget(alt)}
          />
        )}

        <div className="business-details-grid">
          {/* Main Business Details Section */}
          <section className="details-panel glass-elevation">
            {/* Header badges */}
            <div className="details-header-row">
              <span className="type-pill">{business.type}</span>
              <div className="card-status-cluster">
                <span className={`status-badge-inline ${isOpen ? 'open' : 'closed'}`}>
                  {isOpen ? 'OPEN NOW' : 'CLOSED'}
                </span>
                {distanceKm !== null && (
                  <span className="distance-pill">
                    <Navigation size={11} /> {formatDistance(distanceKm)} away
                  </span>
                )}
                {business.is_paused && (
                  <span className="status-badge skipped">
                    <AlertTriangle size={13} /> Queue Paused
                  </span>
                )}
              </div>
            </div>

            <h1 className="details-main-title">{business.name}</h1>
            
            <p className="details-description">
              {business.description || `${business.name} is a premier ${business.type.toLowerCase()} center committed to offering seamless visits with virtual queue management.`}
            </p>

            {/* Address & Navigation Action */}
            <div className="details-info-box">
              <div className="info-box-row address-row">
                <MapPin size={18} className="text-brand" />
                <div className="info-box-text">
                  <strong>Location</strong>
                  <span>{business.address}</span>
                </div>
                <button
                  type="button"
                  className="button small ghost mappls-btn"
                  onClick={() => setNavTarget(business)}
                >
                  <Compass size={14} /> Get Directions
                </button>
              </div>

              <div className="info-box-row">
                <Clock size={18} className="text-brand" />
                <div className="info-box-text">
                  <strong>Operating Hours</strong>
                  <span>{formatTime12h(business.opening_time)} – {formatTime12h(business.closing_time)}</span>
                </div>
              </div>

              {business.contact && (
                <div className="info-box-row">
                  <Phone size={18} className="text-brand" />
                  <div className="info-box-text">
                    <strong>Direct Contact</strong>
                    <span>{business.contact}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Live Queue Overview Metrics */}
            <div className="details-queue-summary">
              <div className="queue-summary-card">
                <span className="summary-card-label">Current Serving</span>
                <strong className="summary-card-val">#{business.current_token || 0}</strong>
              </div>
              <div className="queue-summary-card">
                <span className="summary-card-label">In Line Ahead</span>
                <strong className={`summary-card-val ${business.waiting_now >= 10 ? 'crowded' : ''}`}>
                  {business.waiting_now || 0}
                </strong>
              </div>
              <div className="queue-summary-card">
                <span className="summary-card-label">Estimated Wait</span>
                <strong className="summary-card-val">~{estWait} min</strong>
              </div>
              <div className="queue-summary-card">
                <span className="summary-card-label">Avg Service</span>
                <strong className="summary-card-val">{business.average_duration || 15} min</strong>
              </div>
            </div>

            {/* Sibling Branches Selector */}
            {siblingBranches.length > 0 && (
              <div className="sibling-branches-box">
                <div className="sibling-title">
                  <Building size={15} /> Other {business.brand_name || 'Business'} Locations
                </div>
                <div className="sibling-list">
                  {siblingBranches.map((sib) => (
                    <Link to={`${businessPath}/${sib.business_id}`} className="sibling-chip" key={sib.business_id}>
                      <strong>{sib.branch_name || sib.name}</strong>
                      <small>{sib.waiting_now || 0} waiting &bull; {sib.address}</small>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Available Services */}
            <div className="details-services-section">
              <h2>Available Services</h2>
              <div className="service-list">
                {services.map((service) => (
                  <article
                    className={`service-option ${selectedService === String(service.service_id) ? 'selected' : ''}`}
                    key={service.service_id}
                  >
                    <label className="service-select-label">
                      <input
                        type="radio"
                        name="service"
                        value={service.service_id}
                        checked={selectedService === String(service.service_id)}
                        onChange={(e) => { setSelectedService(e.target.value); clearBookingField('service_id'); }}
                      />
                      <div className="service-info-col">
                        <strong>{service.service_name}</strong>
                        <small>Avg duration: ~{service.calculated_average_minutes || service.default_duration_minutes || 15} min &bull; {service.waiting_now || 0} currently waiting</small>
                      </div>
                    </label>
                    <div className="service-actions">
                      <button
                        type="button"
                        className="button ghost small"
                        onClick={() => bookAppointment(service.service_id)}
                      >
                        Book Slot
                      </button>
                      <button
                        type="button"
                        className="button secondary small"
                        onClick={() => joinQueue(service.service_id)}
                      >
                        Join Live
                      </button>
                    </div>
                  </article>
                ))}
                {bookingErrors.service_id && <span className="form-field-error" role="alert">{bookingErrors.service_id}</span>}
              </div>
            </div>
          </section>

          {/* Booking / Action Panel */}
          <aside className="booking-panel glass-elevation">
            <h2><CalendarClock size={20} /> Appointment Booking</h2>
            <label>
              Preferred Date
              <input
                type="date"
                value={appointmentDate}
                min={today()}
                onChange={(e) => { setAppointmentDate(e.target.value); clearBookingField('appointment_date'); }}
              />
              {bookingErrors.appointment_date && <span className="form-field-error" role="alert">{bookingErrors.appointment_date}</span>}
            </label>
            <label>
              Preferred Time
              <input
                type="time"
                value={appointmentTime}
                onChange={(e) => { setAppointmentTime(e.target.value); clearBookingField('appointment_time'); }}
              />
              {bookingErrors.appointment_time && <span className="form-field-error" role="alert">{bookingErrors.appointment_time}</span>}
            </label>
            <button
              type="button"
              className="button full primary book-btn"
              onClick={() => bookAppointment()}
            >
              Confirm Appointment
            </button>
            <div className="divider">or</div>
            <button
              type="button"
              className="button full secondary join-live-btn"
              onClick={() => joinQueue()}
            >
              <Ticket size={18} /> Join Live Virtual Queue
            </button>

            <div className="mini-ticket">
              <CheckCircle2 size={16} className="text-brand" />
              <div>
                <strong>Live Token Queueing</strong>
                <p>Tokens and estimated wait times update dynamically as customer numbers progress.</p>
              </div>
            </div>
          </aside>
        </div>

        {/* In-App Mappls Navigation Modal */}
        {navTarget && (
          <MapplsNavigationModal
            business={navTarget}
            userCoords={userCoords}
            onClose={() => setNavTarget(null)}
          />
        )}
      </BusinessPageShell>
  );
}
