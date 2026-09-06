import { pool } from '../config/db.js';
import { formatWaitRange, queueMessage } from './waitTimeService.js';

export async function getOrCreateQueue(connection, businessId, serviceId, queueDate) {
  const [existing] = await connection.execute(
    `SELECT queue_id FROM queues
     WHERE business_id = ? AND service_id = ? AND queue_date = ?
     LIMIT 1`,
    [businessId, serviceId, queueDate]
  );

  if (existing.length) return existing[0].queue_id;

  const [created] = await connection.execute(
    `INSERT INTO queues (business_id, service_id, queue_date, current_token, status)
     VALUES (?, ?, ?, 0, 'Open')`,
    [businessId, serviceId, queueDate]
  );
  return created.insertId;
}

export async function getNextToken(connection, queueId) {
  const [rows] = await connection.execute(
    `SELECT COALESCE(MAX(token_number), 0) + 1 AS next_token
     FROM queue_entries
     WHERE queue_id = ?
     FOR UPDATE`,
    [queueId]
  );
  return rows[0].next_token;
}

export async function buildQueueSnapshot(entryId) {
  const [rows] = await pool.execute(
    `SELECT
      qe.entry_id,
      qe.token_number,
      qe.status,
      qe.source,
      q.queue_id,
      q.current_token,
      q.queue_date,
      b.business_id,
      b.name AS business_name,
      s.service_id,
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
     WHERE qe.entry_id = ?`,
    [entryId]
  );

  if (!rows.length) return null;
  const item = rows[0];
  const estimatedMinutes = Number(item.people_ahead) * Number(item.average_minutes);
  return {
    ...item,
    average_minutes: Number(item.average_minutes),
    people_ahead: Number(item.people_ahead),
    estimated_minutes: Math.round(estimatedMinutes),
    estimated_wait: formatWaitRange(estimatedMinutes),
    position_message: queueMessage(Number(item.people_ahead))
  };
}
