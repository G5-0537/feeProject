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
