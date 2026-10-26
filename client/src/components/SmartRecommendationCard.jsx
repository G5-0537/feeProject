import { useState } from 'react';
import { Zap, Navigation, ArrowRight, Clock, Users, MapPin, X, CheckCircle2, Compass } from 'lucide-react';
import { openMapplsNavigation, openMapNavigation, formatDistance } from '../utils/geo.js';

export default function SmartRecommendationCard({
  currentBranch,
  recommendation,
  onSelectAlternative,
  onJoinAlternative,
  onNavigateAlternative,
  onDismiss
}) {
  const [dismissed, setDismissed] = useState(false);

  if (!recommendation || dismissed) return null;

  const {
    alternative_branch_id,
    alternative_name,
    alternative_branch_name,
    alternative_address,
    distance_km,
    distance_basis,
    current_wait_text,
    current_people_ahead,
    alternative_wait_text,
    alternative_people_ahead,
    time_saved_minutes,
    travel_included,
    current_travel_minutes,
    alternative_travel_minutes,
    current_total_minutes,
    alternative_total_minutes,
    service_name,
    latitude,
    longitude
  } = recommendation;

  function handleDismiss() {
    setDismissed(true);
    if (onDismiss) onDismiss();
  }

  function handleNavigate() {
    if (onNavigateAlternative) {
      onNavigateAlternative({
        business_id: alternative_branch_id,
        name: alternative_name,
        address: alternative_address,
        latitude,
        longitude
      });
    } else {
      openMapplsNavigation(null, null, latitude, longitude, alternative_address, alternative_name);
    }
  }


  return (
    <div className="smart-recommendation-card" role="region" aria-label="Smart Queue Recommendation">
      <div className="rec-header">
        <div className="rec-badge">
          <Zap size={15} className="zap-pulse" />
          <span>FASTER {service_name || 'SERVICE'} OPTION</span>
        </div>
        <button className="rec-close-btn" onClick={handleDismiss} title="Dismiss recommendation and stay with current branch" aria-label="Dismiss recommendation">
          <X size={16} />
        </button>
      </div>

      <div className="rec-comparison-grid">
        {/* Current Branch Column */}
        <div className="rec-branch-box current">
          <div className="rec-box-tag">Current selection</div>
          <h4>{currentBranch?.name || 'Selected Location'}</h4>
          <div className="rec-metrics">
            <span className="rec-metric-item wait-high">
              <Clock size={13} /> {current_wait_text || '45–55 min'}
            </span>
            <span className="rec-metric-item">
              <Users size={13} /> {current_people_ahead || 0} ahead
            </span>
            {travel_included && (
              <span className="rec-metric-item"><Navigation size={13} /> ~{current_travel_minutes} min drive</span>
            )}
          </div>
          {travel_included && <small className="rec-total-line">Wait + drive: ~{current_total_minutes} min</small>}
        </div>

        {/* VS Indicator */}
        <div className="rec-vs-divider">
          <span className="vs-circle">VS</span>
        </div>

        {/* Recommended Alternative Branch Column */}
        <div className="rec-branch-box recommended">
          <div className="rec-box-tag best-tag">
            <CheckCircle2 size={12} /> Recommended nearby
          </div>
          <h4>{alternative_name}</h4>
          <div className="rec-location-line">
            <MapPin size={13} /> {formatDistance(distance_km)} from {distance_basis || 'your location'} &bull; {alternative_address}
          </div>
          <div className="rec-metrics">
            <span className="rec-metric-item wait-low">
              <Clock size={13} /> {alternative_wait_text || '10–15 min'}
            </span>
            <span className="rec-metric-item">
              <Users size={13} /> {alternative_people_ahead || 0} ahead
            </span>
            {travel_included && (
              <span className="rec-metric-item"><Navigation size={13} /> ~{alternative_travel_minutes} min drive</span>
            )}
          </div>
          {travel_included && <small className="rec-total-line">Wait + drive: ~{alternative_total_minutes} min</small>}
        </div>
      </div>

      {/* Time Saved Highlight */}
      <div className="rec-savings-banner">
        <span className="savings-highlight">
          {travel_included ? (
            <>Estimated total visit time is <strong>~{time_saved_minutes} minutes shorter</strong> at {alternative_branch_name || alternative_name}, including approximate drive time. {service_name ? `Compared for ${service_name}.` : ''}</>
          ) : (
            <>The <strong>{service_name || 'selected'} queue is estimated to be ~{time_saved_minutes} minutes shorter</strong> at {alternative_branch_name || alternative_name}. Travel time is not included because your location is unavailable.</>
          )}
        </span>
      </div>

      {/* CTAs */}
      <div className="rec-actions">
        {onSelectAlternative && (
          <button className="button small primary" onClick={() => onSelectAlternative(alternative_branch_id)}>
            View Branch <ArrowRight size={14} />
          </button>
        )}
        {onJoinAlternative && (
          <button className="button small secondary" onClick={() => onJoinAlternative(alternative_branch_id)}>
            Join This Queue
          </button>
        )}
        <button className="button small ghost" onClick={handleNavigate} title="Open Google Maps / GPS Navigation">
          <Navigation size={14} /> Navigate
        </button>
        <button className="button-text small" onClick={handleDismiss}>
          Stay with current branch
        </button>
      </div>
    </div>
  );
}
