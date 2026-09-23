import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import TopNavbar from '../components/TopNavbar';
import '../styles/MatchesPage.css';

// ── Sample Teammate Data matching the screenshot ──────────────────────
const MOCK_SARAH_JENKINS = {
  _id: 'u_sarah',
  fullName: 'Sarah Jenkins',
  college: 'Computer Science, Junior @ MIT',
  photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
  matchScore: 94,
  whyMatch: 'Complementary skills + Same hackathon interest (FinTech Track)',
  userRole: 'Frontend',
  matchRole: 'Backend',
  skills: ['Python', 'Node.js', 'PostgreSQL'],
  extraSkillsCount: 2,
};

const MOCK_DAVID_CHEN = {
  _id: 'u_david_chen',
  fullName: 'David Chen',
  college: 'Data Science, Senior',
  photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  matchScore: 88,
  matchTag: 'Strong Match: Design',
  matchDesc: 'Looking for a frontend developer to bring his UX wireframes to life.',
  skills: ['Figma', 'UX Research'],
};

export default function MatchesPage() {
  const navigate = useNavigate();
  const [featuredMatch, setFeaturedMatch] = useState(MOCK_SARAH_JENKINS);
  const [compactMatch, setCompactMatch] = useState(MOCK_DAVID_CHEN);
  const [loading, setLoading] = useState(false);
  const [requested, setRequested] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // ── Fetch AI matches from backend API ──────────────────────────────
  const fetchMatches = useCallback(async () => {
    const token = localStorage.getItem('hackmate_token');
    if (!token) return;

    setLoading(true);
    try {
      const res = await fetch('/api/matches', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (res.ok && data.matches && data.matches.length > 0) {
        const m1 = data.matches[0];
        setFeaturedMatch({
          _id: m1.userId?._id || m1._id,
          fullName: m1.fullName || m1.userId?.name || 'Sarah Jenkins',
          college: `${m1.course || 'Computer Science'}, Year ${m1.year || 3} @ ${m1.college || 'MIT'}`,
          photo: m1.photo || MOCK_SARAH_JENKINS.photo,
          matchScore: m1.score || 94,
          whyMatch: 'Complementary skills + Same hackathon interest (FinTech Track)',
          userRole: 'Frontend',
          matchRole: m1.preferredRole || 'Backend',
          skills: (m1.technicalSkills || ['Python', 'Node.js', 'PostgreSQL']).slice(0, 3),
          extraSkillsCount: Math.max((m1.technicalSkills?.length || 5) - 3, 0),
        });

        if (data.matches.length > 1) {
          const m2 = data.matches[1];
          setCompactMatch({
            _id: m2.userId?._id || m2._id,
            fullName: m2.fullName || m2.userId?.name || 'David Chen',
            college: `${m2.course || 'Data Science'}, Senior`,
            photo: m2.photo || MOCK_DAVID_CHEN.photo,
            matchScore: m2.score || 88,
            matchTag: 'Strong Match: Design',
            matchDesc: 'Looking for a frontend developer to bring his UX wireframes to life.',
            skills: m2.technicalSkills || ['Figma', 'UX Research'],
          });
        }
      }
    } catch (err) {
      console.error('Failed to fetch matches:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  // ── Send Request Handler ───────────────────────────────────────────
  const handleRequestTeam = async (receiverId) => {
    const token = localStorage.getItem('hackmate_token');
    setRequested(true);

    if (token) {
      try {
        await fetch('/api/requests', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ receiverId })
        });
      } catch (err) {
        console.error(err);
      }
    }
  };

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Teammates', href: '/teammates' },
    { label: 'Matches', href: '/matches', active: true },
    { label: 'My Team', href: '/team' },
    { label: 'Requests', href: '/requests' },
  ];

  return (
    <div className="mt-page">
      {/* ── Topbar ─────────────────────────────────────────────────── */}
      <TopNavbar activePage="matches" />

      {/* ── Main Content ───────────────────────────────────────────── */}
      <main className="mt-main">
        <div className="mt-header">
          <h1 className="mt-title">Recommended Teammates</h1>
          <p className="mt-subtitle">
            Based on your skills, interests and preferred roles, these students are the best matches for your team.
          </p>
        </div>

        {/* ── Matches Layout Grid ─────────────────────────────────── */}
        <div className="mt-matches-layout">
          {/* Featured Teammate Card (Left Large Card) */}
          <div className="mt-featured-card">
            <div className="mt-featured-banner">
              <span className="mt-badge-looking">Actively Looking</span>
              <img
                src={featuredMatch.photo}
                alt={featuredMatch.fullName}
                className="mt-featured-img"
              />
            </div>

            <div className="mt-featured-content">
              <div>
                <div className="mt-featured-top">
                  <div>
                    <h2 className="mt-featured-name">{featuredMatch.fullName}</h2>
                    <p className="mt-featured-sub">{featuredMatch.college}</p>
                  </div>

                  <div className="mt-score-ring-wrap">
                    <div className="mt-score-ring">
                      {featuredMatch.matchScore}%
                    </div>
                    <span className="mt-score-ring-lbl">Match Score</span>
                  </div>
                </div>

                {/* Why it matches Box */}
                <div className="mt-why-box">
                  <div className="mt-why-head">
                    <span>✓</span> Why it matches
                  </div>
                  <p className="mt-why-text">{featuredMatch.whyMatch}</p>

                  <div className="mt-compare-pill">
                    <div className="mt-compare-col">
                      <div className="mt-compare-who">You</div>
                      <div className="mt-compare-val">{featuredMatch.userRole}</div>
                    </div>
                    <div className="mt-compare-arrow">⇄</div>
                    <div className="mt-compare-col">
                      <div className="mt-compare-who">{featuredMatch.fullName.split(' ')[0]}</div>
                      <div className="mt-compare-val">{featuredMatch.matchRole}</div>
                    </div>
                  </div>
                </div>

                {/* Skill Chips */}
                <div className="mt-chips-row">
                  {featuredMatch.skills.map(s => (
                    <span key={s} className="mt-chip">{s}</span>
                  ))}
                  {featuredMatch.extraSkillsCount > 0 && (
                    <span className="mt-chip more">+{featuredMatch.extraSkillsCount} more</span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-action-btns">
                <button
                  type="button"
                  className="mt-btn-primary-dark"
                  onClick={() => handleRequestTeam(featuredMatch._id)}
                  disabled={requested}
                  id="btn-request-sarah"
                >
                  {requested ? '✓ Request Sent' : 'Request to Team'}
                </button>
                <button
                  type="button"
                  className="mt-btn-outline"
                  onClick={() => navigate(`/teammate/${featuredMatch._id || 'u_sarah'}`, { state: { profile: featuredMatch } })}
                  id="btn-view-sarah-profile"
                >
                  View Profile
                </button>
              </div>
            </div>
          </div>

          {/* Compact Teammate Card (Right Side Card) */}
          <div className="mt-compact-card">
            <div className="mt-compact-header">
              <img
                src={compactMatch.photo}
                alt={compactMatch.fullName}
                className="mt-compact-avatar"
              />
              <div>
                <h3 className="mt-compact-name">{compactMatch.fullName}</h3>
                <p className="mt-compact-sub">{compactMatch.college}</p>
              </div>
            </div>

            <div className="mt-compact-score-row">
              <div className="mt-compact-score-ring">
                {compactMatch.matchScore}%
              </div>
              <span className="mt-compact-score-label">Match</span>
            </div>

            <div className="mt-compact-why-box">
              <div className="mt-compact-why-tag">{compactMatch.matchTag}</div>
              <p className="mt-compact-why-desc">{compactMatch.matchDesc}</p>
            </div>

            <div className="mt-chips-row" style={{ marginBottom: '1.25rem' }}>
              {compactMatch.skills.map(s => (
                <span key={s} className="mt-chip">{s}</span>
              ))}
            </div>

            <button
              type="button"
              className="mt-btn-full-outline"
              onClick={() => navigate(`/teammate/${compactMatch._id || 'u_david_chen'}`, { state: { profile: compactMatch } })}
              id="btn-view-david-profile"
            >
              View Profile
            </button>
          </div>
        </div>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="mt-footer">
        <div className="mt-footer-container">
          <div className="mt-footer-left">
            <span className="mt-footer-brand">HackMate</span>
            <span className="mt-footer-copy">© 2024 HackMate. Built for builders.</span>
          </div>

          <ul className="mt-footer-nav">
            <li><a href="#about">About</a></li>
            <li><a href="#privacy">Privacy</a></li>
            <li><a href="#terms">Terms</a></li>
            <li><a href="#support">Support</a></li>
          </ul>
        </div>
      </footer>
    </div>
  );
}
