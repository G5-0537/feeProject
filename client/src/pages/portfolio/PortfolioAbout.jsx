import { Link } from 'react-router-dom';
import { GraduationCap, Award, BookOpen, Layers, CheckCircle, ArrowRight } from 'lucide-react';

export default function PortfolioAbout() {
  const syllabusModules = [
    {
      module: 'Module 1',
      title: 'HTML, CSS, JS & React Fundamentals',
      topics: 'DOM manipulation, modern ES6+, semantic HTML5, CSS Flexbox & Grid variables, React component lifecycle, state & props.'
    },
    {
      module: 'Module 2',
      title: 'Multi-Page SPA Navigation & Routing',
      topics: 'React Router v7 setup, BrowserRouter, dynamic parameters (:id), protected route guards, 404 handling, and nested Outlet layouts.'
    },
    {
      module: 'Module 3',
      title: 'State Architecture & Context API',
      topics: 'Global vs local state, Context API (Auth, Theme, Toasts), Zustand-pattern store with useSyncExternalStore, asynchronous loading states.'
    },
    {
      module: 'Module 4',
      title: 'Form Handling & Validation Strategies',
      topics: 'Controlled inputs, reusable form components (<FormField />, <FormSelect />), client-side regex validation, password strength scoring.'
    },
    {
      module: 'Module 5',
      title: 'Mini-Projects & Applied Architecture',
      topics: 'Mini-Project 1: Portfolio website with routing. Mini-Project 2: Enterprise Dashboard & Service Queue Booking Cart.'
    }
  ];

  return (
    <div className="portfolio-page-wrap">
      <div className="portfolio-page-header">
        <span className="portfolio-page-eyebrow">Academic Background & Coursework</span>
        <h1 className="portfolio-page-title">About Me & FEE-II Curriculum</h1>
        <p className="portfolio-page-desc">
          Undergraduate Computer Science & Engineering student with a passion for building robust, accessible frontend architectures.
        </p>
      </div>

      <div className="portfolio-grid-split">
        {/* Bio Card */}
        <div className="portfolio-info-card glass-elevation">
          <div className="info-card-header">
            <GraduationCap size={22} className="text-brand" />
            <div>
              <h3>Sampada Gupta</h3>
              <p>B.Tech Computer Science and Engineering</p>
            </div>
          </div>

          <div className="info-card-body">
            <p>
              This portfolio and the <strong>QueLess</strong> queue management system were developed as part of the 
              <strong> Front End Engineering II (FEE-II)</strong> curriculum. The project demonstrates real-world application 
              of modern JavaScript, React 19 component design, client-side routing, state management, and full-stack integration.
            </p>

            <div className="info-bullet-list">
              <div className="bullet-item">
                <CheckCircle size={16} className="text-teal" />
                <span>Specialization: Web Application Architecture & React SPAs</span>
              </div>
              <div className="bullet-item">
                <CheckCircle size={16} className="text-teal" />
                <span>Design Philosophy: Clean, accessible, zero-bloat UI with thoughtful UX</span>
              </div>
              <div className="bullet-item">
                <CheckCircle size={16} className="text-teal" />
                <span>Tools: Git, Vite, Node.js, Express, MySQL 8, VS Code</span>
              </div>
            </div>
          </div>
        </div>

        {/* Coursework Timeline */}
        <div className="portfolio-curriculum-card glass-elevation">
          <h3>FEE-II Course Modules Implemented</h3>
          <div className="curriculum-timeline">
            {syllabusModules.map((item) => (
              <div key={item.module} className="curriculum-item">
                <div className="curriculum-dot" />
                <div className="curriculum-content">
                  <div className="curriculum-top">
                    <span className="curriculum-tag">{item.module}</span>
                    <strong className="curriculum-title">{item.title}</strong>
                  </div>
                  <p className="curriculum-topics">{item.topics}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="portfolio-bottom-banner">
        <div>
          <h4>Ready to review the interactive projects?</h4>
          <p>Inspect the full project gallery including QueLess live demonstrations.</p>
        </div>
        <Link to="/portfolio/projects" className="button primary small">
          View Projects <ArrowRight size={15} />
        </Link>
      </div>
    </div>
  );
}
