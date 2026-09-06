import { NavLink } from 'react-router-dom';
import Logo from './Logo.jsx';
import ThemeToggle from './ThemeToggle.jsx';

export default function DashboardShell({ title, subtitle, links, children, onLogout }) {
  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <Logo />
        <nav className="side-links">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to}>{link.icon}{link.label}</NavLink>
          ))}
        </nav>
      </aside>
      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          <div className="header-actions">
            <ThemeToggle />
            <button className="button ghost small" onClick={onLogout}>Logout</button>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
