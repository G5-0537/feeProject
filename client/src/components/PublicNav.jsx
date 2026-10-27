import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Home, Building2, HelpCircle, User, Briefcase, LogOut, UserPlus, Sparkles, ShoppingBag, FolderGit2 } from 'lucide-react';
import Logo from './Logo.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';

export default function PublicNav() {
  const { customer, staff, logoutCustomer, logoutStaff } = useAuth();
  const { count: cartCount, toggleCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navRef = useRef(null);

  // Close mobile drawer when location changes
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setMobileOpen(false);
      }
    }
    if (mobileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [mobileOpen]);

  // Prevent background scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const handleHowItWorks = (e) => {
    e.preventDefault();
    setMobileOpen(false);
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
    <header className="topbar" ref={navRef}>
      <div className="nav-brand-group">
        <Link to="/" className="plain-link" onClick={() => setMobileOpen(false)}>
          <Logo />
        </Link>
      </div>

      {/* Desktop Navigation Links */}
      <nav className="nav-links desktop-nav" aria-label="Main Navigation">
        <NavLink to="/" end>Home</NavLink>
        <NavLink to="/businesses">Businesses</NavLink>
        <button type="button" className="nav-button" onClick={handleHowItWorks}>
          How It Works
        </button>
        <NavLink to="/portfolio" className="portfolio-nav-pill-link">
          <FolderGit2 size={14} /> Portfolio
        </NavLink>
        
        {/* Shopping Cart / Booking Basket Button */}
        <button
          type="button"
          className="nav-cart-btn"
          onClick={toggleCart}
          title="Open Service Booking Basket"
          aria-label="Open Booking Basket"
        >
          <ShoppingBag size={17} />
          {cartCount > 0 && <span className="nav-cart-badge">{cartCount}</span>}
        </button>
        
        {customer && (
          <>
            <NavLink to="/customer/dashboard">Customer Dashboard</NavLink>
            <button type="button" className="nav-button logout-btn" onClick={logoutCustomer}>
              Logout
            </button>
          </>
        )}
        
        {staff && (
          <>
            <NavLink to="/staff/dashboard">Staff Dashboard</NavLink>
            <button type="button" className="nav-button logout-btn" onClick={logoutStaff}>
              Logout
            </button>
          </>
        )}

        {!customer && !staff && (
          <>
            <NavLink to="/login">Customer Login</NavLink>
            <NavLink to="/staff/login">Staff Login</NavLink>
            <Link className="button small nav-cta-btn" to="/signup">
              Sign Up
            </Link>
          </>
        )}

        <ThemeToggle />
      </nav>

      {/* Mobile Actions: Theme Toggle + Hamburger Button */}
      <div className="mobile-nav-actions">
        <ThemeToggle />
        <button
          type="button"
          className="mobile-hamburger-btn"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-expanded={mobileOpen}
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Drawer Dropdown */}
      <div className={`mobile-nav-drawer ${mobileOpen ? 'open' : ''}`}>
        <div className="mobile-drawer-inner">
          <div className="mobile-nav-section">
            <span className="mobile-section-label">Navigation</span>
            <NavLink to="/" end className="mobile-nav-link" onClick={() => setMobileOpen(false)}>
              <Home size={18} />
              <span>Home</span>
            </NavLink>
            <NavLink to="/businesses" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>
              <Building2 size={18} />
              <span>Businesses &amp; Branches</span>
            </NavLink>
            <NavLink to="/portfolio" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>
              <FolderGit2 size={18} />
              <span>Student Portfolio (FEE-II)</span>
            </NavLink>
            <button 
              type="button" 
              className="mobile-nav-link text-btn" 
              onClick={() => {
                setMobileOpen(false);
                toggleCart();
              }}
            >
              <ShoppingBag size={18} />
              <span>Booking Basket ({cartCount})</span>
            </button>
            <button type="button" className="mobile-nav-link text-btn" onClick={handleHowItWorks}>
              <HelpCircle size={18} />
              <span>How It Works</span>
            </button>
          </div>

          {customer && (
            <div className="mobile-nav-section">
              <span className="mobile-section-label">Customer Portal ({customer.name})</span>
              <NavLink to="/customer/dashboard" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>
                <User size={18} />
                <span>Customer Dashboard</span>
              </NavLink>
              <NavLink to="/customer/queues" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>
                <Sparkles size={18} />
                <span>My Active Queues</span>
              </NavLink>
              <button
                type="button"
                className="mobile-nav-link logout-link"
                onClick={() => {
                  logoutCustomer();
                  setMobileOpen(false);
                }}
              >
                <LogOut size={18} />
                <span>Logout Customer</span>
              </button>
            </div>
          )}

          {staff && (
            <div className="mobile-nav-section">
              <span className="mobile-section-label">Staff Portal ({staff.business_name})</span>
              <NavLink to="/staff/dashboard" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>
                <Briefcase size={18} />
                <span>Staff Desk &amp; Dashboard</span>
              </NavLink>
              <NavLink to="/staff/queue" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>
                <Sparkles size={18} />
                <span>Today&apos;s Queue</span>
              </NavLink>
              <button
                type="button"
                className="mobile-nav-link logout-link"
                onClick={() => {
                  logoutStaff();
                  setMobileOpen(false);
                }}
              >
                <LogOut size={18} />
                <span>Logout Staff</span>
              </button>
            </div>
          )}

          {!customer && !staff && (
            <div className="mobile-nav-section">
              <span className="mobile-section-label">Access &amp; Accounts</span>
              <NavLink to="/login" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>
                <User size={18} />
                <span>Customer Login</span>
              </NavLink>
              <NavLink to="/staff/login" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>
                <Briefcase size={18} />
                <span>Staff Login</span>
              </NavLink>
              <div className="mobile-auth-buttons">
                <Link to="/signup" className="button full primary" onClick={() => setMobileOpen(false)}>
                  <UserPlus size={16} /> Sign Up as Customer
                </Link>
                <Link to="/staff/signup" className="button full secondary" onClick={() => setMobileOpen(false)}>
                  <Briefcase size={16} /> Register Business (Staff)
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
