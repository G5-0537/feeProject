/**
 * In-Browser Realistic Mock Database & REST API Dispatcher
 * Activates automatically when the backend API is unreachable (e.g. on GitHub Pages),
 * allowing full customer & staff interactive testing without a running MySQL server.
 */

const STORAGE_KEY = 'queless_mock_db_v2';

const INITIAL_SEED_DATA = {
  businesses: [
    {
      business_id: 1,
      name: 'Apex Health Clinic',
      type: 'Clinic',
      address: '104 Medical Plaza, Central Avenue',
      contact: '+1 (555) 234-8900',
      opening_time: '08:30:00',
      closing_time: '18:00:00',
      service_count: 3,
      waiting_now: 3,
      current_token: 39,
    },
    {
      business_id: 2,
      name: 'Metropolitan Trust Bank',
      type: 'Bank',
      address: '500 Financial District, Suite 12',
      contact: '+1 (555) 890-1234',
      opening_time: '09:00:00',
      closing_time: '16:30:00',
      service_count: 2,
      waiting_now: 4,
      current_token: 52,
    },
    {
      business_id: 3,
      name: 'Luxe Salon & Wellness',
      type: 'Salon',
      address: '77 Fashion Boulevard',
      contact: '+1 (555) 432-6789',
      opening_time: '10:00:00',
      closing_time: '20:00:00',
      service_count: 2,
      waiting_now: 2,
      current_token: 18,
    },
    {
      business_id: 4,
      name: 'St. Jude General Hospital',
      type: 'Hospital',
      address: '1200 Emergency Way',
      contact: '+1 (555) 911-0000',
      opening_time: '00:00:00',
      closing_time: '23:59:59',
      service_count: 3,
      waiting_now: 7,
      current_token: 104,
    },
  ],
  services: [
    { service_id: 1, business_id: 1, service_name: 'General Physician Consultation', default_duration_minutes: 15, calculated_average_minutes: 14, current_token: 39, waiting_now: 3, completed_count: 28 },
    { service_id: 2, business_id: 1, service_name: 'Pediatric Care & Vaccines', default_duration_minutes: 20, calculated_average_minutes: 18, current_token: 12, waiting_now: 1, completed_count: 15 },
    { service_id: 3, business_id: 1, service_name: 'Lab Diagnostics & Blood Test', default_duration_minutes: 10, calculated_average_minutes: 8, current_token: 45, waiting_now: 1, completed_count: 42 },
    { service_id: 4, business_id: 2, service_name: 'Cashier & Teller Services', default_duration_minutes: 8, calculated_average_minutes: 7, current_token: 52, waiting_now: 3, completed_count: 85 },
    { service_id: 5, business_id: 2, service_name: 'Loan & Advisory Desk', default_duration_minutes: 30, calculated_average_minutes: 25, current_token: 8, waiting_now: 1, completed_count: 12 },
    { service_id: 6, business_id: 3, service_name: 'Hair Styling & Spa', default_duration_minutes: 45, calculated_average_minutes: 40, current_token: 18, waiting_now: 2, completed_count: 19 },
    { service_id: 7, business_id: 4, service_name: 'OPD Consultation', default_duration_minutes: 15, calculated_average_minutes: 12, current_token: 104, waiting_now: 7, completed_count: 64 },
  ],
  queueEntries: [
    {
      entry_id: 101,
      business_id: 1,
      service_id: 1,
      customer_id: 1,
      customer_name: 'John Doe',
      customer_phone: '+1 555-0199',
      token_number: 42,
      status: 'Waiting',
      source: 'Online',
      booking_type: 'queue',
      appointment_time: null,
      joined_at: new Date(Date.now() - 25 * 60000).toISOString(),
      business_name: 'Apex Health Clinic',
      service_name: 'General Physician Consultation',
    },
    {
      entry_id: 102,
      business_id: 1,
      service_id: 1,
      customer_id: 2,
      customer_name: 'Sarah Connor',
      customer_phone: '+1 555-0144',
      token_number: 39,
      status: 'Now Serving',
      source: 'Online',
      booking_type: 'queue',
      appointment_time: null,
      joined_at: new Date(Date.now() - 40 * 60000).toISOString(),
      business_name: 'Apex Health Clinic',
      service_name: 'General Physician Consultation',
    },
    {
      entry_id: 103,
      business_id: 1,
      service_id: 1,
      customer_id: 3,
      customer_name: 'Elena Gilbert',
      customer_phone: '+1 555-0188',
      token_number: 40,
      status: 'Approaching',
      source: 'Walk-in',
      booking_type: 'walk-in',
      appointment_time: null,
      joined_at: new Date(Date.now() - 30 * 60000).toISOString(),
      business_name: 'Apex Health Clinic',
      service_name: 'General Physician Consultation',
    },
    {
      entry_id: 104,
      business_id: 1,
      service_id: 1,
      customer_id: 4,
      customer_name: 'Robert Vance',
      customer_phone: '+1 555-0177',
      token_number: 41,
      status: 'Waiting',
      source: 'Walk-in',
      booking_type: 'walk-in',
      appointment_time: null,
      joined_at: new Date(Date.now() - 20 * 60000).toISOString(),
      business_name: 'Apex Health Clinic',
      service_name: 'General Physician Consultation',
    }
  ],
  appointments: [
    {
      appointment_id: 1,
      business_id: 1,
      service_id: 1,
      user_id: 1,
      customer_name: 'John Doe',
      phone: '+1 555-0199',
      business_name: 'Apex Health Clinic',
      service_name: 'General Physician Consultation',
      appointment_date: new Date().toISOString().slice(0, 10),
      appointment_time: '14:30',
      status: 'Confirmed'
    }
  ],
  notifications: [
    {
      notification_id: 1,
      user_id: 1,
      message: 'Your token #42 at Apex Health Clinic is 2 people away. Please be ready nearby.',
      type: 'Approaching',
      created_at: new Date(Date.now() - 5 * 60000).toISOString()
    },
    {
      notification_id: 2,
      user_id: 1,
      message: 'Appointment confirmed for General Physician Consultation at 14:30.',
      type: 'Confirmed',
      created_at: new Date(Date.now() - 120 * 60000).toISOString()
    }
  ],
  history: [
    {
      entry_id: 99,
      queue_date: new Date().toISOString().slice(0, 10),
      business_id: 1,
      service_id: 1,
      customer_name: 'Michael Scott',
      customer_phone: '+1 555-0111',
      token_number: 38,
      status: 'Completed',
      source: 'Online',
      booking_type: 'queue',
      completed_at: new Date(Date.now() - 15 * 60000).toISOString(),
      service_name: 'General Physician Consultation',
      business_name: 'Apex Health Clinic',
    },
    {
      entry_id: 98,
      queue_date: new Date().toISOString().slice(0, 10),
      business_id: 1,
      service_id: 1,
      customer_name: 'Dwight Schrute',
      customer_phone: '+1 555-0222',
      token_number: 37,
      status: 'Completed',
      source: 'Appointment',
      booking_type: 'appointment',
      completed_at: new Date(Date.now() - 35 * 60000).toISOString(),
      service_name: 'General Physician Consultation',
      business_name: 'Apex Health Clinic',
    },
    {
      entry_id: 97,
      queue_date: new Date().toISOString().slice(0, 10),
      business_id: 1,
      service_id: 1,
      customer_name: 'Jim Halpert',
      customer_phone: '+1 555-0333',
      token_number: 36,
      status: 'Skipped',
      source: 'Online',
      booking_type: 'queue',
      completed_at: new Date(Date.now() - 50 * 60000).toISOString(),
      service_name: 'General Physician Consultation',
      business_name: 'Apex Health Clinic',
    }
  ],
  customer: {
    user_id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1 555-0199'
  },
  staff: {
    staff_id: 1,
    business_id: 1,
    business_name: 'Apex Health Clinic',
    business_type: 'Clinic',
    name: 'Clinic Desk Staff',
    email: 'clinic_staff',
    role: 'Staff'
  }
};

