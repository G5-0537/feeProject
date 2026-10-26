# QueLess

QueLess is a digital queue-management website for a BE CSE DBMS project.

Architecture:

```text
React Frontend -> Node.js/Express Backend -> MySQL Database
```

## Project Structure

```text
QueLessProject/
  client/      React + Vite frontend
  server/      Node.js + Express API
  database/    MySQL schema, trigger, views and seed data
```

## Setup

Install dependencies:

```bash
npm run install:all
```

Create the server environment file:

```bash
cp server/.env.example server/.env
```

Create and seed MySQL:

```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
```

Run both frontend and backend:

```bash
npm run dev
```

Frontend: http://127.0.0.1:5173  
Backend health check: http://127.0.0.1:5000/api/health

## Demo Accounts

After importing `seed.sql`, use:

Customer:
- `aarav@example.com`
- `password123`

Staff:
- `staff@abcclinic.com`
- `password123`

## DBMS Concepts Demonstrated

- Primary keys and foreign keys
- Normalized tables for users, businesses, staff, services, queues, queue entries, appointments and notifications
- One-to-many relationships such as business to services, business to staff, queue to queue entries
- Useful constraints and unique indexes
- SQL joins through API queries and views
- Aggregate functions and `GROUP BY` in staff statistics
- Subqueries for people-ahead calculation
- Transactions for appointment booking, live queue joining and staff call-next
- Trigger for recording actual service duration when an entry is completed

## Front-End Syllabus Demonstrations (Topics 43–72)

| Topics | Demonstration | Code location |
|---|---|---|
| 43–48 | Multi-page SPA navigation, protected customer/staff routes and 404 handling | `client/src/App.jsx`, `client/src/components/DashboardShell.jsx` |
| 49–54 | Local state, Context API (auth, theme, queue and toast) and Zustand staff state | `client/src/context/`, `client/src/store/staffStore.js` |
| 55–60 | Reusable fields and validation for auth, appointments, staff branch settings and walk-ins | `client/src/components/FormField.jsx`, `client/src/hooks/useFormValidation.js`, `client/src/pages/` |
| 61–66 | Modal, tabs, toast notifications, search/filter/sort | `client/src/components/`, `client/src/hooks/useTableControls.js` |
| 67–72 | REST requests, mock fallback, retryable loads, request cancellation, pagination, infinite scroll and debounce | `client/src/services/api.js`, `client/src/hooks/`, customer history and business search pages |

### CRUD workflow examples

- **Queue entries:** create by joining a live queue (`POST /api/customer/queues/join`) or adding a walk-in (`POST /api/staff/walk-ins`); read through customer tracking/history and staff queue routes; update status with `PATCH /api/staff/queue/:entryId/status`; cancel a customer's waiting entry with `PATCH /api/customer/queues/:entryId/cancel`.
- **Services:** read with `GET /api/staff/services`, create with `POST /api/staff/services`, and update with `PATCH /api/staff/services/:serviceId`.
- **Branch profile:** read with `GET /api/staff/branch` and update with `PATCH /api/staff/branch`.

Queue cancellation is a status change that preserves history; the API does not expose permanent record deletion. Appointment creation is available through `POST /api/customer/appointments`.

### Live API and demo mode

The frontend first sends requests to the Express API (`VITE_API_URL`, defaulting to `http://127.0.0.1:5000/api`). A network connection failure falls back to the in-browser mock database. The **Demo / Offline Mode** banner identifies that fallback and offers a reset action. HTTP error responses remain errors and are not silently replaced by mock data. History pages can be switched between pagination and a client-side infinite-scroll view; the current history endpoints return the full result set in one request, so the infinite-scroll example progressively reveals already-loaded rows rather than fetching server pages.
