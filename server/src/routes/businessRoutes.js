import { Router } from 'express';
import { pool } from '../config/db.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const search = `%${req.query.search || ''}%`;
    const type = req.query.type || null;
    const [rows] = await pool.execute(
      `SELECT
        b.*,
        COUNT(s.service_id) AS service_count,
        ROUND(AVG(s.default_duration_minutes), 1) AS average_duration,
        COALESCE(MAX(qs.waiting_now), 0) AS waiting_now,
        COALESCE(MAX(qs.current_token), 0) AS current_token
       FROM businesses b
       LEFT JOIN services s ON s.business_id = b.business_id AND s.is_active = TRUE
       LEFT JOIN (
         SELECT
           q.business_id,
           MAX(q.current_token) AS current_token,
           SUM(qe.status IN ('Waiting','Approaching','Now Serving')) AS waiting_now
         FROM queues q
         LEFT JOIN queue_entries qe ON qe.queue_id = q.queue_id
         WHERE q.queue_date = CURDATE()
         GROUP BY q.business_id
       ) qs ON qs.business_id = b.business_id
       WHERE b.is_active = TRUE
         AND (b.name LIKE ? OR b.address LIKE ? OR b.type LIKE ?)
         AND (? IS NULL OR b.type = ?)
       GROUP BY b.business_id
       ORDER BY b.name`,
      [search, search, search, type, type]
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.get('/:businessId', async (req, res, next) => {
  try {
    const [businessRows] = await pool.execute(
      `SELECT
        b.*,
        COALESCE(qs.waiting_now, 0) AS waiting_now,
        COALESCE(qs.current_token, 0) AS current_token
       FROM businesses b
       LEFT JOIN (
         SELECT
           q.business_id,
           MAX(q.current_token) AS current_token,
           SUM(qe.status IN ('Waiting','Approaching','Now Serving')) AS waiting_now
         FROM queues q
         LEFT JOIN queue_entries qe ON qe.queue_id = q.queue_id
         WHERE q.queue_date = CURDATE()
         GROUP BY q.business_id
       ) qs ON qs.business_id = b.business_id
       WHERE b.business_id = ?`,
      [req.params.businessId]
    );
    if (!businessRows.length) return res.status(404).json({ message: 'Business not found.' });

    const [services] = await pool.execute(
      `SELECT
        s.*,
        sp.calculated_average_minutes,
        COALESCE(q.current_token, 0) AS current_token,
        COALESCE(SUM(qe.status IN ('Waiting','Approaching','Now Serving')), 0) AS waiting_now
       FROM services s
       LEFT JOIN service_performance_summary sp ON sp.service_id = s.service_id
       LEFT JOIN queues q ON q.service_id = s.service_id AND q.queue_date = CURDATE()
       LEFT JOIN queue_entries qe ON qe.queue_id = q.queue_id
       WHERE s.business_id = ? AND s.is_active = TRUE
       GROUP BY s.service_id, sp.calculated_average_minutes, q.current_token
       ORDER BY s.service_name`,
      [req.params.businessId]
    );

    res.json({ business: businessRows[0], services });
  } catch (error) {
    next(error);
  }
});

export default router;