let isMockMode = false;

export function isMockModeActive() {
  return isMockMode;
}

export function setMockModeActive(active) {
  isMockMode = active;
}

export function getMockDB() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      resetMockDB();
      return JSON.parse(JSON.stringify(INITIAL_SEED_DATA));
    }
    return JSON.parse(raw);
  } catch (e) {
    return JSON.parse(JSON.stringify(INITIAL_SEED_DATA));
  }
}

export function saveMockDB(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to persist mock DB', e);
  }
}

export function resetMockDB() {
  saveMockDB(INITIAL_SEED_DATA);
}

function calculateWaitMetrics(entry, db) {
  const service = db.services.find((s) => s.service_id === entry.service_id) || db.services[0];
  const activeForService = db.queueEntries.filter(
    (e) => e.service_id === entry.service_id && ['Waiting', 'Approaching', 'Now Serving', 'waiting', 'approaching', 'now-serving'].includes(e.status)
  );
  
  const peopleAhead = activeForService.filter(
    (e) => e.token_number < entry.token_number && e.status !== 'Now Serving' && e.status !== 'now-serving'
  ).length;

  const currentToken = service?.current_token || db.businesses.find((b) => b.business_id === entry.business_id)?.current_token || 0;
  const avgMinutes = service?.calculated_average_minutes || service?.default_duration_minutes || 15;
  const estimatedTotalMinutes = Math.max(0, peopleAhead * avgMinutes);
  
  let estimatedWait = 'Calculating...';
  if (entry.status === 'Now Serving' || entry.status === 'now-serving') {
    estimatedWait = 'Your turn now';
  } else if (estimatedTotalMinutes <= 0) {
    estimatedWait = 'Next in line (~2-5 min)';
  } else {
    estimatedWait = `~${estimatedTotalMinutes} - ${estimatedTotalMinutes + 5} min`;
  }

  let positionMessage = 'You are in queue';
  if (entry.status === 'Now Serving' || entry.status === 'now-serving') {
    positionMessage = 'Please proceed to the counter';
  } else if (peopleAhead === 0) {
    positionMessage = 'You are next! Please be ready';
  } else if (peopleAhead <= 2) {
    positionMessage = `Almost your turn (${peopleAhead} ahead)`;
  } else {
    positionMessage = `${peopleAhead} people ahead of you`;
  }

  return {
    people_ahead: peopleAhead,
    average_minutes: avgMinutes,
    estimated_wait: estimatedWait,
    position_message: positionMessage,
    current_token: currentToken
  };
}

