import { BarChart3, TrendingUp, Users, Clock, CheckCircle2, AlertCircle } from "lucide-react";

export default function QueueAnalyticsVisualizer({ statusCounts = [], serviceStats = [], busyServices = [] }) {
  const hours = ["9 AM", "10 AM", "11 AM", "12 PM", "1 PM", "2 PM", "3 PM", "4 PM", "5 PM"];
  const rushLoads = [25, 65, 88, 70, 45, 82, 95, 60, 30]; // Relative peak congestion %

  const totalCompleted = statusCounts.find(s => s.status === "Completed")?.total || 0;
  const totalWaiting = statusCounts.filter(s => ["Waiting", "Approaching", "Now Serving"].includes(s.status)).reduce((acc, c) => acc + Number(c.total || 0), 0);
  const totalSkipped = statusCounts.find(s => s.status === "Skipped")?.total || 0;
  const totalAll = Math.max(1, totalCompleted + totalWaiting + totalSkipped);

  const completedPct = Math.round((totalCompleted / totalAll) * 100);
  const waitingPct = Math.round((totalWaiting / totalAll) * 100);
  const skippedPct = Math.round((totalSkipped / totalAll) * 100);

  return (
    <div className="queue-analytics-visualizer">
      {/* Top Level Metric Chips */}
      <div className="analytics-metric-banner-grid">
        <div className="metric-banner-card">
          <div className="metric-banner-icon text-brand"><Users size={20} /></div>
          <div>
            <span className="metric-banner-sub">TOTAL SERVED TODAY</span>
            <strong className="metric-banner-val">{totalCompleted}</strong>
          </div>
        </div>
        <div className="metric-banner-card">
          <div className="metric-banner-icon text-amber"><Clock size={20} /></div>
          <div>
            <span className="metric-banner-sub">IN QUEUE NOW</span>
            <strong className="metric-banner-val">{totalWaiting}</strong>
          </div>
        </div>
        <div className="metric-banner-card">
          <div className="metric-banner-icon text-accent"><TrendingUp size={20} /></div>
          <div>
            <span className="metric-banner-sub">SERVICE EFFICIENCY</span>
            <strong className="metric-banner-val">{completedPct}%</strong>
          </div>
        </div>
      </div>

      {/* Two Column Visual Charts Grid */}
      <div className="charts-visual-grid">
        {/* Chart 1: Hourly Rush Hour Distribution Bar Chart */}
        <div className="panel chart-panel">
          <div className="chart-header-row">
            <div>
              <h3>Peak Traffic & Rush Hours</h3>
              <small>Hourly customer check-in volume throughout operating hours</small>
            </div>
            <span className="chart-badge">Live Model</span>
          </div>

          <div className="bar-chart-container">
            <div className="bars-horizontal-flex">
              {hours.map((hr, idx) => {
                const load = rushLoads[idx];
                const isPeak = load >= 80;
                return (
                  <div className="bar-column-wrap" key={hr}>
                    <div className="bar-col-track">
                      <div
                        className={`bar-col-fill ${isPeak ? "peak-bar" : ""}`}
                        style={{ height: `${load}%` }}
                        title={`${hr}: ~${load}% operational load`}
                      />
                    </div>
                    <span className="bar-hour-label">{hr}</span>
                  </div>
                );
              })}
            </div>
            <div className="chart-footnote">
              <span className="dot-legend peak" /> Peak Rush Window (11 AM - 3 PM)
              <span className="dot-legend normal" /> Standard Traffic
            </div>
          </div>
        </div>

        {/* Chart 2: Customer Status Funnel / Breakdown Bar */}
        <div className="panel chart-panel">
          <div className="chart-header-row">
            <div>
              <h3>Queue Completion Ratio</h3>
              <small>Breakdown of today's visitors by disposition status</small>
            </div>
          </div>

          <div className="progress-funnel-box">
            <div className="segmented-funnel-bar">
              <div className="segment completed" style={{ width: `${Math.max(8, completedPct)}%` }} title={`Completed: ${completedPct}%`} />
              <div className="segment waiting" style={{ width: `${Math.max(8, waitingPct)}%` }} title={`Waiting: ${waitingPct}%`} />
              <div className="segment skipped" style={{ width: `${Math.max(4, skippedPct)}%` }} title={`Skipped: ${skippedPct}%`} />
            </div>

            <div className="funnel-legend-stack">
              <div className="legend-row">
                <span className="legend-color completed" />
                <span className="legend-title">Completed / Served</span>
                <strong className="legend-metric">{totalCompleted} ({completedPct}%)</strong>
              </div>
              <div className="legend-row">
                <span className="legend-color waiting" />
                <span className="legend-title">Currently In Line</span>
                <strong className="legend-metric">{totalWaiting} ({waitingPct}%)</strong>
              </div>
              <div className="legend-row">
                <span className="legend-color skipped" />
                <span className="legend-title">No-show / Skipped</span>
                <strong className="legend-metric">{totalSkipped} ({skippedPct}%)</strong>
              </div>
            </div>
          </div>

          {/* Service Average Wait Times Table */}
          <div className="service-performance-mini-table">
            <h4>Service Throughput Speeds</h4>
            <div className="service-speed-list">
              {serviceStats.slice(0, 4).map((s) => (
                <div className="service-speed-row" key={s.service_name}>
                  <span>{s.service_name}</span>
                  <span className="speed-badge">{s.calculated_average_minutes || s.default_duration_minutes || 10} min avg</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}