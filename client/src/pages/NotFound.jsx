import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Compass, Home, ArrowLeft, Building2, LayoutDashboard, HelpCircle } from 'lucide-react';
import PublicNav from '../components/PublicNav.jsx';

/**
 * 404 Not Found Page Component
 * Demonstrates React Router error/catch-all routing, useLocation hook, and recovery navigation.
 */
export default function NotFound() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <>
      <PublicNav />
      <main className="not-found-page">
        <div className="not-found-card glass-elevation">
          <div className="not-found-badge">
            <Compass size={18} />
            <span>404 • Page Not Found</span>
          </div>

          <h1 className="not-found-title">Lost in Queue?</h1>
          <p className="not-found-desc">
            We couldn&apos;t find any queue or page matching the path:
            <code className="not-found-path">{location.pathname}</code>
          </p>

          <div className="not-found-quick-links">
            <button 
              type="button" 
              onClick={() => navigate(-1)} 
              className="button ghost small"
            >
              <ArrowLeft size={16} /> Go Back
            </button>
            <Link to="/" className="button primary small">
              <Home size={16} /> Home Page
            </Link>
            <Link to="/businesses" className="button secondary small">
              <Building2 size={16} /> Search Branches
            </Link>
            <Link to="/portfolio" className="button outline small">
              <HelpCircle size={16} /> Student Portfolio
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
