import { Users, Clock, AlertTriangle, CheckCircle2, TrendingUp } from "lucide-react";

export default function RushHourMeter({ waitingCount = 0, averageDuration = 10, openingTime, closingTime }) {
  const currentHour = new Date().getHours();
  const isPeakTime = currentHour >= 11 && currentHour <= 15;
  const totalWaitEstimate = waitingCount * averageDuration;

  let crowdLevel = "Calm";
  let crowdClass = "calm";
  let advice = "Great time to visit with minimal waiting time.";

  if (waitingCount > 8 || totalWaitEstimate > 40) {
    crowdLevel = "High Congestion";
    crowdClass = "high";
    advice = "Peak waiting period. Consider our Smart Recommendation alternative or booking an off-peak slot.";
  } else if (waitingCount > 3 || totalWaitEstimate > 15) {
    crowdLevel = "Moderate Traffic";
    crowdClass = "moderate";
    advice = "Steady customer flow. Remote queue booking recommended before heading over.";
  } else if (waitingCount === 0) {
    crowdLevel = "No Wait";
    crowdClass = "calm";
    advice = "No one waiting right now. Immediate service available upon arrival.";
  }

  // When 0 people are in line, the meter bar must be 0% (empty track)
  const fillPercent = waitingCount === 0 
    ? 0 
    : Math.min(100, Math.max(12, Math.round((totalWaitEstimate / 60) * 100)));

  return (
    <div className={`rush-hour-meter-card crowd-${crowdClass}`}>
      <div className="meter-top-strip">
        <div className="meter-title-wrap">
          <TrendingUp size={16} className="meter-icon" />
          <span>LIVE CROWD DENSITY & RUSH HOUR METER</span>
        </div>
        <span className={`crowd-badge ${crowdClass}`}>{crowdLevel.toUpperCase()}</span>
      </div>

      <div className="meter-bar-track">
        <div
          className={`meter-bar-fill ${crowdClass}`}
          style={{ width: `${fillPercent}%` }}
        />
      </div>

      <div className="meter-stats-row">
        <div className="meter-stat-item">
          <Users size={14} />
          <span>Currently In Line: <strong>{waitingCount} people</strong></span>
        </div>
        <div className="meter-stat-item">
          <Clock size={14} />
          <span>Estimated Turn Delay: <strong>~{totalWaitEstimate} mins</strong></span>
        </div>
      </div>

      <p className="meter-advice-text">
        {advice}
      </p>
    </div>
  );
}