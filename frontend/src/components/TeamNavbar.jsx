import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/TeamNavbar.css';

export default function TeamNavbar({ activeTab = 'dashboard', onTabChange }) {
  const navigate = useNavigate();
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Teammates', href: '/teammates' },
    { label: 'Matches', href: '/teammates?tab=matches' },
    { label: 'My Team', href: '/team', active: true },
    { label: 'Requests', href: '/teammates?tab=requests' },
  ];

  return (
    <header className="hm-top-navbar">
      <div className="hm-navbar-container">
        {/* Brand */}
        <div className="hm-brand-area" onClick={() => navigate('/')} role="button" tabIndex={0}>
          <span className="hm-brand-text">HackMate</span>
        </div>

        {/* Center Nav Links */}
        <nav className="hm-nav-menu" aria-label="Main Navigation">
          <ul className="hm-nav-list">
            {navLinks.map((link) => (
              <li key={link.label} className="hm-nav-item">
                <a
                  href={link.href}
                  className={`hm-nav-link ${link.active ? 'active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(link.href);
                  }}
                >
                  {link.label}
                  {link.active && <span className="hm-nav-indicator" />}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Right Actions */}
        <div className="hm-nav-right">
          {/* Sub-view switcher pill */}
          <div className="hm-view-pill-toggle">
            <button
              type="button"
              className={`hm-view-toggle-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => {
                if (onTabChange) onTabChange('dashboard');
                else navigate('/team');
              }}
              title="Team Dashboard"
            >
              Dashboard
            </button>
            <button
              type="button"
              className={`hm-view-toggle-btn ${activeTab === 'build' ? 'active' : ''}`}
              onClick={() => {
                if (onTabChange) onTabChange('build');
                else navigate('/team/build');
              }}
              title="Build Your Team"
            >
              Build Team
            </button>
          </div>

          {/* Bell Icon */}
          <div className="hm-nav-icon-wrap">
            <button
              type="button"
              className="hm-icon-circle-btn"
              aria-label="Notifications"
              onClick={() => setNotificationsOpen(!notificationsOpen)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span className="hm-bell-dot" />
            </button>

            {notificationsOpen && (
              <div className="hm-dropdown-panel">
                <div className="hm-dropdown-header">Notifications (2)</div>
                <div className="hm-dropdown-item">
                  <span className="hm-dropdown-tag">Match</span>
                  <div>David K. has 95% skill compatibility with Code Warriors!</div>
                </div>
                <div className="hm-dropdown-item">
                  <span className="hm-dropdown-tag info">Team</span>
                  <div>Smart India Hackathon registration ends in 24 days.</div>
                </div>
              </div>
            )}
          </div>

          {/* User Avatar */}
          <button
            type="button"
            className="hm-user-avatar-btn"
            aria-label="User Profile"
            onClick={() => navigate('/profile')}
            title="Alex Chen (My Profile)"
          >
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
              alt="Alex Chen"
              className="hm-user-avatar-img"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div className="hm-user-avatar-fallback" style={{ display: 'none' }}>
              AC
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}
