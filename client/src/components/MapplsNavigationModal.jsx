import { useState, useEffect, useRef } from "react";
import {
  X,
  Navigation,
  MapPin,
  Compass,
  Car,
  Footprints,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  LocateFixed,
  Route,
  ArrowRight,
  ArrowUpRight,
  CornerUpRight,
  CornerUpLeft,
  CheckCircle2,
  Volume2,
  VolumeX,
  RotateCcw,
  Gauge,
  Clock,
  Sparkles,
  Radio,
  AlertTriangle,
  Play
} from "lucide-react";
import {
  calculateDistance,
  formatDistance,
  calculateTravelEstimates,
  generateCalculatedRoute,
  evaluateGpsNavigationProgress,
  openMapplsNavigation,
  openMapNavigation,
  DEFAULT_COORDINATES
} from "../utils/geo.js";

export default function MapplsNavigationModal({ business, userCoords: initialCoords, onClose }) {
  const [userCoords, setUserCoords] = useState(initialCoords || DEFAULT_COORDINATES);
  const [gpsAccuracy, setGpsAccuracy] = useState(null); // in meters
  const [gpsStatus, setGpsStatus] = useState("requesting"); // "requesting" | "locked" | "acquiring" | "denied" | "unavailable" | "timeout" | "lost"
  const [gpsSpeed, setGpsSpeed] = useState(null); // in km/h
  const [lastGpsTimestamp, setLastGpsTimestamp] = useState(Date.now());
  const [navMode, setNavMode] = useState("driving"); // "driving" | "walking"
  const [isNavigating, setIsNavigating] = useState(false);
  const [isSimulatedDemo, setIsSimulatedDemo] = useState(false);
  const [demoProgress, setDemoProgress] = useState(0);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [originDistanceKm, setOriginDistanceKm] = useState(null);
  const [isOffRoute, setIsOffRoute] = useState(false);
  const [lastAnnouncedStep, setLastAnnouncedStep] = useState(-1);
  const [hasAnnouncedArrival, setHasAnnouncedArrival] = useState(false);

  const mapContainerRef = useRef(null);
  const watchIdRef = useRef(null);
  const prevPositionRef = useRef(null);
  const mapplsApiKey = import.meta.env.VITE_MAPPLS_API_KEY || "";

  const destLat = business?.latitude || DEFAULT_COORDINATES.lat;
  const destLng = business?.longitude || DEFAULT_COORDINATES.lng;
  const destName = business?.name || "Selected Business";
  const destAddress = business?.address || "City Center";

  // Speech helper with robust queue reset
  function speakText(text) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn("Speech synthesis error:", err);
    }
  }

  // Real GPS Geolocation Continuous Watcher
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsStatus("unavailable");
      return;
    }

    setGpsStatus("requesting");

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = Math.round(position.coords.accuracy || 10);
        const timestamp = position.timestamp || Date.now();
        let speedKmh = null;

        // Extract real GPS speed
        if (position.coords.speed !== null && position.coords.speed !== undefined && position.coords.speed >= 0) {
          speedKmh = Number((position.coords.speed * 3.6).toFixed(1));
        } else if (prevPositionRef.current) {
          const dtHours = (timestamp - prevPositionRef.current.time) / (1000 * 3600);
          if (dtHours > 0.0001) {
            const dKm = calculateDistance(prevPositionRef.current.lat, prevPositionRef.current.lng, lat, lng);
            if (dKm > 0.003) {
              speedKmh = Number((dKm / dtHours).toFixed(1));
            } else {
              speedKmh = 0; // stationary
            }
          }
        }

        prevPositionRef.current = { lat, lng, time: timestamp };
        setUserCoords({ lat, lng });
        setGpsAccuracy(accuracy);
        setGpsSpeed(speedKmh);
        setLastGpsTimestamp(timestamp);
        setGpsStatus("locked");
      },
      (err) => {
        console.warn("GPS Geolocation notice:", err.message);
        if (err.code === err.PERMISSION_DENIED) {
          setGpsStatus("denied");
        } else if (err.code === err.TIMEOUT) {
          setGpsStatus("timeout");
        } else {
          setGpsStatus("unavailable");
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 15000
      }
    );

    watchIdRef.current = watchId;

    return () => {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Real Calculated Route based on current GPS position
  const calculatedRoute = generateCalculatedRoute(
    userCoords.lat,
    userCoords.lng,
    destLat,
    destLng,
    destName,
    destAddress
  );

  // Evaluate REAL GPS navigation telemetry
  const gpsTelemetry = evaluateGpsNavigationProgress(
    userCoords.lat,
    userCoords.lng,
    calculatedRoute,
    originDistanceKm
  );

  // Dynamic values driven strictly by real GPS
  const remainingDistanceKm = isSimulatedDemo
    ? Math.max(0, calculatedRoute.totalDistanceKm * (1 - demoProgress))
    : gpsTelemetry.remainingDistanceKm;

  const currentStepIndex = isSimulatedDemo
    ? Math.min(
        calculatedRoute.segments.length - 1,
        Math.floor(demoProgress * calculatedRoute.segments.length)
      )
    : gpsTelemetry.currentStepIndex;

  const activeStep = calculatedRoute.segments[currentStepIndex] || calculatedRoute.segments[0];

  const metersToNextTurn = isSimulatedDemo
    ? Math.max(20, Math.round(activeStep.distanceMeters * (1 - (demoProgress % 0.25) * 4)))
    : gpsTelemetry.metersToNextManeuver;

  const progressRatio = isSimulatedDemo ? demoProgress : gpsTelemetry.progressRatio;
  const isArrived = isSimulatedDemo ? demoProgress >= 0.99 : gpsTelemetry.isArrived;

  // Travel Estimates (Calculated strictly from remaining distance and real speed)
  const { driveMinutes, walkMinutes } = calculateTravelEstimates(remainingDistanceKm, gpsSpeed, navMode);
  const totalEtaMinutes = navMode === "driving" ? driveMinutes : walkMinutes;

  // Speed Display
  let speedDisplay = "Speed unavailable";
  if (isSimulatedDemo) {
    speedDisplay = navMode === "driving" ? "42 km/h (Demo)" : "4.8 km/h (Demo)";
  } else if (gpsSpeed !== null) {
    speedDisplay = gpsSpeed === 0 ? "0 km/h (Stationary)" : `${gpsSpeed} km/h`;
  } else if (gpsStatus === "locked") {
    speedDisplay = "0 km/h (Stationary)";
  }

  // Handle Off-Route Detection & Voice Announcement
  useEffect(() => {
    if (isNavigating && !isSimulatedDemo && gpsTelemetry.isOffRoute && !isOffRoute) {
      setIsOffRoute(true);
      if (voiceEnabled) {
        speakText(`Off route. Recalculating route to ${destName}`);
      }
    } else if (!gpsTelemetry.isOffRoute && isOffRoute) {
      setIsOffRoute(false);
    }
  }, [isNavigating, isSimulatedDemo, gpsTelemetry.isOffRoute, isOffRoute, voiceEnabled, destName]);

  // Voice Guidance Announcement on REAL Turn Reached
  useEffect(() => {
    if (isNavigating && voiceEnabled && currentStepIndex !== lastAnnouncedStep && currentStepIndex >= 0) {
      setLastAnnouncedStep(currentStepIndex);
      if (activeStep?.instruction) {
        speakText(`In ${metersToNextTurn} meters, ${activeStep.instruction}`);
      }
    }
  }, [isNavigating, voiceEnabled, currentStepIndex, lastAnnouncedStep, activeStep, metersToNextTurn]);

  // Real Arrival Voice Trigger
  useEffect(() => {
    if (isNavigating && isArrived && !hasAnnouncedArrival) {
      setHasAnnouncedArrival(true);
      if (voiceEnabled) {
        speakText(`You have reached your destination: ${destName}. Welcome to ${destAddress}.`);
      }
    }
  }, [isNavigating, isArrived, hasAnnouncedArrival, voiceEnabled, destName, destAddress]);

  // Optional Demo Simulation Engine (Strictly isolated to Demo Mode)
  useEffect(() => {
    let interval = null;
    if (isNavigating && isSimulatedDemo) {
      interval = setInterval(() => {
        setDemoProgress((prev) => {
          if (prev >= 1) {
            clearInterval(interval);
            return 1;
          }
          return Math.min(1, prev + 0.01);
        });
      }, 500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isNavigating, isSimulatedDemo]);

  // Start Real Live Navigation
  function handleStartLiveNavigation() {
    if (gpsStatus === "denied") {
      alert("Location permission is required for live GPS navigation. Please enable location access in your browser or use external navigation.");
      return;
    }
    const initialDist = calculateDistance(userCoords.lat, userCoords.lng, destLat, destLng);
    setOriginDistanceKm(initialDist);
    setIsNavigating(true);
    setHasAnnouncedArrival(false);
    setLastAnnouncedStep(0);

    if (voiceEnabled) {
      speakText(`Starting live GPS navigation to ${destName}. In ${metersToNextTurn} meters, ${activeStep.instruction}`);
    }
  }

  // Start Simulated Demo Walkthrough (Explicitly Labeled)
  function handleStartDemoMode() {
    setIsSimulatedDemo(true);
    setDemoProgress(0.02);
    setIsNavigating(true);
    setHasAnnouncedArrival(false);
    setLastAnnouncedStep(0);
    if (voiceEnabled) {
      speakText(`Starting simulated demo route to ${destName}.`);
    }
  }

  function handleEndNavigation() {
    setIsNavigating(false);
    setIsSimulatedDemo(false);
    setDemoProgress(0);
    setLastAnnouncedStep(-1);
    setHasAnnouncedArrival(false);
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }

  function handleRecalculate() {
    const initialDist = calculateDistance(userCoords.lat, userCoords.lng, destLat, destLng);
    setOriginDistanceKm(initialDist);
    setLastAnnouncedStep(-1);
    if (voiceEnabled) {
      speakText(`Recalculating route from current GPS location to ${destName}.`);
    }
  }

  function handleToggleVoice(e) {
    if (e) e.stopPropagation();
    const nextState = !voiceEnabled;
    setVoiceEnabled(nextState);

    if (!nextState) {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    } else {
      const instruction = activeStep?.instruction || `Heading to ${destName}`;
      speakText(`Voice guidance unmuted. ${instruction}`);
    }
  }

  function handleRetryGps() {
    setGpsStatus("requesting");
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setGpsAccuracy(Math.round(pos.coords.accuracy || 10));
          setGpsStatus("locked");
        },
        () => setGpsStatus("denied"),
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  }

  function handleStartMapplsNavExternal() {
    openMapplsNavigation(userCoords.lat, userCoords.lng, destLat, destLng, destAddress, destName);
  }

  function handleStartGoogleNav() {
    openMapNavigation(destLat, destLng, destAddress, destName);
  }

  // Calculate vehicle marker position along curve
  const t = Math.max(0, Math.min(1, progressRatio));
  const p0 = { x: 60, y: 130 };
  const p1 = { x: 130, y: 40 };
  const p2 = { x: 250, y: 160 };
  const p3 = { x: 340, y: 45 };

  const markerX =
    Math.pow(1 - t, 3) * p0.x +
    3 * Math.pow(1 - t, 2) * t * p1.x +
    3 * (1 - t) * Math.pow(t, 2) * p2.x +
    Math.pow(t, 3) * p3.x;

  const markerY =
    Math.pow(1 - t, 3) * p0.y +
    3 * Math.pow(1 - t, 2) * t * p1.y +
    3 * (1 - t) * Math.pow(t, 2) * p2.y +
    Math.pow(t, 3) * p3.y;

  return (
    <div className="mappls-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className={`mappls-modal-card ${isNavigating ? "active-navigation-mode" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Title & GPS Status */}
        <div className="mappls-modal-header">
          <div className="mappls-header-title">
            <div className="mappls-brand-tag">
              <Compass size={16} className="compass-spin" />
              <span>{isNavigating ? (isSimulatedDemo ? "DEMO SIMULATION ACTIVE" : "REAL GPS LIVE NAVIGATION") : "MAPPLS GPS NAVIGATION"}</span>
            </div>
            <h3>{isNavigating ? `Navigating to ${destName}` : `Route to ${destName}`}</h3>
            <p className="mappls-dest-sub">
              <MapPin size={14} /> {destAddress}
            </p>
          </div>
          <button className="mappls-close-btn" onClick={onClose} aria-label="Close navigation modal">
            <X size={18} />
          </button>
        </div>

        {/* Real GPS Status Banner */}
        <div className={`gps-telemetry-strip ${gpsStatus}`}>
          <div className="gps-status-dot-wrap">
            <span className={`gps-dot ${gpsStatus}`} />
            <strong className="gps-status-title">
              {gpsStatus === "locked" && `GPS Locked (${gpsAccuracy ? `±${gpsAccuracy}m` : "High Accuracy"})`}
              {gpsStatus === "requesting" && "Acquiring GPS Signal..."}
              {gpsStatus === "timeout" && "GPS Signal Weak / Timeout"}
              {gpsStatus === "denied" && "GPS Permission Denied"}
              {gpsStatus === "unavailable" && "GPS Sensor Unavailable"}
            </strong>
          </div>
          <div className="gps-coords-readout">
            <span>Lat: {userCoords.lat.toFixed(4)}, Lng: {userCoords.lng.toFixed(4)}</span>
          </div>
        </div>

        {/* Permission Denied Warning & Action */}
        {gpsStatus === "denied" && (
          <div className="mappls-gps-notice alert-danger">
            <AlertTriangle size={16} />
            <div className="notice-body">
              <strong>Location permission is required for live navigation.</strong>
              <p>Please allow location access in your browser settings, or retry below.</p>
              <button type="button" className="button ghost tiny" onClick={handleRetryGps}>
                <RotateCcw size={12} /> Retry Location Permission
              </button>
            </div>
          </div>
        )}

        {/* Off-Route Alert Banner */}
        {isOffRoute && !isSimulatedDemo && (
          <div className="off-route-warning-banner">
            <AlertCircle size={16} className="alert-pulse" />
            <span>Off route detected (&gt;150m from road corridor). Recalculating route...</span>
          </div>
        )}

        {/* Destination Arrival Banner */}
        {isArrived && (
          <div className="destination-arrival-banner">
            <CheckCircle2 size={20} className="arrival-icon" />
            <div className="arrival-text">
              <strong>Destination Reached!</strong>
              <span>You are at {destName}. Check your token status below.</span>
            </div>
          </div>
        )}

        {/* Mode Selector & Quick Metrics (When not navigating) */}
        {!isNavigating ? (
          <div className="mappls-route-bar">
            <div className="mappls-mode-toggles">
              <button
                type="button"
                className={`mappls-mode-btn ${navMode === "driving" ? "active" : ""}`}
                onClick={() => setNavMode("driving")}
              >
                <Car size={16} />
                <span>Driving</span>
                <strong>{driveMinutes} min</strong>
              </button>
              <button
                type="button"
                className={`mappls-mode-btn ${navMode === "walking" ? "active" : ""}`}
                onClick={() => setNavMode("walking")}
              >
                <Footprints size={16} />
                <span>Walking</span>
                <strong>{walkMinutes} min</strong>
              </button>
            </div>

            <div className="mappls-metric-summary">
              <div className="summary-pill">
                <Route size={14} />
                <span>Distance: <strong>{formatDistance(remainingDistanceKm)}</strong></span>
              </div>
              <div className="summary-pill eta-pill">
                <LocateFixed size={14} />
                <span>ETA: <strong>~{totalEtaMinutes} mins</strong></span>
              </div>
              <button
                type="button"
                className={`summary-pill voice-toggle-pill ${voiceEnabled ? "voice-active" : "voice-muted"}`}
                onClick={handleToggleVoice}
                title={voiceEnabled ? "Click to Mute Voice Guidance" : "Click to Unmute Voice Guidance"}
                aria-label={voiceEnabled ? "Mute voice guidance" : "Unmute voice guidance"}
              >
                {voiceEnabled ? <Volume2 size={14} className="voice-icon-pulse" /> : <VolumeX size={14} />}
                <span>Voice: <strong>{voiceEnabled ? "ON" : "MUTED"}</strong></span>
              </button>
            </div>
          </div>
        ) : (
          /* Live Navigation Top HUD Cockpit Banner */
          <div className="nav-hud-banner">
            <div className="hud-turn-icon-box">
              {activeStep.turn === "right" && <CornerUpRight size={26} />}
              {activeStep.turn === "left" && <CornerUpLeft size={26} />}
              {activeStep.turn === "slight-right" && <ArrowUpRight size={26} />}
              {activeStep.turn === "arrive" && <CheckCircle2 size={26} />}
              {activeStep.turn === "straight" && <Navigation size={26} />}
            </div>
            <div className="hud-instruction-col">
              <span className="hud-next-dist">
                {isArrived ? "ARRIVED" : `In ${metersToNextTurn} m`}
              </span>
              <strong className="hud-main-instruction">{activeStep.instruction}</strong>
              <small className="hud-street-tag">{activeStep.street}</small>
            </div>
            <div className="hud-audio-control">
              <button
                type="button"
                className={`hud-icon-btn ${voiceEnabled ? "active" : "muted"}`}
                onClick={handleToggleVoice}
                title={voiceEnabled ? "Click to Mute Voice Guidance" : "Click to Unmute Voice Guidance"}
                aria-label={voiceEnabled ? "Mute voice guidance" : "Unmute voice guidance"}
              >
                {voiceEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                <span className="hud-icon-btn-label">{voiceEnabled ? "MUTE" : "UNMUTE"}</span>
              </button>
            </div>
          </div>
        )}

        {/* Interactive Zoomed Map / Route Canvas Visualizer */}
        <div className={`mappls-map-canvas-container ${isNavigating ? "zoomed-in" : ""}`}>
          <div className={`mappls-vector-radar-view ${isNavigating ? "nav-3d-perspective" : ""}`}>
            <div className="radar-grid-lines" />

            {/* Origin / Current User GPS Pin */}
            <div className="radar-pin origin">
              <div className="radar-pulse" />
              <div className="pin-dot start" />
              {!isNavigating && (
                <div className="pin-tooltip">
                  <strong>Your GPS Location</strong>
                  <small>{gpsStatus === "locked" ? `Accurate to ±${gpsAccuracy || 10}m` : "Acquiring..."}</small>
                </div>
              )}
            </div>

            {/* Connecting Route Track */}
            <svg className="radar-route-svg" viewBox="0 0 400 180" preserveAspectRatio="none">
              <path
                d="M 60 130 C 130 40, 250 160, 340 45"
                fill="none"
                stroke="rgba(255, 255, 255, 0.14)"
                strokeWidth="10"
                strokeLinecap="round"
              />
              <path
                d="M 60 130 C 130 40, 250 160, 340 45"
                fill="none"
                stroke="var(--brand)"
                strokeWidth="6"
                strokeLinecap="round"
                className={isNavigating ? "route-animated-path-fast" : "route-animated-path"}
              />
              <circle cx="150" cy="80" r="4" fill="var(--accent)" />
              <circle cx="270" cy="115" r="4" fill="var(--accent)" />
            </svg>

            {/* Real Moving GPS Vehicle Marker (Moves when GPS changes) */}
            {isNavigating && (
              <div
                className="nav-live-vehicle-marker"
                style={{
                  left: `${(markerX / 400) * 100}%`,
                  top: `${(markerY / 180) * 100}%`
                }}
              >
                <div className="vehicle-pulse-ring" />
                <div className="vehicle-arrow-icon">
                  <Navigation size={15} />
                </div>
              </div>
            )}

            {/* Destination Pin */}
            <div className="radar-pin destination">
              <div className="pin-dot end">
                <MapPin size={16} />
              </div>
              <div className="pin-tooltip dest">
                <strong>{destName}</strong>
                <small>{destAddress}</small>
              </div>
            </div>

            {/* Cockpit Overlay Badges */}
            {isNavigating && (
              <div className="nav-cockpit-overlay-pills">
                <span className="cockpit-pill"><Gauge size={12} /> {speedDisplay}</span>
                <span className="cockpit-pill"><Clock size={12} /> ETA ~{totalEtaMinutes} min</span>
                <span className="cockpit-pill">
                  <Radio size={12} className={gpsStatus === "locked" ? "text-emerald" : "text-amber"} />
                  {gpsStatus === "locked" ? "Real GPS Lock" : "GPS Acquiring"}
                </span>
                {isSimulatedDemo && (
                  <span className="cockpit-pill demo-warning-pill">
                    <Sparkles size={12} /> DEMO SIMULATION
                  </span>
                )}
              </div>
            )}

            <div className="radar-watermark">
              <ShieldCheck size={13} />
              <span>Powered by Mappls Real GPS Engine</span>
            </div>
          </div>
        </div>

        {/* Navigation Step Breakdown or Live Cockpit Controls */}
        {!isNavigating ? (
          <div className="mappls-route-steps">
            {calculatedRoute.segments.map((seg, idx) => (
              <div className={`route-step-item ${idx === calculatedRoute.segments.length - 1 ? "destination-step" : ""}`} key={seg.id}>
                <div className={`step-number ${idx === calculatedRoute.segments.length - 1 ? "dest" : ""}`}>
                  {idx === calculatedRoute.segments.length - 1 ? "✓" : idx + 1}
                </div>
                <div className="step-info">
                  <span>{seg.instruction}</span>
                  <small>{seg.street} &bull; {seg.distanceMeters}m</small>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Live Active Navigation Cockpit Bar */
          <div className="nav-active-cockpit-dashboard">
            <div className="cockpit-metrics-grid">
              <div className="cockpit-metric-tile">
                <span className="tile-label">REAL REMAINING DISTANCE</span>
                <strong className="tile-value">{formatDistance(remainingDistanceKm)}</strong>
              </div>
              <div className="cockpit-metric-tile">
                <span className="tile-label">REAL ETA</span>
                <strong className="tile-value eta">~{totalEtaMinutes} min</strong>
              </div>
              <div className="cockpit-metric-tile">
                <span className="tile-label">REAL SPEED</span>
                <strong className="tile-value">{speedDisplay}</strong>
              </div>
            </div>

            {/* Token safety banner while traveling */}
            <div className="nav-token-sync-badge">
              <CheckCircle2 size={15} />
              <span>QueLess Token #<strong>{business?.current_token || 39}</strong> progress is synchronized with your journey.</span>
            </div>
          </div>
        )}

        {/* Action Buttons: Start Navigation vs End Navigation */}
        <div className="mappls-modal-actions">
          {!isNavigating ? (
            <>
              <button
                type="button"
                className="button primary full mappls-main-action"
                onClick={handleStartLiveNavigation}
                disabled={gpsStatus === "denied"}
              >
                <Navigation size={18} />
                <span>Start Real GPS Live Navigation</span>
              </button>

              <div className="mappls-sub-actions-row">
                <button
                  type="button"
                  className="button secondary ghost small full"
                  onClick={handleStartMapplsNavExternal}
                >
                  <Compass size={14} /> Open in Mappls App
                  <ExternalLink size={12} />
                </button>
                <button
                  type="button"
                  className="button secondary ghost small full"
                  onClick={handleStartGoogleNav}
                >
                  Open in Google Maps
                </button>
              </div>

              {/* Explicit Separated Simulated Demo Mode */}
              <div className="demo-mode-trigger-box">
                <button
                  type="button"
                  className="button ghost tiny demo-trigger-btn"
                  onClick={handleStartDemoMode}
                  title="Run simulated route demo without physical motion"
                >
                  <Play size={12} /> Run Simulated Route Demo (Presentation Mode)
                </button>
              </div>
            </>
          ) : (
            <div className="nav-live-actions-row">
              <button
                type="button"
                className="button secondary full end-nav-btn"
                onClick={handleEndNavigation}
              >
                <X size={16} />
                <span>End Navigation</span>
              </button>
              <button
                type="button"
                className={`button ghost small ${!voiceEnabled ? "cockpit-btn-muted" : ""}`}
                onClick={handleToggleVoice}
                title={voiceEnabled ? "Mute Voice Guidance" : "Unmute Voice Guidance"}
              >
                {voiceEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
                <span>{voiceEnabled ? "Mute" : "Unmute"}</span>
              </button>
              <button
                type="button"
                className="button ghost small"
                onClick={handleRecalculate}
                title="Recalculate Route from Current GPS"
              >
                <RotateCcw size={15} /> Recalculate
              </button>
              <button
                type="button"
                className="button ghost small"
                onClick={handleStartMapplsNavExternal}
                title="Open in external Mappls App"
              >
                <ExternalLink size={15} /> External
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
