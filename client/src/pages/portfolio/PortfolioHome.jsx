import { Link } from 'react-router-dom';
import { ArrowRight, Code2, Layers, Cpu, Database, CheckCircle2, Terminal, ExternalLink, Sparkles } from 'lucide-react';

export default function PortfolioHome() {
  const skills = [
    'React 19', 'React Router v7', 'Context API', 'State Architecture',
    'HTML5 & Modern CSS3', 'JavaScript ES6+', 'Async/Await & Promises',
    'Form Validation', 'Reusable Components', 'Node.js Express', 'MySQL 8'
  ];

  return (
    <div className="portfolio-page-wrap">
      {/* Hero Section */}
      <section className="portfolio-hero-section">
        <div className="portfolio-hero-badge">
          <Sparkles size={14} />
          <span>Front End Engineering II • Portfolio Mini-Project</span>
        </div>

        <h1 className="portfolio-hero-title">
          Building resilient, human-centered <span className="portfolio-gradient-text">web experiences</span>.
        </h1>

        <p className="portfolio-hero-subtitle">
          Hi, I&apos;m <strong>Sampada Gupta</strong>. I specialize in modern Single Page Application (SPA) development, 
          state architecture with React Context and Zustand patterns, declarative routing, and accessible UI engineering.
        </p>

        <div className="portfolio-hero-cta-row">
          <Link to="/portfolio/projects" className="button primary">
            <span>Explore Projects</span>
            <ArrowRight size={16} />
          </Link>
          <Link to="/portfolio/contact" className="button secondary">
            <span>Contact Me</span>
          </Link>
          <Link to="/businesses" className="button outline">
            <span>Live QueLess App</span>
            <ExternalLink size={14} />
          </Link>
        </div>
      </section>

      {/* Tech Stack Pills */}
      <section className="portfolio-skills-strip">
        <h3 className="portfolio-section-label">Core Competencies & Syllabus Technologies</h3>
        <div className="portfolio-skills-grid">
          {skills.map((skill) => (
            <span key={skill} className="portfolio-skill-pill">
              <CheckCircle2 size={13} className="pill-check" />
              <span>{skill}</span>
            </span>
          ))}
        </div>
      </section>

      {/* Flagship Project Highlight: QueLess */}
      <section className="portfolio-featured-project">
        <div className="portfolio-project-card glass-elevation">
          <div className="project-card-header">
            <span className="project-category-tag">Featured Capstone Project</span>
            <span className="project-status-live">● Production Ready</span>
          </div>

          <h2 className="project-card-title">QueLess — Smart Virtual Queue Management System</h2>
          <p className="project-card-desc">
            A full-stack, hardware-free digital queue orchestration platform that eliminates physical waiting rooms. 
            Connects mobile customers, service desks, and public lobby TV displays in real-time with travel-aware ETA calculations, 
            Web Audio chimes, Web Speech synthetic voice, and resilient dual-engine database fallback.
          </p>

          <div className="project-metrics-row">
            <div className="project-metric">
              <strong>15+</strong>
              <span>React Router Routes</span>
            </div>
            <div className="project-metric">
              <strong>3</strong>
              <span>Context API Stores</span>
            </div>
            <div className="project-metric">
              <strong>100%</strong>
              <span>Hardware-Free Web Tech</span>
            </div>
            <div className="project-metric">
              <strong>Dual</strong>
              <span>MySQL + Offline DB</span>
            </div>
          </div>

          <div className="project-card-actions">
            <Link to="/businesses" className="button primary small">
              Test Live Queues
            </Link>
            <Link to="/portfolio/projects" className="button ghost small">
              View Architecture & Code Breakdown <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
