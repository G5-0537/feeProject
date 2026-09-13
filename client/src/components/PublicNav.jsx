import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import Logo from './Logo.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function PublicNav() {
  const { customer, staff, logoutCustomer, logoutStaff } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleHowItWorks = (e) => {
    e.preventDefault();
    if (location.pathname === '/' || location.pathname === '') {
      const el = document.getElementById('how-it-works');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate('/', { state: { scrollTo: 'how-it-works' } });
    }
  };

  return (
    <header className="topbar">
      <Link to="/" className="plain-link"><Logo /></Link>
      <nav className="nav-links">
        <NavLink to="/">Home</NavLink>
        <NavLink to="/businesses">Businesses</NavLink>
        <button type="button" className="nav-button" onClick={handleHowItWorks}>
          How It Works
        </button>
        {customer && <NavLink to="/customer/dashboard">Customer Dashboard</NavLink>}
        {staff && <NavLink to="/staff/dashboard">Staff Dashboard</NavLink>}
        {!customer && !staff && (
          <>
            <NavLink to="/login">Customer Login</NavLink>
            <NavLink to="/staff/login">Staff Login</NavLink>
            <Link className="button small" to="/signup">Sign Up</Link>
          </>
        )}
        {customer && <button className="nav-button" onClick={logoutCustomer}>Logout</button>}
        {staff && <button className="nav-button" onClick={logoutStaff}>Logout</button>}
        <ThemeToggle />
      </nav>
    </header>
  );
}
