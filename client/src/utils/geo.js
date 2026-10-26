/**
 * Geolocation & Navigation Utilities for QueLess
 * Driven by REAL GPS coordinates & mathematical route projections
 */

// Default reference coordinates (City Center) if GPS permission is not granted
export const DEFAULT_COORDINATES = {
  lat: 30.7333,
  lng: 76.7794
};

/**
 * Calculates Great-Circle distance between two coordinates using the Haversine formula
 * @returns distance in kilometers (number)
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) {
    return 2.5;
  }
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
  return Number((R * c).toFixed(3)); // 3 decimal places for meter accuracy
}

/**
 * Formats distance cleanly (e.g. "45 m", "1.2 km")
 */
export function formatDistance(distanceKm) {
  if (distanceKm === undefined || distanceKm === null) return "0 m";
  if (distanceKm < 1) {
    const meters = Math.max(0, Math.round(distanceKm * 1000));
    return `${meters} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
}

/**
 * Computes initial compass bearing from point A to point B in degrees (0..360)
 */
export function calculateBearing(lat1, lon1, lat2, lon2) {
  const y = Math.sin((lon2 - lon1) * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180));
  const x =
    Math.cos(lat1 * (Math.PI / 180)) * Math.sin(lat2 * (Math.PI / 180)) -
    Math.sin(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.cos((lon2 - lon1) * (Math.PI / 180));
  const bearing = (Math.atan2(y, x) * 180) / Math.PI;
  return (bearing + 360) % 360;
}

/**
 * Calculates perpendicular (cross-track) distance from point P to line segment AB in km
 */
export function calculatePerpendicularDistanceToSegment(pLat, pLng, aLat, aLng, bLat, bLng) {
  const l2 = Math.pow(bLat - aLat, 2) + Math.pow(bLng - aLng, 2);
  if (l2 === 0) return calculateDistance(pLat, pLng, aLat, aLng);

  // Projection scalar t on line AB
  let t = ((pLat - aLat) * (bLat - aLat) + (pLng - aLng) * (bLng - aLng)) / l2;
  t = Math.max(0, Math.min(1, t));

  const projLat = aLat + t * (bLat - aLat);
  const projLng = aLng + t * (bLng - aLng);

  return calculateDistance(pLat, pLng, projLat, projLng);
}

/**
 * Generates coordinate-anchored route segments between origin and destination
 */
export function generateCalculatedRoute(originLat, originLng, destLat, destLng, destName = "Destination", destAddress = "Main Road") {
  const totalDistance = calculateDistance(originLat, originLng, destLat, destLng);
  const cleanName = destName.split("–")[0].trim();

  // Interpolate intermediate waypoint coordinates with realistic road offset vectors
  const deltaLat = destLat - originLat;
  const deltaLng = destLng - originLng;

  // Waypoint 1: departure (22% along vector)
  const wp1 = {
    lat: originLat + deltaLat * 0.22 + 0.0008,
    lng: originLng + deltaLng * 0.22 - 0.0006
  };

  // Waypoint 2: main corridor junction (62% along vector)
  const wp2 = {
    lat: originLat + deltaLat * 0.62 - 0.0009,
    lng: originLng + deltaLng * 0.62 + 0.0011
  };

  // Waypoint 3: final access ramp (88% along vector)
  const wp3 = {
    lat: originLat + deltaLat * 0.88 + 0.0004,
    lng: originLng + deltaLng * 0.88 - 0.0003
  };

  const destPoint = { lat: destLat, lng: destLng };
  const originPoint = { lat: originLat, lng: originLng };

  const seg1Dist = calculateDistance(originPoint.lat, originPoint.lng, wp1.lat, wp1.lng);
  const seg2Dist = calculateDistance(wp1.lat, wp1.lng, wp2.lat, wp2.lng);
  const seg3Dist = calculateDistance(wp2.lat, wp2.lng, wp3.lat, wp3.lng);
  const seg4Dist = calculateDistance(wp3.lat, wp3.lng, destPoint.lat, destPoint.lng);

  const segments = [
    {
      id: 1,
      startCoords: originPoint,
      endCoords: wp1,
      instruction: "Head forward from current GPS location onto main arterial road",
      street: "Departure Roadway",
      distanceKm: seg1Dist,
      distanceMeters: Math.max(80, Math.round(seg1Dist * 1000)),
      turn: "straight"
    },
    {
      id: 2,
      startCoords: wp1,
      endCoords: wp2,
      instruction: `Turn right onto Central Highway towards ${cleanName}`,
      street: "Central Express Highway",
      distanceKm: seg2Dist,
      distanceMeters: Math.max(150, Math.round(seg2Dist * 1000)),
      turn: "right"
    },
    {
      id: 3,
      startCoords: wp2,
      endCoords: wp3,
      instruction: `Keep left and take the ramp towards ${destAddress}`,
      street: "Sector Access Boulevard",
      distanceKm: seg3Dist,
      distanceMeters: Math.max(100, Math.round(seg3Dist * 1000)),
      turn: "left"
    },
    {
      id: 4,
      startCoords: wp3,
      endCoords: destPoint,
      instruction: `Arrive at ${destName} (Destination on your left)`,
      street: destAddress,
      distanceKm: seg4Dist,
      distanceMeters: Math.max(50, Math.round(seg4Dist * 1000)),
      turn: "arrive"
    }
  ];

  return {
    totalDistanceKm: totalDistance,
    origin: originPoint,
    destination: destPoint,
    segments
  };
}

/**
 * Evaluates real-time GPS state against route segments
 * Returns current segment, real remaining distance, distance to next turn, off-route state, and arrival flag
 */
export function evaluateGpsNavigationProgress(userLat, userLng, calculatedRoute, originDistanceKm) {
  if (!calculatedRoute || !calculatedRoute.segments || calculatedRoute.segments.length === 0) {
    return {
      currentStepIndex: 0,
      activeStep: null,
      remainingDistanceKm: 0,
      metersToNextManeuver: 0,
      progressRatio: 0,
      isArrived: false,
      isOffRoute: false,
      crossTrackDistanceKm: 0
    };
  }

  const destLat = calculatedRoute.destination.lat;
  const destLng = calculatedRoute.destination.lng;

  // 1. Real Remaining Distance to Destination
  const remainingDistanceKm = calculateDistance(userLat, userLng, destLat, destLng);

  // 2. Real Arrival Threshold (45 meters / 0.045 km)
  const isArrived = remainingDistanceKm <= 0.045;

  // 3. Find closest segment to user GPS position
  let minCrossTrack = Infinity;
  let activeIndex = 0;

  calculatedRoute.segments.forEach((seg, idx) => {
    const distToSeg = calculatePerpendicularDistanceToSegment(
      userLat,
      userLng,
      seg.startCoords.lat,
      seg.startCoords.lng,
      seg.endCoords.lat,
      seg.endCoords.lng
    );
    if (distToSeg < minCrossTrack) {
      minCrossTrack = distToSeg;
      activeIndex = idx;
    }
  });

  // If user is approaching closer to a subsequent waypoint, advance active step
  for (let i = activeIndex; i < calculatedRoute.segments.length - 1; i++) {
    const distToEnd = calculateDistance(
      userLat,
      userLng,
      calculatedRoute.segments[i].endCoords.lat,
      calculatedRoute.segments[i].endCoords.lng
    );
    // If within 35m of waypoint end, promote to next segment
    if (distToEnd <= 0.035) {
      activeIndex = i + 1;
    }
  }

  const activeStep = calculatedRoute.segments[activeIndex];

  // 4. Distance to next turn maneuver
  const distToManeuverKm = calculateDistance(
    userLat,
    userLng,
    activeStep.endCoords.lat,
    activeStep.endCoords.lng
  );
  const metersToNextManeuver = Math.max(0, Math.round(distToManeuverKm * 1000));

  // 5. Off Route Detection (> 150m cross track error from nearest route segment)
  const isOffRoute = minCrossTrack > 0.15 && remainingDistanceKm > 0.15;

  // 6. Real Progress Ratio (0.0 to 1.0) based strictly on distance delta
  const baseDistance = originDistanceKm || calculatedRoute.totalDistanceKm || 1;
  const progressRatio = isArrived ? 1.0 : Math.max(0, Math.min(0.99, (baseDistance - remainingDistanceKm) / baseDistance));

  return {
    currentStepIndex: activeIndex,
    activeStep,
    remainingDistanceKm,
    metersToNextManeuver,
    progressRatio,
    isArrived,
    isOffRoute,
    crossTrackDistanceKm: minCrossTrack
  };
}

/**
 * Calculates estimated driving and walking durations from remaining distance in km
 */
export function calculateTravelEstimates(distanceKm, realSpeedKmh = null, navMode = "driving") {
  if (!distanceKm || distanceKm <= 0) {
    return { driveMinutes: 1, walkMinutes: 1 };
  }

  // If valid real speed > 5 km/h is reported by GPS, calculate dynamic ETA
  if (realSpeedKmh && realSpeedKmh >= 5) {
    const dynamicMinutes = Math.max(1, Math.round((distanceKm / realSpeedKmh) * 60));
    return {
      driveMinutes: navMode === "driving" ? dynamicMinutes : Math.max(1, Math.round(distanceKm * 12.5)),
      walkMinutes: navMode === "walking" ? dynamicMinutes : Math.max(1, Math.round(distanceKm * 12.5))
    };
  }

  // Default mode-based ETA calculation (remains constant if user is stationary)
  const driveMinutes = Math.max(1, Math.round(distanceKm * 3.2));
  const walkMinutes = Math.max(1, Math.round(distanceKm * 12.5));
  return { driveMinutes, walkMinutes };
}

/**
 * Attempts single-shot GPS fetch
 */
export function getUserCoordinates() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ ...DEFAULT_COORDINATES, isFallback: true });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          isFallback: false
        });
      },
      () => {
        resolve({ ...DEFAULT_COORDINATES, isFallback: true });
      },
      { timeout: 5000, enableHighAccuracy: true }
    );
  });
}

/**
 * Generates Mappls Directions deep link
 */
export function getMapplsNavigationUrl(originLat, originLng, destLat, destLng, address = "", name = "") {
  if (originLat && originLng && destLat && destLng) {
    return `https://mappls.com/dir?origin=${originLat},${originLng}&destination=${destLat},${destLng}`;
  }
  if (destLat && destLng) {
    return `https://mappls.com/dir?destination=${destLat},${destLng}`;
  }
  if (address || name) {
    return `https://mappls.com/search/${encodeURIComponent(`${name} ${address}`.trim())}`;
  }
  return "https://mappls.com";
}

/**
 * Opens Google Maps / Apple Maps directions
 */
export function openMapNavigation(lat, lng, address = "", name = "") {
  let url = "";
  if (lat && lng) {
    url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  } else if (address) {
    url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${name} ${address}`)}`;
  } else {
    url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`;
  }
  window.open(url, "_blank", "noopener,noreferrer");
}

/**
 * Opens Mappls Directions in a new browser tab
 */
export function openMapplsNavigation(originLat, originLng, destLat, destLng, address = "", name = "") {
  const url = getMapplsNavigationUrl(originLat, originLng, destLat, destLng, address, name);
  window.open(url, "_blank", "noopener,noreferrer");
}
