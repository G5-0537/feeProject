import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Maximize2, Minimize2, Volume2, VolumeX, ArrowLeft, Clock, Sparkles } from 'lucide-react';
import { apiRequest } from '../services/api.js';
import { announceToken, playChimeTone } from '../utils/audio.js';

export default function PublicDisplay() {
  const { businessId = '1' } = useParams();
  const [business, setBusiness] = useState(null);
  const [services, setServices] = useState([]);
  const [activeQueue, setActiveQueue] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const lastAnnouncedTokens = useRef({});

  // Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Poll data
  useEffect(() => {
    let alive = true;

    async function fetchData() {
      try {
        const [bizData, queueData] = await Promise.all([
          apiRequest(`/businesses/${businessId}`),
          apiRequest('/staff/queue', { staff: true }).catch(() => [])
        ]);

        if (!alive) return;
        setBusiness(bizData.business);
        setServices(bizData.services || []);

        // Filter queue for this business
        const relevantQueue = Array.isArray(queueData)
          ? queueData.filter((q) => !q.business_id || q.business_id === Number(businessId))
          : [];
        setActiveQueue(relevantQueue);

        // Check for newly serving tokens to announce
        if (bizData.services) {
          bizData.services.forEach((srv) => {
            if (srv.current_token && srv.current_token > 0) {
              const prev = lastAnnouncedTokens.current[srv.service_id];
              if (prev !== undefined && prev !== srv.current_token) {
                if (audioEnabled) {
                  playChimeTone();
                  setTimeout(() => {
                    announceToken(srv.current_token, 1, srv.service_name);
                  }, 400);
                }
              }
              lastAnnouncedTokens.current[srv.service_id] = srv.current_token;
            }
          });
        }
      } catch (err) {
        console.error('Error fetching public display data', err);
      }
    }

    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, [businessId, audioEnabled]);

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }

  function handleEnableAudio() {
    setAudioEnabled(!audioEnabled);
    if (!audioEnabled) {
      playChimeTone();
    }
  }

  const servingList = services.filter((s) => s.current_token > 0);
  const waitingList = activeQueue.filter((q) => ['Waiting', 'Approaching', 'waiting', 'approaching'].includes(q.status));

  return (
    <div className="public-tv-screen">
      <header className="tv-header">
        <div className="tv-brand">
          <Link to="/" className="tv-back-link" title="Exit TV View">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1>{business?.name || 'QueLess Live Waiting Display'}</h1>
            <p>{business?.address || 'Live Queue & Counter Callout System'}</p>
          </div>
        </div>

        <div className="tv-header-right">
          <div className="tv-clock">
            <Clock size={18} />
            <span>
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
          <button
            className={`tv-control-btn ${audioEnabled ? 'active' : ''}`}
            onClick={handleEnableAudio}
            title={audioEnabled ? 'Voice Announcements On' : 'Voice Announcements Off'}
          >
            {audioEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            <span>{audioEnabled ? 'Voice On' : 'Voice Off'}</span>
          </button>
          <button className="tv-control-btn" onClick={toggleFullscreen} title="Toggle Fullscreen">
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>
      </header>

      <main className="tv-main-grid">
        <section className="tv-serving-section">
          <div className="tv-section-title">
            <span className="live-indicator"><span className="pulse-dot" /> NOW SERVING</span>
            <small>Please proceed to your respective counter</small>
          </div>

          <div className="tv-tokens-grid">
            {servingList.length > 0 ? (
              servingList.map((service, idx) => (
                <div className="tv-token-card" key={service.service_id}>
                  <div className="tv-card-header">
                    <span className="tv-counter-tag">Counter {idx + 1}</span>
                    <span className="tv-service-tag">{service.service_name}</span>
                  </div>
                  <div className="tv-token-big">
                    <span className="token-hash">#</span>
                    <span className="token-digits">{service.current_token}</span>
                  </div>
                  <div className="tv-card-footer">
                    <span>Active Now</span>
                    <Sparkles size={16} className="sparkle-icon" />
                  </div>
                </div>
              ))
            ) : (
              <div className="tv-token-card idle">
                <div className="tv-card-header">
                  <span className="tv-counter-tag">Main Counter</span>
                </div>
                <div className="tv-token-big idle-text">READY</div>
                <div className="tv-card-footer"><span>Calling next customer shortly</span></div>
              </div>
            )}
          </div>
        </section>

        <aside className="tv-upcoming-section">
          <div className="tv-section-title">
            <span>UPCOMING TICKETS</span>
            <small>Approaching &amp; Next in Line</small>
          </div>

          <div className="tv-queue-list">
            {waitingList.length > 0 ? (
              waitingList.slice(0, 8).map((item) => (
                <div className={`tv-queue-row ${item.status === 'Approaching' ? 'approaching' : ''}`} key={item.entry_id}>
                  <div className="tv-row-token">#{item.token_number}</div>
                  <div className="tv-row-info">
                    <strong>{item.customer_name || 'Guest Customer'}</strong>
                    <span>{item.service_name}</span>
                  </div>
                  <span className={`tv-badge ${item.status === 'Approaching' ? 'approaching' : 'waiting'}`}>
                    {item.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="tv-empty-queue">
                <p>No waiting tickets in queue right now.</p>
              </div>
            )}
          </div>
        </aside>
      </main>

      <footer className="tv-footer">
        <span>Powered by QueLess Digital Waiting Management</span>
        <span>Scan QR code at entrance or visit online to book tokens remotely</span>
      </footer>
    </div>
  );
}
