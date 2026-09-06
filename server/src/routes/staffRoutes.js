import { Router } from 'express';
import { pool } from '../config/db.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { getNextToken, getOrCreateQueue } from '../services/queueService.js';

const router = Router();
router.use(requireAuth('staff'));

router.get('/dashboard', async (req, res, next) => {
  try {
    const businessId = req.auth.business_id;
    const [summary] = await pool.execute(
      `SELECT
        SUM(qe.status IN ('Waiting','Approaching')) AS waiting_count,
        SUM(qe.status = 'Now Serving') AS serving_count,
        SUM(qe.status = 'Completed') AS completed_count,
        SUM(qe.status = 'Skipped') AS skipped_count
       FROM queue_entries qe
       JOIN queues q ON q.queue_id = qe.queue_id
       WHERE q.business_id = ? AND q.queue_date = CURDATE()`,
      [businessId]
    );
    const [queue] = await pool.execute(
      `SELECT * FROM active_queue_overview
       WHERE business_id = ? AND queue_date = CURDATE()
       ORDER BY service_name, token_number`,
      [businessId]
    );
    res.json({ summary: summary[0], queue });
  } catch (error) {
    next(error);
  }
});

router.get('/appointments', async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT a.*, u.name AS customer_name, u.phone, s.service_name
       FROM appointments a
       JOIN users u ON u.user_id = a.user_id
       JOIN services s ON s.service_id = a.service_id
       WHERE s.business_id = ? AND a.appointment_date = CURDATE()
       ORDER BY a.appointment_time`,
      [req.auth.business_id]
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.get('/queue', async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT * FROM active_queue_overview
       WHERE business_id = ? AND queue_date = CURDATE()
       ORDER BY service_name, token_number`,
      [req.auth.business_id]
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.post('/walk-ins', async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { service_id, name, phone } = req.body;
    const today = new Date().toISOString().slice(0, 10);
    await connection.beginTransaction();
    const queueId = await getOrCreateQueue(connection, req.auth.business_id, service_id, today);
    const tokenNumber = await getNextToken(connection, queueId);
    const [result] = await connection.execute(
      `INSERT INTO queue_entries (queue_id, walk_in_name, walk_in_phone, token_number, source, status)
       VALUES (?, ?, ?, ?, 'Walk-in', 'Waiting')`,
      [queueId, name, phone, tokenNumber]
    );
    await connection.commit();
    res.status(201).json({ entry_id: result.insertId, token_number: tokenNumber });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
});

router.post('/queue/call-next', async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { service_id } = req.body;
    await connection.beginTransaction();
    const [queueRows] = await connection.execute(
      `SELECT queue_id FROM queues
       WHERE business_id = ? AND service_id = ? AND queue_date = CURDATE()
       LIMIT 1 FOR UPDATE`,
      [req.auth.business_id, service_id]
    );
    if (!queueRows.length) {
      await connection.rollback();
      return res.status(404).json({ message: 'No open queue found for this service.' });
    }

    const queueId = queueRows[0].queue_id;
    await connection.execute(
      `UPDATE queue_entries SET status = 'Skipped'
       WHERE queue_id = ? AND status = 'Now Serving'`,
      [queueId]
    );

    const [nextRows] = await connection.execute(
      `SELECT entry_id, token_number FROM queue_entries
       WHERE queue_id = ? AND status IN ('Waiting','Approaching')
       ORDER BY token_number
       LIMIT 1 FOR UPDATE`,
      [queueId]
    );

    if (!nextRows.length) {
      await connection.rollback();
      return res.status(404).json({ message: 'No waiting customers in this queue.' });
    }

    const nextEntry = nextRows[0];
    await connection.execute(
      `UPDATE queue_entries SET status = 'Now Serving', called_at = NOW()
       WHERE entry_id = ?`,
      [nextEntry.entry_id]
    );
    await connection.execute('UPDATE queues SET current_token = ? WHERE queue_id = ?', [nextEntry.token_number, queueId]);
    await connection.execute(
      `UPDATE queue_entries SET status = 'Approaching'
       WHERE queue_id = ? AND status = 'Waiting' AND token_number IN (?, ?)`,
      [queueId, nextEntry.token_number + 1, nextEntry.token_number + 2]
    );
    await connection.commit();
    res.json({ message: `Token #${nextEntry.token_number} is now serving.`, entry: nextEntry });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
});

