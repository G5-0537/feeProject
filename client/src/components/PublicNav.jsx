import { Link, NavLink } from 'react-router-dom';
import Logo from './Logo.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function PublicNav() {
  const { customer, staff, logoutCustomer, logoutStaff } = useAuth();

  return (
    <header className="topbar">
      <Link to="/" className="plain-link"><Logo /></Link>
      <nav className="nav-links">
        <NavLink to="/">Home</NavLink>
        <NavLink to="/businesses">Businesses</NavLink>
        <a href="/#how-it-works">How It Works</a>
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
