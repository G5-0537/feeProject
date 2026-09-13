import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, BadgeCheck, BellRing, BriefcaseBusiness, Building2, CalendarCheck, CheckCircle2, Clock3, HelpCircle, LineChart, MapPin, Navigation, ShieldCheck, Smartphone, Ticket, UsersRound } from 'lucide-react';
import PublicNav from '../components/PublicNav.jsx';
import Logo from '../components/Logo.jsx';

const businessTypes = ['Clinics', 'Hospitals', 'Restaurants', 'Banks', 'Salons', 'Government Offices', 'Service Centers'];
const faqs = [
  ['Is QueLess only for appointments?', 'No. Customers can book appointments or join an active live queue for the same day.'],
  ['How is wait time calculated?', 'The app multiplies people ahead by the service average duration and improves estimates using completed service history.'],
  ['Can staff add offline customers?', 'Yes. Walk-in customers can be added by staff and managed in the same queue.']
];

export default function LandingPage() {
  const location = useLocation();

  useEffect(() => {
    if (location.state?.scrollTo) {
      const el = document.getElementById(location.state.scrollTo);
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    } else if (location.hash) {
      const target = document.querySelector(location.hash);
      if (target) {
        setTimeout(() => target.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    }
  }, [location]);

  return (
    <>
      <PublicNav />
      <main>
        <section className="hero-section">
          <div className="hero-copy">
            <span className="eyebrow">Digital queue management for busy businesses</span>
            <h1>QueLess</h1>
            <p className="hero-tagline">Don't wait in the queue. Join it from anywhere.</p>
            <p className="hero-text">
              Let customers book appointments, join live queues, track token movement and arrive when their turn is close.
            </p>
            <div className="hero-actions">
              <Link className="button" to="/signup">Get started <ArrowRight size={18} /></Link>
              <Link className="button secondary" to="/staff/login">Staff login</Link>
            </div>
          </div>
          <div className="hero-panel" aria-label="Live queue preview">
            <div className="panel-top">
              <span>ABC Clinic</span>
              <strong>Live Queue</strong>
            </div>
            <div className="token-grid">
              <div><span>Your Token</span><strong>#47</strong></div>
              <div><span>Now Serving</span><strong>#39</strong></div>
              <div><span>People Ahead</span><strong>7</strong></div>
              <div><span>Estimated Wait</span><strong>35-45 min</strong></div>
            </div>
            <div className="progress-track"><span style={{ width: '62%' }} /></div>
            <p className="approach-note">Your turn is approaching</p>
          </div>
        </section>

        <section className="stats-strip" aria-label="QueLess impact statistics">
          <Stat value="Sample" label="statistics below are presentation data" />
          <Stat value="25+" label="demo business queues supported" />
          <Stat value="8k+" label="demo customer turns managed" />
        </section>

        <section className="section-grid">
          <div>
            <span className="eyebrow">The problem</span>
            <h2>Queues waste time because customers cannot see what is happening.</h2>
          </div>
          <div className="feature-list">
            <Feature icon={<Clock3 />} title="Uncertain waiting" text="Customers do not know how many people are ahead or when they should arrive." />
            <Feature icon={<MapPin />} title="Physical dependency" text="People must stand near the counter even when service will take a long time." />
            <Feature icon={<LineChart />} title="No historical insight" text="Businesses rarely use completed service data to improve future wait estimates." />
          </div>
        </section>

        <section className="how-section" id="how-it-works">
          <h2>How QueLess Works</h2>
          <div className="flow-strip" aria-label="Queue journey">
            <FlowStep icon={<Smartphone />} label="Join Queue" />
            <FlowStep icon={<Ticket />} label="Get Token" />
            <FlowStep icon={<LineChart />} label="Track Position" />
            <FlowStep icon={<Navigation />} label="Arrive" />
            <FlowStep icon={<CheckCircle2 />} label="Get Served" />
          </div>
          <div className="steps">
            <Feature icon={<Smartphone />} title="Customers join remotely" text="Search a business, select a service, book an appointment or join today’s live queue." />
            <Feature icon={<BadgeCheck />} title="Tokens update live" text="The dashboard shows token number, now serving, people ahead and an estimated wait range." />
            <Feature icon={<ShieldCheck />} title="Staff control the queue" text="Staff call next, complete, skip, and add walk-in customers in the same active queue." />
          </div>
        </section>

        <section className="how-section">
          <span className="eyebrow">Features</span>
          <h2>Everything needed for a practical queue system</h2>
          <div className="steps">
            <Feature icon={<CalendarCheck />} title="Appointments" text="Customers select a service, date and time, then receive a token stored in MySQL." />
            <Feature icon={<BellRing />} title="Queue updates" text="Polling refreshes active queue status, people ahead and estimated wait ranges." />
            <Feature icon={<UsersRound />} title="Walk-ins" text="Staff can add offline customers without breaking the digital queue flow." />
          </div>
        </section>

        <section className="benefits-section">
          <div>
            <span className="eyebrow">For customers</span>
            <h2>Arrive closer to your turn.</h2>
            <p>Customers can track their token, see the current token, check people ahead, and cancel entries when plans change.</p>
          </div>
          <div>
            <span className="eyebrow">For businesses</span>
            <h2>Run the queue from one dashboard.</h2>
            <p>Staff can call next, complete service, skip absentees, manage services, and view historical performance.</p>
          </div>
        </section>

        <section className="business-strip">
          <Building2 />
          <div>
            <h2>Built for B2B SaaS queue operations</h2>
            <p>{businessTypes.join(' • ')}</p>
          </div>
        </section>

        <section className="faq-section">
          <span className="eyebrow">FAQ</span>
          <h2>Common Questions</h2>
          <div className="faq-grid">
            {faqs.map(([question, answer]) => (
              <article className="faq-card" key={question}>
                <HelpCircle />
                <h3>{question}</h3>
                <p>{answer}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="cta-section">
          <BriefcaseBusiness />
          <h2>Make waiting visible, manageable and shorter.</h2>
          <Link className="button" to="/businesses">Explore Businesses <ArrowRight size={18} /></Link>
        </section>
      </main>
      <footer className="site-footer">
        <Logo />
        <p>QueLess is a React, Express and MySQL queue-management project built for real DBMS workflows.</p>
      </footer>
    </>
  );
}

function Stat({ value, label }) {
  return (
    <article>
      <strong>{value}</strong>
      <span>{label}</span>
    </article>
  );
}

function FlowStep({ icon, label }) {
  return (
    <article>
      <span>{icon}</span>
      <strong>{label}</strong>
    </article>
  );
}

function Feature({ icon, title, text }) {
  return (
    <article className="feature-card">
      <span>{icon}</span>
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  );
}
