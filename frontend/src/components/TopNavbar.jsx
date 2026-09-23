import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/TopNavbar.css';

// Notification Bell Icon matching the user's screenshot
export const BellIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

// User Profile Icon (circle with head & shoulders) matching the user's screenshot
export const UserCircleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="10" r="3" />
    <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662" />
  </svg>
);

export default function TopNavbar({ activePage = '', extraRight = null }) {
  const navigate = useNavigate();
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const navLinks = [
    { label: 'Home', href: '/', id: 'home' },
    { label: 'Teammates', href: '/teammates', id: 'teammates' },
    { label: 'Matches', href: '/matches', id: 'matches' },
    { label: 'My Team', href: '/team', id: 'team' },
    { label: 'Requests', href: '/requests', id: 'requests' },
  ];

  return (
    <header className="hm-global-topbar">
      <div className="hm-global-topbar-container">
        {/* Brand */}
        <a
          href="/"
          className="hm-global-brand"
          onClick={(e) => {
            e.preventDefault();
            navigate('/');
          }}
        >
          <span className="hm-global-brand-icon">⚡</span>
          <span className="hm-global-brand-text">HackMate</span>
        </a>

        {/* Center Navigation Links */}
        <nav className="hm-global-nav" aria-label="Main Navigation">
          <ul className="hm-global-nav-list">
            {navLinks.map((link) => {
              const isActive = activePage === link.id;
              return (
                <li key={link.id}>
                  <a
                    href={link.href}
                    className={`hm-global-nav-link ${isActive ? 'active' : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(link.href);
                    }}
                  >
                    {link.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Right Area: Optional extra buttons + Bell Icon + Profile Icon */}
        <div className="hm-global-right">
          {extraRight}

          {/* Bell Notifications */}
          <div className="hm-global-icon-wrap">
            <button
              type="button"
              className={`hm-global-icon-btn ${notificationsOpen ? 'active' : ''}`}
              aria-label="Notifications"
              title="Notifications"
              onClick={() => setNotificationsOpen(!notificationsOpen)}
            >
              <BellIcon />
            </button>

            {notificationsOpen && (
              <div className="hm-global-dropdown">
                <div className="hm-global-dropdown-header">
                  <span>Notifications (2)</span>
                  <span className="hm-global-badge">New</span>
                </div>
                <div className="hm-global-dropdown-item">
                  <span className="hm-global-tag-match">Match</span>
                  <p>David K. has 95% skill compatibility with Code Warriors!</p>
                </div>
                <div className="hm-global-dropdown-item">
                  <span className="hm-global-tag-team">Team</span>
                  <p>Smart India Hackathon registration ends in 24 days.</p>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Icon */}
          <button
            type="button"
            className={`hm-global-icon-btn ${activePage === 'profile' ? 'active' : ''}`}
            aria-label="My Profile"
            title="My Profile"
            onClick={() => navigate('/profile')}
          >
            <UserCircleIcon />
          </button>
        </div>
      </div>
    </header>
  );
}
