import { pool } from '../config/db.js';
import { formatWaitRange } from './waitTimeService.js';

function haversineDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 2.5;
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

export async function getSmartQueueRecommendation(businessId, userLat, userLng) {
  // 1. Get current business info and queue count
  const [currentRows] = await pool.execute(
    `SELECT
      b.*,
      COALESCE(SUM(qe.status IN ('Waiting','Approaching','Now Serving')), 0) AS waiting_now,
      COALESCE(AVG(s.default_duration_minutes), 14) AS average_duration
     FROM businesses b
     LEFT JOIN services s ON s.business_id = b.business_id AND s.is_active = TRUE
     LEFT JOIN queues q ON q.business_id = b.business_id AND q.queue_date = CURDATE()
     LEFT JOIN queue_entries qe ON qe.queue_id = q.queue_id
     WHERE b.business_id = ?
     GROUP BY b.business_id`,
    [businessId]
  );

  if (!currentRows.length) return null;
  const current = currentRows[0];
  const currentWaitCount = Number(current.waiting_now) || 0;
  const currentAvgDuration = Number(current.average_duration) || 14;
  const currentEstimatedMinutes = currentWaitCount * currentAvgDuration;

  // Only trigger recommendation if wait is high (>= 25 min or >= 6 people waiting)
  if (currentEstimatedMinutes < 25 && currentWaitCount < 6) {
    return null;
  }

  // 2. Find sibling branches belonging to the same brand (or matching brand_name)
  const brandName = current.brand_name || current.name.split('–')[0].trim();

  const [siblingRows] = await pool.execute(
    `SELECT
      b.*,
      COALESCE(SUM(qe.status IN ('Waiting','Approaching','Now Serving')), 0) AS waiting_now,
      COALESCE(AVG(s.default_duration_minutes), 12) AS average_duration
     FROM businesses b
     LEFT JOIN services s ON s.business_id = b.business_id AND s.is_active = TRUE
     LEFT JOIN queues q ON q.business_id = b.business_id AND q.queue_date = CURDATE()
     LEFT JOIN queue_entries qe ON qe.queue_id = q.queue_id
     WHERE (b.brand_name = ? OR b.name LIKE CONCAT(?, '%'))
       AND b.business_id != ?
       AND b.is_active = TRUE
       AND b.is_paused = FALSE
     GROUP BY b.business_id`,
    [brandName, brandName, businessId]
  );

  if (!siblingRows.length) return null;

  let bestCandidate = null;
  let maxTimeSaved = 0;

  for (const candidate of siblingRows) {
    const candidateWaitCount = Number(candidate.waiting_now) || 0;
    const candidateAvgDuration = Number(candidate.average_duration) || 12;
    const candidateEstimatedMinutes = candidateWaitCount * candidateAvgDuration;
    const timeSaved = currentEstimatedMinutes - candidateEstimatedMinutes;

    const lat1 = userLat || current.latitude;
    const lon1 = userLng || current.longitude;
    const distanceKm = haversineDistance(lat1, lon1, candidate.latitude, candidate.longitude);

    // Save at least 15 min & within 15 km
    if (timeSaved >= 15 && distanceKm <= 15) {
      if (timeSaved > maxTimeSaved) {
        maxTimeSaved = timeSaved;
        bestCandidate = {
          alternative_branch_id: candidate.business_id,
          alternative_name: candidate.name,
          alternative_branch_name: candidate.branch_name || candidate.name,
          alternative_address: candidate.address,
          distance_km: distanceKm,
          current_wait_minutes: currentEstimatedMinutes,
          current_wait_text: formatWaitRange(currentEstimatedMinutes),
          current_people_ahead: currentWaitCount,
          alternative_wait_minutes: candidateEstimatedMinutes,
          alternative_wait_text: formatWaitRange(candidateEstimatedMinutes),
          alternative_people_ahead: candidateWaitCount,
          time_saved_minutes: timeSaved,
          latitude: candidate.latitude,
          longitude: candidate.longitude
        };
      }
    }
  }

  return bestCandidate;
}
