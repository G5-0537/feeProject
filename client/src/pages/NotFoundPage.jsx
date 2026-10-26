/**
 * NotFoundPage — 404 page for unmatched routes.
 * Demonstrates: Multi-page SPA design, Navigation layout (Syllabus Topics 43-48)
 * Replaces the silent redirect to "/" that existed before.
 */
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, Search } from 'lucide-react';
import PublicNav from '../components/PublicNav.jsx';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <>
      <PublicNav />
      <main className="not-found-page">
        <div className="not-found-box">
          <span className="not-found-code">404</span>
          <h1 className="not-found-title">Page Not Found</h1>
          <p className="not-found-message">
            The page you're looking for doesn't exist, was moved, or the URL is incorrect.
          </p>
          <div className="not-found-actions">
            <button className="button ghost" onClick={() => navigate(-1)}>
              <ArrowLeft size={16} /> Go Back
            </button>
            <Link to="/" className="button">
              <Home size={16} /> Home
            </Link>
            <Link to="/businesses" className="button secondary">
              <Search size={16} /> Find a Queue
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}

