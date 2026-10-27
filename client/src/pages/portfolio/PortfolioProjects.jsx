import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Layers, ArrowUpRight, CheckCircle2, ShieldCheck, Database, Navigation } from 'lucide-react';

export default function PortfolioProjects() {
  const [activeFilter, setActiveFilter] = useState('All');

  const projects = [
    {
      id: 1,
      title: 'QueLess Virtual Queue System',
      category: 'Full-Stack Capstone',
      description: 'End-to-end smart queue management platform eliminating physical waiting rooms with live GPS proximity, travel-aware ETA, Web Audio chimes, and public lobby TV mode.',
      tags: ['React 19', 'React Router v7', 'Context API', 'Express', 'MySQL 8', 'Web Speech API'],
      liveLink: '/businesses',
      isFlagship: true
    },
    {
      id: 2,
      title: 'Multi-Service Queue Booking Basket',
      category: 'State & Cart Architecture',
      description: 'Shopping cart pattern implemented for healthcare and service queueing. Select multiple consultation and test services, calculate total duration/cost, and book atomically.',
      tags: ['Zustand Pattern', 'useSyncExternalStore', 'Cart Calculations', 'State Management'],
      liveLink: '/businesses/1',
      isFlagship: false
    },
    {
      id: 3,
      title: 'Interactive Portfolio SPA with Declarative Routing',
      category: 'SPA Routing & Components',
      description: 'Multi-page single-page application demonstrating nested React Router <Outlet />, active NavLink styling, dynamic routing, 404 recovery, and reusable form components.',
      tags: ['React Router v7', 'Outlet Layouts', 'Reusable Inputs', 'Touch Validation'],
      liveLink: '/portfolio',
      isFlagship: false
    },
    {
      id: 4,
      title: 'Mappls & Haversine Proximity Engine',
      category: 'APIs & Geolocation',
      description: 'Real-time GPS coordinator comparing user live coordinates against branch network coordinates, with fallback to reference coordinates and turn-by-turn routing modals.',
      tags: ['Geolocation API', 'Haversine Algorithm', 'Distance Badges', 'Map Navigation'],
      liveLink: '/businesses',
      isFlagship: false
    }
  ];

  const filtered = activeFilter === 'All' 
    ? projects 
    : projects.filter(p => p.category.includes(activeFilter) || (activeFilter === 'Full-Stack' && p.isFlagship));

  return (
    <div className="portfolio-page-wrap">
      <div className="portfolio-page-header">
        <span className="portfolio-page-eyebrow">Interactive Project Showcase</span>
        <h1 className="portfolio-page-title">Technical Projects & Mini-Projects</h1>
        <p className="portfolio-page-desc">
          Projects built to demonstrate mastery of React Router, Context API, state stores, form validation, and full-stack API integration.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="portfolio-filter-bar">
        {['All', 'Full-Stack', 'State & Cart', 'SPA Routing', 'APIs & Geolocation'].map((tab) => (
          <button
            key={tab}
            type="button"
            className={`portfolio-filter-btn ${activeFilter === tab ? 'active' : ''}`}
            onClick={() => setActiveFilter(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Projects Grid */}
      <div className="portfolio-projects-grid">
        {filtered.map((proj) => (
          <div key={proj.id} className={`portfolio-showcase-card glass-elevation ${proj.isFlagship ? 'flagship' : ''}`}>
            <div className="showcase-top">
              <span className="showcase-category">{proj.category}</span>
              {proj.isFlagship && <span className="showcase-flagship-pill">⭐ Flagship</span>}
            </div>

            <h3 className="showcase-title">{proj.title}</h3>
            <p className="showcase-desc">{proj.description}</p>

            <div className="showcase-tags">
              {proj.tags.map((tag) => (
                <span key={tag} className="showcase-tag-pill">{tag}</span>
              ))}
            </div>

            <div className="showcase-actions">
              <Link to={proj.liveLink} className="button primary small">
                <span>View Live Feature</span>
                <ArrowUpRight size={14} />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
