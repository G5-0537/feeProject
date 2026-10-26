import { pool } from '../config/db.js';
import { formatWaitRange } from './waitTimeService.js';

function haversineDistance(lat1, lng1, lat2, lng2) {
  const rawCoordinates = [lat1, lng1, lat2, lng2];
  if (rawCoordinates.some((value) => value == null || value === '')) return null;
  const coordinates = rawCoordinates.map(Number);
  if (coordinates.some((value) => !Number.isFinite(value))) return null;
  const [aLat, aLng, bLat, bLng] = coordinates;
  const radians = (value) => (value * Math.PI) / 180;
  const deltaLat = radians(bLat - aLat);
  const deltaLng = radians(bLng - aLng);
  const part = Math.sin(deltaLat / 2) ** 2
    + Math.cos(radians(aLat)) * Math.cos(radians(bLat)) * Math.sin(deltaLng / 2) ** 2;
  return Number((6371 * 2 * Math.atan2(Math.sqrt(part), Math.sqrt(1 - part))).toFixed(1));
}

// Uses the app's existing city-driving approximation (about 3.2 minutes per km).
function estimateDriveMinutes(distanceKm) {
  return distanceKm == null ? null : Math.max(1, Math.round(distanceKm * 3.2));
}

const serviceQueueCounts = `
  SELECT q.service_id,
         SUM(CASE WHEN qe.status IN ('Waiting','Approaching','Now Serving') THEN 1 ELSE 0 END) AS waiting_now
  FROM queues q
  LEFT JOIN queue_entries qe ON qe.queue_id = q.queue_id
  WHERE q.queue_date = CURDATE()
  GROUP BY q.service_id`;

export async function getSmartQueueRecommendation(businessId, userLat, userLng, serviceId = null) {
  const hasUserLocation = userLat != null && userLng != null
    && Number.isFinite(Number(userLat)) && Number.isFinite(Number(userLng));

  const serviceFilter = serviceId ? 'AND s.service_id = ?' : '';
  const currentParams = serviceId ? [businessId, serviceId] : [businessId];
  const [currentRows] = await pool.execute(
    `SELECT b.*, s.service_id, s.service_name,
            COALESCE(sp.calculated_average_minutes, s.default_duration_minutes, 14) AS average_duration,
            COALESCE(qc.waiting_now, 0) AS waiting_now
     FROM businesses b
     JOIN services s ON s.business_id = b.business_id AND s.is_active = TRUE
     LEFT JOIN service_performance_summary sp ON sp.service_id = s.service_id
     LEFT JOIN (${serviceQueueCounts}) qc ON qc.service_id = s.service_id
     WHERE b.business_id = ? ${serviceFilter}
     ORDER BY s.service_id
     LIMIT 1`,
    currentParams
  );
  if (!currentRows.length) return null;

  const current = currentRows[0];
  const currentWaitCount = Number(current.waiting_now) || 0;
  const currentAverageDuration = Number(current.average_duration) || 14;
  const currentWaitMinutes = currentWaitCount * currentAverageDuration;

  // Avoid noisy suggestions when the selected service already has a short wait.
  if (currentWaitMinutes < 25 && currentWaitCount < 6) return null;

  const brandName = current.brand_name || current.name.split(/[–—]/)[0].trim();
  const [siblingRows] = await pool.execute(
    `SELECT b.*, s.service_id, s.service_name,
            COALESCE(sp.calculated_average_minutes, s.default_duration_minutes, 14) AS average_duration,
            COALESCE(qc.waiting_now, 0) AS waiting_now
     FROM businesses b
     JOIN services s ON s.business_id = b.business_id AND s.is_active = TRUE
     LEFT JOIN service_performance_summary sp ON sp.service_id = s.service_id
     LEFT JOIN (${serviceQueueCounts}) qc ON qc.service_id = s.service_id
     WHERE (b.brand_name = ? OR (b.brand_name IS NULL AND b.name LIKE CONCAT(?, '%')))
       AND b.business_id != ?
       AND b.is_active = TRUE
       AND b.is_paused = FALSE
       AND LOWER(TRIM(s.service_name)) = LOWER(TRIM(?))
     ORDER BY s.service_id`,
    [brandName, brandName, businessId, current.service_name]
  );

  let bestCandidate = null;
  for (const candidate of siblingRows) {
    const candidateWaitCount = Number(candidate.waiting_now) || 0;
    const candidateAverageDuration = Number(candidate.average_duration) || 14;
    const candidateWaitMinutes = candidateWaitCount * candidateAverageDuration;
    const userDistanceKm = hasUserLocation
      ? haversineDistance(userLat, userLng, candidate.latitude, candidate.longitude)
      : null;
    const selectedBranchDistanceKm = haversineDistance(
      current.latitude, current.longitude, candidate.latitude, candidate.longitude
    );
    const comparisonDistanceKm = userDistanceKm ?? selectedBranchDistanceKm;

    // Keep the alternative genuinely nearby. When location is unavailable, compare
    // branches within 15 km of the selected branch and clearly label the estimate.
    if (comparisonDistanceKm == null || comparisonDistanceKm > 15) continue;

    const currentDistanceKm = hasUserLocation
      ? haversineDistance(userLat, userLng, current.latitude, current.longitude)
      : null;
    const travelIncluded = hasUserLocation && currentDistanceKm != null && userDistanceKm != null;
    const currentTravelMinutes = travelIncluded ? estimateDriveMinutes(currentDistanceKm) : null;
    const alternativeTravelMinutes = travelIncluded ? estimateDriveMinutes(userDistanceKm) : null;
    const currentTotalMinutes = currentWaitMinutes + (currentTravelMinutes || 0);
    const alternativeTotalMinutes = candidateWaitMinutes + (alternativeTravelMinutes || 0);
    const timeSaved = Math.round(currentTotalMinutes - alternativeTotalMinutes);

    // Recommend only when the estimated overall visit is at least 15 minutes faster.
    if (timeSaved < 15 || (bestCandidate && timeSaved <= bestCandidate.time_saved_minutes)) continue;

    bestCandidate = {
      alternative_branch_id: candidate.business_id,
      alternative_name: candidate.name,
      alternative_branch_name: candidate.branch_name || candidate.name,
      alternative_address: candidate.address,
      distance_km: travelIncluded ? userDistanceKm : selectedBranchDistanceKm,
      distance_basis: travelIncluded ? 'your location' : 'selected branch',
      travel_included: travelIncluded,
      current_distance_km: currentDistanceKm,
      current_travel_minutes: currentTravelMinutes,
      alternative_travel_minutes: alternativeTravelMinutes,
      current_total_minutes: currentTotalMinutes,
      alternative_total_minutes: alternativeTotalMinutes,
      service_name: current.service_name,
      current_wait_minutes: currentWaitMinutes,
      current_wait_text: formatWaitRange(currentWaitMinutes),
      current_people_ahead: currentWaitCount,
      alternative_wait_minutes: candidateWaitMinutes,
      alternative_wait_text: formatWaitRange(candidateWaitMinutes),
      alternative_people_ahead: candidateWaitCount,
      time_saved_minutes: timeSaved,
      latitude: candidate.latitude,
      longitude: candidate.longitude
    };
  }

  return bestCandidate;
}