/**
 * Dispatches a simulated REST API request against the in-browser localStorage database.
 */
export async function handleMockRequest(path, options = {}) {
  setMockModeActive(true);
  const db = getMockDB();
  const method = (options.method || 'GET').toUpperCase();
  const urlObj = new URL(`http://localhost${path}`);
  const pathname = urlObj.pathname;
  const searchParams = urlObj.searchParams;
  const body = options.body || {};

  // Artificial realistic micro-delay
  await new Promise((r) => setTimeout(r, 60));

  // --- AUTH ---
  if (pathname === '/auth/customer/login') {
    return {
      token: 'mock-customer-jwt-token',
      user: db.customer
    };
  }

  if (pathname === '/auth/customer/signup') {
    const newUser = {
      user_id: Date.now(),
      name: body.name || 'New Customer',
      email: body.email || 'customer@example.com',
      phone: body.phone || '+1 555-0000'
    };
    db.customer = newUser;
    saveMockDB(db);
    return {
      token: 'mock-customer-jwt-token',
      user: newUser
    };
  }

  if (pathname === '/auth/staff/login') {
    return {
      token: 'mock-staff-jwt-token',
      staff: db.staff
    };
  }

  // --- BUSINESSES ---
  if (pathname === '/businesses' && method === 'GET') {
    const search = (searchParams.get('search') || '').toLowerCase();
    const type = searchParams.get('type') || '';
    let list = db.businesses.map((b) => {
      const activeCount = db.queueEntries.filter(
        (qe) => qe.business_id === b.business_id && ['Waiting', 'Approaching', 'Now Serving'].includes(qe.status)
      ).length;
      return {
        ...b,
        waiting_now: activeCount || b.waiting_now
      };
    });

    if (search) {
      list = list.filter((b) => b.name.toLowerCase().includes(search) || b.address.toLowerCase().includes(search) || b.type.toLowerCase().includes(search));
    }
    if (type) {
      list = list.filter((b) => b.type.toLowerCase() === type.toLowerCase());
    }
    return list;
  }

  const businessIdMatch = pathname.match(/^\/businesses\/(\d+)$/);
  if (businessIdMatch && method === 'GET') {
    const bid = Number(businessIdMatch[1]);
    const business = db.businesses.find((b) => b.business_id === bid) || db.businesses[0];
    const services = db.services.filter((s) => s.business_id === bid).map((s) => {
      const waiting = db.queueEntries.filter((qe) => qe.service_id === s.service_id && ['Waiting', 'Approaching', 'Now Serving'].includes(qe.status)).length;
      return { ...s, waiting_now: waiting };
    });
    return { business, services };
  }

  // --- CUSTOMER ---
  if (pathname === '/customer/me') {
    return db.customer;
  }

  if (pathname === '/customer/dashboard') {
    const active = db.queueEntries
      .filter((qe) => ['Waiting', 'Approaching', 'Now Serving', 'waiting', 'approaching', 'now-serving'].includes(qe.status))
      .map((qe) => {
        const metrics = calculateWaitMetrics(qe, db);
        return { ...qe, ...metrics };
      });

    return {
      activeQueues: active,
      appointments: db.appointments,
      queueHistory: db.history.slice(0, 10),
      notifications: db.notifications
    };
  }

  const customerQueueMatch = pathname.match(/^\/customer\/queues\/(\d+)$/);
  if (customerQueueMatch && method === 'GET') {
    const entryId = Number(customerQueueMatch[1]);
    let entry = db.queueEntries.find((qe) => qe.entry_id === entryId);
    if (!entry) {
      entry = db.history.find((h) => h.entry_id === entryId) || db.queueEntries[0];
    }
    const metrics = calculateWaitMetrics(entry, db);
    return { ...entry, ...metrics };
  }

  if ((pathname === '/customer/queues/join' || pathname === '/customer/queue/join') && method === 'POST') {
    const business = db.businesses.find((b) => b.business_id === body.business_id) || db.businesses[0];
    const service = db.services.find((s) => s.service_id === body.service_id) || db.services[0];
    const nextToken = Math.max(...db.queueEntries.map((e) => e.token_number), service.current_token || 30) + 1;

    const newEntry = {
      entry_id: Date.now(),
      business_id: business.business_id,
      service_id: service.service_id,
      customer_id: db.customer.user_id,
      customer_name: db.customer.name,
      customer_phone: db.customer.phone,
      token_number: nextToken,
      status: 'Waiting',
      source: 'Online',
      booking_type: 'queue',
      appointment_time: null,
      joined_at: new Date().toISOString(),
      business_name: business.name,
      service_name: service.service_name
    };

    db.queueEntries.push(newEntry);
    saveMockDB(db);
    return { entry_id: newEntry.entry_id, token_number: nextToken };
  }

  if (pathname === '/customer/appointments' && method === 'POST') {
    const business = db.businesses.find((b) => b.business_id === body.business_id) || db.businesses[0];
    const service = db.services.find((s) => s.service_id === body.service_id) || db.services[0];
    const nextToken = Math.max(...db.queueEntries.map((e) => e.token_number), 40) + 1;

    const newEntry = {
      entry_id: Date.now(),
      business_id: business.business_id,
      service_id: service.service_id,
      customer_id: db.customer.user_id,
      customer_name: db.customer.name,
      customer_phone: db.customer.phone,
      token_number: nextToken,
      status: 'Waiting',
      source: 'Appointment',
      booking_type: 'appointment',
      appointment_time: body.appointment_time,
      joined_at: new Date().toISOString(),
      business_name: business.name,
      service_name: service.service_name
    };

    const newAppt = {
      appointment_id: Date.now(),
      business_id: business.business_id,
      service_id: service.service_id,
      user_id: db.customer.user_id,
      customer_name: db.customer.name,
      phone: db.customer.phone,
      business_name: business.name,
      service_name: service.service_name,
      appointment_date: body.appointment_date,
      appointment_time: body.appointment_time,
      status: 'Confirmed'
    };

    db.queueEntries.push(newEntry);
    db.appointments.push(newAppt);
    saveMockDB(db);
    return { entry_id: newEntry.entry_id, token_number: nextToken };
  }

  const cancelMatch = pathname.match(/^\/customer\/queues\/(\d+)\/cancel$/);
  if (cancelMatch && method === 'PATCH') {
    const entryId = Number(cancelMatch[1]);
    const entryIndex = db.queueEntries.findIndex((e) => e.entry_id === entryId);
    if (entryIndex !== -1) {
      const removed = db.queueEntries.splice(entryIndex, 1)[0];
      removed.status = 'Cancelled';
      db.history.unshift(removed);
      saveMockDB(db);
    }
    return { message: 'Queue entry cancelled successfully.' };
  }

  if (pathname === '/customer/appointments/history' || pathname === '/customer/appointments') {
    return db.appointments;
  }

  if (pathname === '/customer/queues/history' || pathname === '/customer/queues') {
    return db.history;
  }

  if (pathname === '/customer/notifications') {
    return db.notifications;
  }

  // --- STAFF ---
  if (pathname === '/staff/dashboard') {
    const waiting = db.queueEntries.filter((e) => ['Waiting', 'Approaching'].includes(e.status)).length;
    const serving = db.queueEntries.filter((e) => e.status === 'Now Serving').length;
    const completed = db.history.filter((e) => e.status === 'Completed').length;
    const skipped = db.history.filter((e) => e.status === 'Skipped').length;

    return {
      summary: {
        waiting_count: waiting,
        serving_count: serving,
        completed_count: completed,
        skipped_count: skipped
      },
      queue: db.queueEntries
    };
  }

  if (pathname === '/staff/queue') {
    return db.queueEntries;
  }

  if (pathname === '/staff/appointments') {
    return db.appointments;
  }

  if (pathname === '/staff/walk-ins' && method === 'POST') {
    const service = db.services.find((s) => s.service_id === body.service_id) || db.services[0];
    const nextToken = Math.max(...db.queueEntries.map((e) => e.token_number), 50) + 1;
    const newEntry = {
      entry_id: Date.now(),
      business_id: 1,
      service_id: service.service_id,
      customer_id: null,
      customer_name: body.name || 'Walk-in Guest',
      customer_phone: body.phone || '+1 555-0000',
      token_number: nextToken,
      status: 'Waiting',
      source: 'Walk-in',
      booking_type: 'walk-in',
      appointment_time: null,
      joined_at: new Date().toISOString(),
      business_name: 'Apex Health Clinic',
      service_name: service.service_name
    };
    db.queueEntries.push(newEntry);
    saveMockDB(db);
    return { entry_id: newEntry.entry_id, token_number: nextToken };
  }

  if (pathname === '/staff/queue/call-next' && method === 'POST') {
    const serviceId = body.service_id ? Number(body.service_id) : db.services[0].service_id;
    // Find current serving and mark as completed
    const currentServing = db.queueEntries.find((e) => e.service_id === serviceId && e.status === 'Now Serving');
    if (currentServing) {
      currentServing.status = 'Completed';
      currentServing.completed_at = new Date().toISOString();
      const idx = db.queueEntries.indexOf(currentServing);
      db.queueEntries.splice(idx, 1);
      db.history.unshift(currentServing);
    }

    // Find next waiting
    const nextEntry = db.queueEntries.find((e) => e.service_id === serviceId && ['Waiting', 'Approaching'].includes(e.status));
    if (!nextEntry) {
      throw new Error('No waiting customers in this queue.');
    }

    nextEntry.status = 'Now Serving';
    nextEntry.called_at = new Date().toISOString();

    // Update business and service current_token
    const srv = db.services.find((s) => s.service_id === serviceId);
    if (srv) srv.current_token = nextEntry.token_number;
    const bsn = db.businesses.find((b) => b.business_id === 1);
    if (bsn) bsn.current_token = nextEntry.token_number;

    // Mark next 1-2 waiting as Approaching
    const nextWaiting = db.queueEntries.filter((e) => e.service_id === serviceId && e.status === 'Waiting');
    if (nextWaiting[0]) nextWaiting[0].status = 'Approaching';

    saveMockDB(db);
    return {
      message: `Token #${nextEntry.token_number} is now serving.`,
      entry: nextEntry
    };
  }

  const staffStatusMatch = pathname.match(/^\/staff\/queue\/(\d+)\/status$/);
  if (staffStatusMatch && method === 'PATCH') {
    const entryId = Number(staffStatusMatch[1]);
    const { status } = body;
    const entryIndex = db.queueEntries.findIndex((e) => e.entry_id === entryId);
    if (entryIndex !== -1) {
      const entry = db.queueEntries[entryIndex];
      entry.status = status;
      if (status === 'Completed' || status === 'Skipped' || status === 'Cancelled') {
        entry.completed_at = new Date().toISOString();
        db.queueEntries.splice(entryIndex, 1);
        db.history.unshift(entry);
      }
      saveMockDB(db);
    }
    return { message: `Queue entry marked as ${status}.` };
  }

  if (pathname === '/staff/services' && method === 'GET') {
    return db.services.filter((s) => s.business_id === 1);
  }

  if (pathname === '/staff/services' && method === 'POST') {
    const newService = {
      service_id: Date.now(),
      business_id: 1,
      service_name: body.service_name,
      default_duration_minutes: Number(body.default_duration_minutes) || 15,
      calculated_average_minutes: Number(body.default_duration_minutes) || 15,
      completed_count: 0,
      waiting_now: 0
    };
    db.services.push(newService);
    saveMockDB(db);
    return newService;
  }

  if (pathname === '/staff/statistics') {
    return {
      statusCounts: [
        { status: 'Completed', total: db.history.filter((h) => h.status === 'Completed').length + 42 },
        { status: 'Now Serving', total: db.queueEntries.filter((h) => h.status === 'Now Serving').length },
        { status: 'Waiting', total: db.queueEntries.filter((h) => ['Waiting', 'Approaching'].includes(h.status)).length },
        { status: 'Skipped', total: db.history.filter((h) => h.status === 'Skipped').length + 3 }
      ],
      serviceStats: db.services.map((s) => ({
        service_name: s.service_name,
        completed_count: s.completed_count || 12,
        calculated_average_minutes: s.calculated_average_minutes || s.default_duration_minutes
      })),
      busyServices: [
        { service_name: 'General Physician Consultation', waiting_now: 4 },
        { service_name: 'Lab Diagnostics & Blood Test', waiting_now: 1 }
      ]
    };
  }

  if (pathname === '/staff/history') {
    const todayStr = new Date().toISOString().slice(0, 10);
    return db.history.map((h) => ({
      queue_date: h.queue_date || todayStr,
      service_name: h.service_name,
      status: h.status,
      total: 1
    }));
  }

  // Fallback for any other endpoint
  return { success: true };
}
