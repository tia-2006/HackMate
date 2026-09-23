import React from 'react';
import { useNavigate } from 'react-router-dom';
import TopNavbar from './TopNavbar';
import '../styles/TeamNavbar.css';

export default function TeamNavbar({ activeTab = 'dashboard', onTabChange }) {
  const navigate = useNavigate();

  const extraRight = (
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
  );

  return <TopNavbar activePage="team" extraRight={extraRight} />;
}
