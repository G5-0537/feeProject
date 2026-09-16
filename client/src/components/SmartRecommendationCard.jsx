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
    alternative_address,
    distance_km,
    current_wait_text,
    current_people_ahead,
    alternative_wait_text,
    alternative_people_ahead,
    time_saved_minutes,
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
          <span>LONG WAIT DETECTED</span>
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
          </div>
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
            <MapPin size={13} /> {formatDistance(distance_km)} away &bull; {alternative_address}
          </div>
          <div className="rec-metrics">
            <span className="rec-metric-item wait-low">
              <Clock size={13} /> {alternative_wait_text || '10–15 min'}
            </span>
            <span className="rec-metric-item">
              <Users size={13} /> {alternative_people_ahead || 0} ahead
            </span>
          </div>
        </div>
      </div>

      {/* Time Saved Highlight */}
      <div className="rec-savings-banner">
        <span className="savings-highlight">
          Save approximately <strong>~{time_saved_minutes || 35} minutes</strong> by visiting the {alternative_name.split('–')[1] || alternative_name} branch.
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
