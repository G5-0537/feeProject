import { useEffect, useRef, useState } from "react";
import { Download, Share2, Check, Sparkles, ShieldCheck, Clock, MapPin, Ticket, Building, BellRing } from "lucide-react";
import QRCodePass from "./QRCodePass.jsx";
import { playChimeTone } from "../utils/audio.js";

export default function DigitalTokenBoardingPass({ snapshot, onNavigate }) {
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const passRef = useRef(null);

  if (!snapshot) return null;

  const tokenNumber = snapshot.token_number || snapshot.current_token || "0";
  const businessName = snapshot.business_name || "QueLess Partner";
  const serviceName = snapshot.service_name || "Standard Service";
  const status = snapshot.status || "Waiting";
  const peopleAhead = snapshot.people_ahead ?? 0;
  const estimatedWait = snapshot.estimated_wait || "5-10 mins";
  const currentToken = snapshot.current_token || 0;
  const joinedTime = snapshot.joined_at ? new Date(snapshot.joined_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Just now";

  function handleShare() {
    const text = `🎫 QueLess Live Token Pass\nBusiness: ${businessName}\nService: ${serviceName}\nToken Number: #${tokenNumber}\nNow Serving: #${currentToken}\nPeople Ahead: ${peopleAhead}\nTrack Live: ${window.location.href}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  function handleDownloadPass() {
    setIsDownloading(true);
    playChimeTone();
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const width = 800;
      const height = 1050;
      canvas.width = width;
      canvas.height = height;

      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, "#0a0d14");
      bgGrad.addColorStop(1, "#111827");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = "#1e293b";
      ctx.strokeStyle = "#334155";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(40, 40, width - 80, height - 80, 28);
      ctx.fill();
      ctx.stroke();

      const headerGrad = ctx.createLinearGradient(40, 40, width - 40, 160);
      headerGrad.addColorStop(0, "#0f8f83");
      headerGrad.addColorStop(1, "#14b8a6");
      ctx.fillStyle = headerGrad;
      ctx.beginPath();
      ctx.roundRect(40, 40, width - 80, 120, [28, 28, 0, 0]);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 36px sans-serif";
      ctx.fillText("QueLess Priority Pass", 70, 100);
      ctx.font = "20px sans-serif";
      ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
      ctx.fillText("OFFICIAL DIGITAL QUEUE VERIFICATION", 70, 134);

      ctx.fillStyle = "#f8fafc";
      ctx.font = "bold 32px sans-serif";
      ctx.fillText(businessName, 70, 225);
      ctx.fillStyle = "#94a3b8";
      ctx.font = "22px sans-serif";
      ctx.fillText(serviceName, 70, 260);

      ctx.fillStyle = "#0f172a";
      ctx.strokeStyle = "#0f8f83";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(70, 300, width - 140, 190, 20);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#14b8a6";
      ctx.font = "bold 22px sans-serif";
      ctx.fillText("YOUR CONFIRMED TOKEN", 100, 345);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 96px sans-serif";
      ctx.fillText(`#${tokenNumber}`, 100, 445);

      ctx.fillStyle = status === "Now Serving" ? "#10b981" : "#f59e0b";
      ctx.beginPath();
      ctx.roundRect(width - 340, 340, 230, 46, 23);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 20px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(status.toUpperCase(), width - 225, 372);
      ctx.textAlign = "left";

      const colW = (width - 140) / 3;
      const metricY = 550;

      ctx.fillStyle = "#64748b";
      ctx.font = "18px sans-serif";
      ctx.fillText("NOW SERVING", 70, metricY);
      ctx.fillStyle = "#f1f5f9";
      ctx.font = "bold 36px sans-serif";
      ctx.fillText(`#${currentToken}`, 70, metricY + 45);

      ctx.fillStyle = "#64748b";
      ctx.font = "18px sans-serif";
      ctx.fillText("PEOPLE AHEAD", 70 + colW, metricY);
      ctx.fillStyle = "#f1f5f9";
      ctx.font = "bold 36px sans-serif";
      ctx.fillText(`${peopleAhead}`, 70 + colW, metricY + 45);

      ctx.fillStyle = "#64748b";
      ctx.font = "18px sans-serif";
      ctx.fillText("EST. WAIT", 70 + colW * 2, metricY);
      ctx.fillStyle = "#14b8a6";
      ctx.font = "bold 32px sans-serif";
      ctx.fillText(estimatedWait, 70 + colW * 2, metricY + 45);

      ctx.strokeStyle = "#475569";
      ctx.lineWidth = 2;
      ctx.setLineDash([12, 12]);
      ctx.beginPath();
      ctx.moveTo(40, 660);
      ctx.lineTo(width - 40, 660);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = "#f8fafc";
      ctx.font = "bold 24px sans-serif";
      ctx.fillText("COUNTER VALIDATION SCAN", 70, 715);
      ctx.fillStyle = "#94a3b8";
      ctx.font = "18px sans-serif";
      ctx.fillText("Present this ticket at reception desk upon turn callout", 70, 750);
      ctx.fillText(`Issued: ${joinedTime}  |  Secure Pass ID: QL-${snapshot.entry_id || tokenNumber}-VERIFIED`, 70, 785);

      ctx.fillStyle = "#475569";
      ctx.font = "16px sans-serif";
      ctx.fillText("Powered by QueLess Intelligent Queue Management System", 70, height - 70);

      const link = document.createElement("a");
      link.download = `QueLess-Pass-Token-${tokenNumber}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("Download pass error", err);
    } finally {
      setIsDownloading(false);
    }
  }

  const isServingNow = status === "Now Serving";
  const isApproaching = status === "Approaching";

  return (
    <div className="digital-boarding-pass-wrapper" ref={passRef}>
      <div className={`boarding-pass-card ${isServingNow ? "pass-serving" : ""} ${isApproaching ? "pass-approaching" : ""}`}>
        <div className="pass-top-header">
          <div className="pass-brand-lockup">
            <Ticket size={20} className="brand-ticket-icon" />
            <div>
              <span className="pass-kicker">BOARDING PASS &bull; LIVE TICKET</span>
              <h3 className="pass-title">{businessName}</h3>
            </div>
          </div>
          <div className={`pass-status-pill ${isServingNow ? "serving" : isApproaching ? "approaching" : "waiting"}`}>
            <span className="pulsing-ping" />
            <span>{status.toUpperCase()}</span>
          </div>
        </div>

        <div className="pass-hero-section">
          <div className="pass-hero-left">
            <span className="pass-label">YOUR TOKEN</span>
            <div className="pass-token-display">
              <span className="token-hash-symbol">#</span>
              <span className="token-hero-num">{tokenNumber}</span>
            </div>
            <span className="pass-service-name">{serviceName}</span>
          </div>

          <div className="pass-hero-right">
            <QRCodePass
              value={`QUELESS:PASS:${businessName}:TOKEN-${tokenNumber}:ENTRY-${snapshot.entry_id || tokenNumber}`}
              size={120}
              label="Counter Gate Scan"
            />
          </div>
        </div>

        <div className="pass-perforated-divider">
          <span className="notch-left" />
          <span className="perf-line" />
          <span className="notch-right" />
        </div>

        <div className="pass-metrics-row">
          <div className="pass-metric-item">
            <span className="metric-header">NOW SERVING</span>
            <strong className="metric-val text-brand">#{currentToken || 0}</strong>
          </div>
          <div className="pass-metric-item">
            <span className="metric-header">PEOPLE AHEAD</span>
            <strong className="metric-val">{peopleAhead}</strong>
          </div>
          <div className="pass-metric-item">
            <span className="metric-header">EST. WAIT</span>
            <strong className="metric-val text-accent">{estimatedWait}</strong>
          </div>
        </div>

        <div className="pass-meta-strip">
          <div className="pass-meta-item">
            <Clock size={13} />
            <span>Joined: <strong>{joinedTime}</strong></span>
          </div>
          <div className="pass-meta-item">
            <ShieldCheck size={13} className="text-brand" />
            <span>Pass ID: <strong>QL-{snapshot.entry_id || tokenNumber}-VERIFIED</strong></span>
          </div>
        </div>

        <div className="pass-actions-bar">
          <button
            type="button"
            className="button primary small pass-btn"
            onClick={handleDownloadPass}
            disabled={isDownloading}
            title="Download high-resolution image pass"
          >
            <Download size={15} />
            <span>{isDownloading ? "Generating..." : "Download Digital Pass"}</span>
          </button>

          <button
            type="button"
            className="button secondary small ghost pass-btn"
            onClick={handleShare}
            title="Copy shareable token tracking info"
          >
            {copied ? <Check size={15} className="text-emerald" /> : <Share2 size={15} />}
            <span>{copied ? "Status Copied!" : "Share Token Status"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}