import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/HomePage.css';

// ─── Icons ────────────────────────────────────────────────────────────────────
const BellIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);
const UserCircleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><circle cx="12" cy="10" r="3" /><path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662" />
  </svg>
);
const BrainIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z" />
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z" />
  </svg>
);
const ShieldCheckIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" />
  </svg>
);
const ZapIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);
const ArrowRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
  </svg>
);
const UsersIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const MenuIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

// ─── Navbar ──────────────────────────────────────────────────────────────────
function Navbar({ onNavigateToAuth }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = ['Home', 'Teammates', 'Matches', 'My Team', 'Requests'];

  return (
    <nav className={`hm-navbar${scrolled ? ' scrolled' : ''}`}>
      <div className="hm-navbar-inner">
        <a href="#home" className="hm-brand">
          <span className="hm-brand-icon">⚡</span>
          <span className="hm-brand-name">HackMate</span>
        </a>

        <ul className={`hm-nav-links${menuOpen ? ' open' : ''}`}>
          {navLinks.map((label, i) => (
            <li key={label}>
              <a
                href={i === 0 ? '#home' : '#features'}
                className={i === 0 ? 'active' : ''}
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hm-nav-actions">
          <button className="hm-icon-btn" aria-label="Notifications">
            <BellIcon />
          </button>
          <button className="hm-icon-btn" aria-label="Account" onClick={onNavigateToAuth}>
            <UserCircleIcon />
          </button>
          <button className="hm-icon-btn hm-menu-toggle" aria-label="Menu" onClick={() => setMenuOpen(o => !o)}>
            <MenuIcon />
          </button>
        </div>
      </div>
    </nav>
  );
}

// ─── Hero ────────────────────────────────────────────────────────────────────
function HeroSection({ onFindTeammates, onCreateProfile }) {
  return (
    <section className="hm-hero" id="home">
      <div className="hm-hero-inner">
        {/* Left: Text */}
        <div className="hm-hero-text">
          <div className="hm-hero-badge">
            <span className="hm-badge-dot" />
            Now live — find your squad in minutes
          </div>

          <h1 className="hm-hero-heading">
            Find your perfect<br />
            <span className="hm-heading-gradient">hackathon team.</span>
          </h1>

          <p className="hm-hero-sub">
            Discover teammates based on skills, interests, and experience.
            Build your squad and start shipping faster.
          </p>

          <div className="hm-hero-cta">
            <button id="find-teammates-btn" className="hm-btn-primary" onClick={onFindTeammates}>
              <UsersIcon />
              Find Teammates
            </button>
            <button id="create-profile-btn" className="hm-btn-secondary" onClick={onCreateProfile}>
              Create Profile
            </button>
          </div>

          <div className="hm-hero-stats">
            <div className="hm-stat">
              <span className="hm-stat-num">2.4k+</span>
              <span className="hm-stat-label">Builders</span>
            </div>
            <div className="hm-stat-divider" />
            <div className="hm-stat">
              <span className="hm-stat-num">380+</span>
              <span className="hm-stat-label">Teams Formed</span>
            </div>
            <div className="hm-stat-divider" />
            <div className="hm-stat">
              <span className="hm-stat-num">50+</span>
              <span className="hm-stat-label">Hackathons</span>
            </div>
          </div>
        </div>

        {/* Right: Image */}
        <div className="hm-hero-visual">
          <div className="hm-hero-img-frame">
            <img
              src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=700&auto=format&fit=crop&q=80"
              alt="Hackathon team collaborating"
              className="hm-hero-img"
            />
            <div className="hm-hero-img-shine" />
          </div>

          {/* Floating cards */}
          <div className="hm-float-card hm-float-tl">
            <span className="hm-float-emoji">🚀</span>
            <div>
              <p className="hm-float-title">Team Found!</p>
              <p className="hm-float-sub">3 new matches today</p>
            </div>
          </div>
          <div className="hm-float-card hm-float-br">
            <span className="hm-float-emoji">✅</span>
            <div>
              <p className="hm-float-title">Request Accepted</p>
              <p className="hm-float-sub">2 min ago</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Features ────────────────────────────────────────────────────────────────
function FeaturesSection({ onGetStarted }) {
  const features = [
    {
      icon: <BrainIcon />,
      cls: 'hm-icon-blue',
      title: 'Skill-based matching',
      desc: 'Our AI finds the perfect technical and non-technical fit to ensure your team has all the necessary capabilities to win.',
    },
    {
      icon: <ShieldCheckIcon />,
      cls: 'hm-icon-violet',
      title: 'Reliable teammates',
      desc: 'Connect with students who have a proven track record of success and commitment in past hackathons.',
    },
    {
      icon: <ZapIcon />,
      cls: 'hm-icon-amber',
      title: 'Faster team formation',
      desc: 'Skip the awkward networking events. Go from solo to squad in minutes with our streamlined request system.',
    },
  ];

  return (
    <section className="hm-features" id="features">
      <div className="hm-features-inner">
        <p className="hm-section-eyebrow">Why use HackMate?</p>
        <h2 className="hm-features-heading">Everything you need to form a winning team.</h2>

        <div className="hm-features-grid">
          {features.map((f, i) => (
            <div className="hm-feature-card" key={i} style={{ animationDelay: `${i * 0.12}s` }}>
              <div className={`hm-feature-icon ${f.cls}`}>{f.icon}</div>
              <h3 className="hm-feature-title">{f.title}</h3>
              <p className="hm-feature-desc">{f.desc}</p>
              <button className="hm-feature-link" onClick={onGetStarted}>
                Get started <ArrowRightIcon />
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── How It Works ────────────────────────────────────────────────────────────
function HowItWorksSection({ onGetStarted }) {
  const steps = [
    { num: '01', title: 'Create your profile', desc: 'Showcase your skills, experience, and what kind of team you\'re looking for.' },
    { num: '02', title: 'Discover matches', desc: 'Browse profiles or let our algorithm surface the best teammate fits.' },
    { num: '03', title: 'Send & accept requests', desc: 'Send a request to join or invite others. One click to confirm your squad.' },
    { num: '04', title: 'Win together', desc: 'Collaborate with your perfectly assembled team and ship something great.' },
  ];

  return (
    <section className="hm-how" id="how-it-works">
      <div className="hm-how-inner">
        <p className="hm-section-eyebrow">Simple process</p>
        <h2 className="hm-how-heading">How it works</h2>
        <p className="hm-how-sub">Four simple steps to your dream hackathon team.</p>

        <div className="hm-steps-grid">
          {steps.map((s, i) => (
            <div className="hm-step-card" key={i}>
              <span className="hm-step-num">{s.num}</span>
              <h3 className="hm-step-title">{s.title}</h3>
              <p className="hm-step-desc">{s.desc}</p>
            </div>
          ))}
        </div>

        <button className="hm-btn-primary hm-how-cta" onClick={onGetStarted}>
          Get Started Free <ArrowRightIcon />
        </button>
      </div>
    </section>
  );
}

// ─── Footer ──────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="hm-footer">
      <div className="hm-footer-inner">
        <a href="#home" className="hm-brand">
          <span className="hm-brand-icon">⚡</span>
          <span className="hm-brand-name">HackMate</span>
        </a>
        <nav className="hm-footer-links">
          {['About', 'Privacy', 'Terms', 'Support'].map(l => (
            <a key={l} href="#home">{l}</a>
          ))}
        </nav>
        <p className="hm-footer-copy">© {new Date().getFullYear()} HackMate. Built for builders.</p>
      </div>
    </footer>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const navigate = useNavigate();
  const goToAuth = () => navigate('/auth');

  return (
    <div className="hm-page">
      <Navbar onNavigateToAuth={goToAuth} />
      <main>
        <HeroSection onFindTeammates={goToAuth} onCreateProfile={goToAuth} />
        <FeaturesSection onGetStarted={goToAuth} />
        <HowItWorksSection onGetStarted={goToAuth} />
      </main>
      <Footer />
    </div>
  );
}
