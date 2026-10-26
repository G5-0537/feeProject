/**
 * AboutPage — Project showcase / tech stack page.
 * Demonstrates: Multi-page SPA design, Navigation layout (Syllabus Topics 43-48)
 * Route: /about
 */
import { Link } from 'react-router-dom';
import { ArrowLeft, Code2, Database, GitBranch, Layers, Palette, Smartphone, Zap } from 'lucide-react';
import PublicNav from '../components/PublicNav.jsx';
import Logo from '../components/Logo.jsx';

const techStack = [
  { icon: <Code2 size={20} />, name: 'React 19', detail: 'UI library — hooks, context, functional components' },
  { icon: <GitBranch size={20} />, name: 'React Router v7', detail: 'Multi-page SPA routing with protected routes' },
  { icon: <Layers size={20} />, name: 'Zustand', detail: 'Lightweight state management (replaces Redux boilerplate)' },
  { icon: <Zap size={20} />, name: 'Vite', detail: 'Lightning-fast dev server and production build tool' },
  { icon: <Database size={20} />, name: 'localStorage Mock DB', detail: 'In-browser REST API engine — works without a backend' },
  { icon: <Palette size={20} />, name: 'CSS Custom Properties', detail: 'Full dark/light theme system via CSS variables' },
  { icon: <Smartphone size={20} />, name: 'Recharts', detail: 'React-native chart library for analytics visualization' },
];

const features = [
  'Live queue tracking with 5-second polling',
  'Smart branch recommendation engine (geo-distance + wait time)',
  'QR code digital token passes',
  'In-browser mock database with 1000+ lines of realistic seed data',
  'Dark/light theme with localStorage persistence',
  'CSV export for queue analytics and history logs',
  'Toast notification system (global Context)',
  'Zustand store for staff dashboard state management',
  'Reusable form components with validation hooks',
  'Paginated tables with search, filter, and sort',
  'Debounced search inputs',
  'Retryable data loading with request cancellation',
  'Infinite-scroll history view alongside paginated tables',
  'Skeleton loading states',
  'Mobile-responsive sidebar with hamburger toggle',
  'Protected routes with role-based access control',
  'Audio token announcements for staff counter',
];

const syllabusCoverage = [
  { topics: '43–48', name: 'Navigation & Multi-page SPA', evidence: 'React Router v7, 15+ routes, protected routes, nested layouts, breadcrumbs, 404 page' },
  { topics: '49–54', name: 'Context API & State Architecture', evidence: 'AuthContext, ThemeContext, ToastContext, QueueContext, Zustand staffStore, global vs local state' },
  { topics: '55–60', name: 'Form Handling & Validation', evidence: 'Shared useFormValidation rules for authentication, appointments, staff branch settings and walk-ins; reusable FormField supports inputs, selects and text areas' },
  { topics: '61–66', name: 'Modal, Tabs, Toast, Search/Filter/Sort', evidence: 'Modal replaces confirm(), Tabs on dashboards, global Toast system, useTableControls hook' },
  { topics: '67–72', name: 'REST APIs, Pagination, Debounce, CRUD', evidence: 'fetch-based REST client with visible mock mode, retry and abort handling; paginated and infinite-scroll history, debounced search; queue, service and branch create/read/update/cancel flows' },
];

export default function AboutPage() {
  return (
    <>
      <PublicNav />
      <main className="page-wrap about-page">
        <div className="about-back-row">
          <Link to="/" className="button ghost small">
            <ArrowLeft size={16} /> Back to Home
          </Link>
        </div>

        <div className="about-hero">
          <Logo />
          <div>
            <h1 className="about-title">QueLess</h1>
            <p className="about-subtitle">Digital Queue Management System</p>
            <div className="about-meta-chips">
              <span className="about-chip">25CSE0203 — Front End Engineering-II</span>
              <span className="about-chip">Chitkara University</span>
              <span className="about-chip">React 19 + Vite</span>
            </div>
          </div>
        </div>

        <p className="about-desc">
          QueLess is a full-stack-style digital queue management SaaS platform built entirely in React.
          Customers can join queues remotely, track live token progress, and book appointments.
          Staff manage queues in real time from a command-center dashboard. The app ships with a
          sophisticated in-browser mock database that simulates a MySQL-backed REST API —
          making it fully interactive without a live backend.
        </p>

        {/* Syllabus Coverage */}
        <section className="about-section">
          <h2>📚 Syllabus Coverage</h2>
          <div className="syllabus-grid">
            {syllabusCoverage.map((item) => (
              <div className="syllabus-card" key={item.topics}>
                <div className="syllabus-card-header">
                  <span className="syllabus-topics-badge">Topics {item.topics}</span>
                  <strong>{item.name}</strong>
                </div>
                <p>{item.evidence}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Tech Stack */}
        <section className="about-section">
          <h2>🛠️ Tech Stack</h2>
          <div className="tech-grid">
            {techStack.map((tech) => (
              <div className="tech-card" key={tech.name}>
                <span className="tech-icon">{tech.icon}</span>
                <div>
                  <strong>{tech.name}</strong>
                  <p>{tech.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="about-section">
          <h2>✨ Key Features</h2>
          <ul className="features-list">
            {features.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </section>
      </main>
    </>
  );
}

