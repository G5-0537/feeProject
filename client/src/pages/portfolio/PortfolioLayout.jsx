import { NavLink, Outlet, Link } from 'react-router-dom';
import { Sparkles, Code2, User, FolderGit2, Mail, ArrowUpRight, GraduationCap } from 'lucide-react';
import ThemeToggle from '../../components/ThemeToggle.jsx';

/**
 * PortfolioLayout Component
 * Implements the syllabus requirement: "Mini project: portfolio site with routing".
 * Demonstrates:
 * - Nested routes with React Router <Outlet />
 * - NavLink with active class highlighting
 * - Reusable UI layouts and navigation state
 */
export default function PortfolioLayout() {
  return (
    <div className="portfolio-app-shell">
      {/* Top Banner linking back to QueLess */}
      <div className="portfolio-top-announcement">
        <div className="portfolio-top-inner">
          <span className="portfolio-eval-badge">
            <GraduationCap size={15} /> FEE-II Mini Project 1
          </span>
          <span className="portfolio-top-text">
            Student Portfolio SPA with Nested Routing & Reusable Components
          </span>
          <Link to="/" className="portfolio-back-pill">
            <span>Open QueLess App</span>
            <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>

      {/* Main Portfolio Navigation */}
      <header className="portfolio-header">
        <div className="portfolio-nav-container">
          <Link to="/portfolio" className="portfolio-brand">
            <div className="portfolio-avatar-placeholder">SG</div>
            <div className="portfolio-brand-text">
              <span className="portfolio-brand-name">Sampada Gupta</span>
              <span className="portfolio-brand-role">Frontend Engineer • FEE-II</span>
            </div>
          </Link>

          <nav className="portfolio-nav-links">
            <NavLink 
              to="/portfolio" 
              end 
              className={({ isActive }) => `portfolio-nav-link ${isActive ? 'active' : ''}`}
            >
              <Sparkles size={15} />
              <span>Overview</span>
            </NavLink>
            <NavLink 
              to="/portfolio/about" 
              className={({ isActive }) => `portfolio-nav-link ${isActive ? 'active' : ''}`}
            >
              <User size={15} />
              <span>About Me</span>
            </NavLink>
            <NavLink 
              to="/portfolio/projects" 
              className={({ isActive }) => `portfolio-nav-link ${isActive ? 'active' : ''}`}
            >
              <FolderGit2 size={15} />
              <span>Projects</span>
            </NavLink>
            <NavLink 
              to="/portfolio/contact" 
              className={({ isActive }) => `portfolio-nav-link ${isActive ? 'active' : ''}`}
            >
              <Mail size={15} />
              <span>Contact</span>
            </NavLink>
          </nav>

          <div className="portfolio-header-actions">
            <ThemeToggle />
            <Link to="/businesses" className="button primary small">
              Launch QueLess
            </Link>
          </div>
        </div>
      </header>

      {/* Nested Route Outlet */}
      <main className="portfolio-main-content">
        <Outlet />
      </main>

      {/* Portfolio Footer */}
      <footer className="portfolio-footer">
        <div className="portfolio-footer-inner">
          <p>© 2026 Sampada Gupta • Front End Engineering II Assessment</p>
          <div className="portfolio-footer-links">
            <Link to="/">QueLess Live System</Link>
            <Link to="/businesses">Browse Branches</Link>
            <Link to="/portfolio/contact">Get in Touch</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