router.patch('/queue/:entryId/status', async (req, res, next) => {
  try {
    const allowed = ['Completed', 'Skipped', 'Cancelled'];
    const { status } = req.body;
    if (!allowed.includes(status)) return res.status(400).json({ message: 'Invalid status update.' });

    const completedAt = status === 'Completed' ? ', completed_at = NOW()' : '';
    const [result] = await pool.execute(
      `UPDATE queue_entries qe
       JOIN queues q ON q.queue_id = qe.queue_id
       SET qe.status = ? ${completedAt}
       WHERE qe.entry_id = ? AND q.business_id = ?`,
      [status, req.params.entryId, req.auth.business_id]
    );
    if (!result.affectedRows) return res.status(404).json({ message: 'Queue entry not found.' });
    res.json({ message: `Queue entry marked as ${status}.` });
  } catch (error) {
    next(error);
  }
});

router.get('/services', async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT s.*, sp.completed_count, sp.calculated_average_minutes
       FROM services s
       LEFT JOIN service_performance_summary sp ON sp.service_id = s.service_id
       WHERE s.business_id = ?
       ORDER BY s.service_name`,
      [req.auth.business_id]
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.post('/services', async (req, res, next) => {
  try {
    const { service_name, default_duration_minutes } = req.body;
    const [result] = await pool.execute(
      `INSERT INTO services (business_id, service_name, default_duration_minutes)
       VALUES (?, ?, ?)`,
      [req.auth.business_id, service_name, default_duration_minutes]
    );
    res.status(201).json({ service_id: result.insertId, service_name, default_duration_minutes });
  } catch (error) {
    next(error);
  }
});

router.patch('/services/:serviceId', async (req, res, next) => {
  try {
    const { service_name, default_duration_minutes, is_active } = req.body;
    await pool.execute(
      `UPDATE services
       SET service_name = COALESCE(?, service_name),
           default_duration_minutes = COALESCE(?, default_duration_minutes),
           is_active = COALESCE(?, is_active)
       WHERE service_id = ? AND business_id = ?`,
      [service_name, default_duration_minutes, is_active, req.params.serviceId, req.auth.business_id]
    );
    res.json({ message: 'Service updated.' });
  } catch (error) {
    next(error);
  }
});

router.get('/statistics', async (req, res, next) => {
  try {
    const [statusCounts] = await pool.execute(
      `SELECT qe.status, COUNT(*) AS total
       FROM queue_entries qe
       JOIN queues q ON q.queue_id = qe.queue_id
       WHERE q.business_id = ?
       GROUP BY qe.status`,
      [req.auth.business_id]
    );
    const [serviceStats] = await pool.execute(
      `SELECT service_name, completed_count, calculated_average_minutes
       FROM service_performance_summary
       WHERE business_id = ?
       ORDER BY service_name`,
      [req.auth.business_id]
    );
    const [busyServices] = await pool.execute(
      `SELECT s.service_name, COUNT(*) AS waiting_now
       FROM services s
       JOIN queues q ON q.service_id = s.service_id
       JOIN queue_entries qe ON qe.queue_id = q.queue_id
       WHERE s.business_id = ?
         AND q.queue_date = CURDATE()
         AND qe.status IN ('Waiting','Approaching','Now Serving')
       GROUP BY s.service_id, s.service_name
       HAVING waiting_now > 0
       ORDER BY waiting_now DESC`,
      [req.auth.business_id]
    );
    res.json({ statusCounts, serviceStats, busyServices });
  } catch (error) {
    next(error);
  }
});

router.get('/history', async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT queue_date, service_name, status, COUNT(*) AS total
       FROM active_queue_overview
       WHERE business_id = ?
       GROUP BY queue_date, service_name, status
       ORDER BY queue_date DESC, service_name`,
      [req.auth.business_id]
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

export default router;
