import { Router } from 'express';
import { pool } from '../config/db.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { buildQueueSnapshot, getNextToken, getOrCreateQueue } from '../services/queueService.js';
import { formatWaitRange, queueMessage } from '../services/waitTimeService.js';

const router = Router();
router.use(requireAuth('customer'));

router.get('/me', async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      'SELECT user_id, name, email, phone, created_at FROM users WHERE user_id = ?',
      [req.auth.id]
    );
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

router.get('/dashboard', async (req, res, next) => {
  try {
    const [activeQueues] = await pool.execute(
      `SELECT
        qe.entry_id,
        qe.token_number,
        qe.status,
        qe.joined_at,
        q.current_token,
        b.name AS business_name,
        s.service_name,
        COALESCE(sp.calculated_average_minutes, s.default_duration_minutes) AS average_minutes,
        (
          SELECT COUNT(*)
          FROM queue_entries ahead
          WHERE ahead.queue_id = qe.queue_id
            AND ahead.token_number < qe.token_number
            AND ahead.status IN ('Waiting','Approaching','Now Serving')
        ) AS people_ahead
       FROM queue_entries qe
       JOIN queues q ON q.queue_id = qe.queue_id
       JOIN businesses b ON b.business_id = q.business_id
       JOIN services s ON s.service_id = q.service_id
       LEFT JOIN service_performance_summary sp ON sp.service_id = s.service_id
       WHERE qe.user_id = ? AND qe.status IN ('Waiting','Approaching','Now Serving')
       ORDER BY qe.joined_at DESC`,
      [req.auth.id]
    );
    const [appointments] = await pool.execute(
      `SELECT a.*, b.name AS business_name, s.service_name
       FROM appointments a
       JOIN services s ON s.service_id = a.service_id
       JOIN businesses b ON b.business_id = s.business_id
       WHERE a.user_id = ?
       ORDER BY a.appointment_date DESC, a.appointment_time DESC
       LIMIT 5`,
      [req.auth.id]
    );
    const [notifications] = await pool.execute(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 6',
      [req.auth.id]
    );
    const activeQueueSnapshots = activeQueues.map((item) => {
      const estimatedMinutes = Number(item.people_ahead) * Number(item.average_minutes);
      return {
        ...item,
        people_ahead: Number(item.people_ahead),
        average_minutes: Number(item.average_minutes),
        estimated_wait: formatWaitRange(estimatedMinutes),
        position_message: queueMessage(Number(item.people_ahead))
      };
    });

    const [queueHistory] = await pool.execute(
      `SELECT qe.entry_id, qe.token_number, qe.status, qe.joined_at, qe.completed_at, b.name AS business_name, s.service_name
       FROM queue_entries qe
       JOIN queues q ON q.queue_id = qe.queue_id
       JOIN businesses b ON b.business_id = q.business_id
       JOIN services s ON s.service_id = q.service_id
       WHERE qe.user_id = ? AND qe.status IN ('Completed','Skipped','Cancelled')
       ORDER BY qe.joined_at DESC
       LIMIT 5`,
      [req.auth.id]
    );

    res.json({ activeQueues: activeQueueSnapshots, appointments, queueHistory, notifications });
  } catch (error) {
    next(error);
  }
});

router.post('/appointments', async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { business_id, service_id, appointment_date, appointment_time } = req.body;
    await connection.beginTransaction();

    const [appointmentResult] = await connection.execute(
      `INSERT INTO appointments (user_id, service_id, appointment_date, appointment_time, status)
       VALUES (?, ?, ?, ?, 'Booked')`,
      [req.auth.id, service_id, appointment_date, appointment_time]
    );

    const queueId = await getOrCreateQueue(connection, business_id, service_id, appointment_date);
    const tokenNumber = await getNextToken(connection, queueId);
    const [entryResult] = await connection.execute(
      `INSERT INTO queue_entries (queue_id, user_id, appointment_id, token_number, source, status)
       VALUES (?, ?, ?, ?, 'Appointment', 'Waiting')`,
      [queueId, req.auth.id, appointmentResult.insertId, tokenNumber]
    );
    await connection.execute('UPDATE appointments SET status = ? WHERE appointment_id = ?', ['Waiting', appointmentResult.insertId]);
    await connection.execute(
      'INSERT INTO notifications (user_id, message, type) VALUES (?, ?, ?)',
      [req.auth.id, `Appointment booked. Your token is #${tokenNumber}.`, 'Appointment']
    );

    await connection.commit();
    res.status(201).json({ appointment_id: appointmentResult.insertId, entry_id: entryResult.insertId, token_number: tokenNumber });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
});

router.post('/queues/join', async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { business_id, service_id } = req.body;
    const today = new Date().toISOString().slice(0, 10);
    await connection.beginTransaction();
    const queueId = await getOrCreateQueue(connection, business_id, service_id, today);
    const tokenNumber = await getNextToken(connection, queueId);
    const [entryResult] = await connection.execute(
      `INSERT INTO queue_entries (queue_id, user_id, token_number, source, status)
       VALUES (?, ?, ?, 'Live Queue', 'Waiting')`,
      [queueId, req.auth.id, tokenNumber]
    );
    await connection.execute(
      'INSERT INTO notifications (user_id, message, type) VALUES (?, ?, ?)',
      [req.auth.id, `You joined the live queue. Your token is #${tokenNumber}.`, 'Queue']
    );
    await connection.commit();
    res.status(201).json(await buildQueueSnapshot(entryResult.insertId));
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
});

router.get('/queues/:entryId', async (req, res, next) => {
  try {
    const [owner] = await pool.execute('SELECT user_id FROM queue_entries WHERE entry_id = ?', [req.params.entryId]);
    if (!owner.length || owner[0].user_id !== req.auth.id) return res.status(404).json({ message: 'Queue entry not found.' });
    res.json(await buildQueueSnapshot(req.params.entryId));
  } catch (error) {
    next(error);
  }
});

router.patch('/queues/:entryId/cancel', async (req, res, next) => {
  try {
    const [result] = await pool.execute(
      `UPDATE queue_entries SET status = 'Cancelled'
       WHERE entry_id = ? AND user_id = ? AND status IN ('Waiting','Approaching')`,
      [req.params.entryId, req.auth.id]
    );
    if (!result.affectedRows) return res.status(404).json({ message: 'Cancellable queue entry not found.' });
    res.json({ message: 'Queue entry cancelled.' });
  } catch (error) {
    next(error);
  }
});

router.get('/appointments/history', async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT a.*, b.name AS business_name, s.service_name
       FROM appointments a
       JOIN services s ON s.service_id = a.service_id
       JOIN businesses b ON b.business_id = s.business_id
       WHERE a.user_id = ?
       ORDER BY a.appointment_date DESC, a.appointment_time DESC`,
      [req.auth.id]
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.get('/queues/history', async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT qe.*, b.name AS business_name, s.service_name
       FROM queue_entries qe
       JOIN queues q ON q.queue_id = qe.queue_id
       JOIN businesses b ON b.business_id = q.business_id
       JOIN services s ON s.service_id = q.service_id
       WHERE qe.user_id = ?
       ORDER BY qe.joined_at DESC`,
      [req.auth.id]
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.get('/notifications', async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
      [req.auth.id]
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

export default router;
