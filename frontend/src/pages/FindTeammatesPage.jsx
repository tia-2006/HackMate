import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfileModal from '../components/ProfileModal';
import '../styles/FindTeammatesPage.css';

// ── Icons ──────────────────────────────────────────────────
const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
  </svg>
);
const BellIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);
const UserCircleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><circle cx="12" cy="10" r="3" /><path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662" />
  </svg>
);
const FilterIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);
const UsersIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const SendIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" />
  </svg>
);
const HackathonIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);
const ClockIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);
const LogoutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" />
  </svg>
);

// ── Helpers ────────────────────────────────────────────────
function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function computeMatchPct(myProfile, teammate) {
  if (!myProfile) return Math.floor(Math.random() * 35) + 55; // fallback
  const mySkills = new Set((myProfile.technicalSkills || []).map(s => s.toLowerCase()));
  const myInterests = new Set((myProfile.interests || []).map(i => i.toLowerCase()));
  const theirSkills = (teammate.technicalSkills || []).map(s => s.toLowerCase());
  const theirInterests = (teammate.interests || []).map(i => i.toLowerCase());

  let overlap = 0;
  let total = 0;

  theirSkills.forEach(s => {
    total++;
    if (mySkills.has(s)) overlap++;
  });
  theirInterests.forEach(i => {
    total++;
    if (myInterests.has(i)) overlap++;
  });

  // Also factor hackathon experience
  const hackathonBonus = Math.min((teammate.hackathonsAttended || 0) * 3, 15);
  const base = total > 0 ? Math.round((overlap / total) * 70) : 50;
  return Math.min(base + hackathonBonus + 20, 99);
}

function getMatchLevel(pct) {
  if (pct >= 75) return 'high';
  if (pct >= 45) return 'mid';
  return 'low';
}

// ── API util ───────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('hackmate_token');
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

// ── Skeleton Card ──────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="ft-skeleton-card">
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div className="ft-skel ft-skel-circle" />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="ft-skel ft-skel-line" style={{ width: '65%' }} />
          <div className="ft-skel ft-skel-short" style={{ width: '45%' }} />
        </div>
      </div>
      <div className="ft-skel ft-skel-line" style={{ width: '80%' }} />
      <div style={{ display: 'flex', gap: 6 }}>
        <div className="ft-skel ft-skel-line" style={{ width: '60px' }} />
        <div className="ft-skel ft-skel-line" style={{ width: '60px' }} />
        <div className="ft-skel ft-skel-line" style={{ width: '50px' }} />
      </div>
      <div className="ft-skel ft-skel-line" style={{ width: '55%', height: 34, borderRadius: 8 }} />
    </div>
  );
}

// ── Teammate Card ──────────────────────────────────────────
function TeammateCard({ teammate, onViewProfile, onInvite, inviteState, animDelay }) {
  const name = teammate.fullName || teammate.userId?.name || 'Unknown';
  const skills = teammate.technicalSkills || [];
  const visibleSkills = skills.slice(0, 3);
  const extraCount = skills.length - visibleSkills.length;
  const matchPct = teammate._matchPct ?? 70;
  const matchLevel = getMatchLevel(matchPct);

  const isInvited = inviteState === 'invited';
  const isLoading = inviteState === 'loading';

  return (
    <div className="ft-card" style={{ animationDelay: `${animDelay}s` }}>
      {/* Top row */}
      <div className="ft-card-top">
        <div className="ft-avatar-wrap">
          {teammate.photo
            ? <div className="ft-avatar"><img src={teammate.photo} alt={name} /></div>
            : <div className="ft-avatar-initial">{getInitials(name)}</div>
          }
          <span className="ft-online-dot" title="Active" />
        </div>

        <div className="ft-card-info">
          <p className="ft-card-name">{name}</p>
          <p className="ft-card-college">{teammate.college || 'University'}</p>
          <span className={`ft-match-badge ${matchLevel}`}>⚡ {matchPct}% Match</span>
        </div>
      </div>

      {/* Role */}
      <div className="ft-card-role-row">
        <span className="ft-role-label">MAIN ROLE</span>
        <span className="ft-role-badge">{teammate.preferredRole || 'Developer'}</span>
      </div>

      {/* Skills */}
      {visibleSkills.length > 0 && (
        <div className="ft-card-skills">
          {visibleSkills.map((s, i) => (
            <span key={i} className="ft-skill-chip">{s}</span>
          ))}
          {extraCount > 0 && (
            <span className="ft-skill-chip extra">+{extraCount}</span>
          )}
        </div>
      )}

      {/* Meta */}
      <div className="ft-card-meta">
        <div className="ft-meta-item">
          <HackathonIcon />
          <strong>{teammate.hackathonsAttended ?? 0}</strong> hackathons
        </div>
        {teammate.availability && (
          <div className="ft-meta-item">
            <ClockIcon />
            <span className="ft-avail-badge">🟢 {teammate.availability}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="ft-card-actions">
        <button
          className="ft-btn-view"
          onClick={() => onViewProfile(teammate)}
          id={`view-profile-${teammate._id}`}
        >
          View Profile
        </button>
        <button
          className={`ft-btn-invite${isInvited ? ' invited' : ''}${isLoading ? ' loading' : ''}`}
          onClick={() => !isInvited && !isLoading && onInvite(teammate)}
          disabled={isInvited || isLoading}
          id={`invite-${teammate._id}`}
        >
          {isInvited
            ? <><CheckIcon /> Invited!</>
            : isLoading
              ? 'Sending...'
              : <><SendIcon /> Invite to Team</>
          }
        </button>
      </div>
    </div>
  );
}

// ── Toast ──────────────────────────────────────────────────
function Toast({ toasts }) {
  return (
    <div className="ft-toast-wrap">
      {toasts.map(t => (
        <div key={t.id} className={`ft-toast ${t.type}`}>
          {t.type === 'success' ? '✓' : t.type === 'error' ? '✗' : 'ℹ'} {t.msg}
        </div>
      ))}
    </div>
  );
}

// ── Role Options ───────────────────────────────────────────
const ROLE_OPTIONS = [
  'Any',
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'UI/UX Designer',
  'ML/AI Developer',
  'Data Scientist',
  'DevOps Engineer',
  'Mobile Developer',
];

const SKILL_SUGGESTIONS = [
  'React', 'Node.js', 'Python', 'MongoDB', 'TypeScript',
  'Flutter', 'Figma', 'TensorFlow', 'AWS', 'GraphQL',
];

const EXP_OPTIONS = [
  { label: 'Any', value: '' },
  { label: 'Beginner (0–1)', value: '0-1' },
  { label: 'Intermediate (2–5)', value: '2-5' },
  { label: 'Advanced (5+)', value: '5+' },
];

const MOCK_TEAMMATES = [
  {
    _id: 'mock1',
    fullName: 'Sarah Chen',
    college: 'Stanford University',
    preferredRole: 'Full Stack Developer',
    technicalSkills: ['React', 'Node.js', 'Python', 'TypeScript'],
    interests: ['AI/ML', 'Web3', 'Open Source'],
    bio: 'Passionate about building intuitive web applications and AI tools.',
    hackathonsAttended: 4,
    availability: 'full-time',
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    userId: { _id: 'u1', name: 'Sarah Chen', email: 'sarah@example.com' },
  },
  {
    _id: 'mock2',
    fullName: 'Alex Rivera',
    college: 'MIT',
    preferredRole: 'ML/AI Developer',
    technicalSkills: ['Python', 'TensorFlow', 'PyTorch', 'FastAPI'],
    interests: ['Computer Vision', 'NLP', 'Robotics'],
    bio: 'AI researcher looking for frontend devs to build great products together.',
    hackathonsAttended: 6,
    availability: 'Mostly Weekends',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    userId: { _id: 'u2', name: 'Alex Rivera', email: 'alex@example.com' },
  },
  {
    _id: 'mock3',
    fullName: 'Maya Patel',
    college: 'UC Berkeley',
    preferredRole: 'UI/UX Designer',
    technicalSkills: ['Figma', 'React', 'CSS/Sass', 'Tailwind'],
    interests: ['Design Systems', 'User Research', 'Accessibility'],
    bio: 'Designing sleek and modern user interfaces for hackathon winning products.',
    hackathonsAttended: 3,
    availability: 'Part-time',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    userId: { _id: 'u3', name: 'Maya Patel', email: 'maya@example.com' },
  },
  {
    _id: 'mock4',
    fullName: 'David Kim',
    college: 'Carnegie Mellon',
    preferredRole: 'Backend Developer',
    technicalSkills: ['Go', 'PostgreSQL', 'Docker', 'Kubernetes'],
    interests: ['Cloud Architecture', 'DevOps', 'Distributed Systems'],
    bio: 'Building scalable backend systems and robust APIs.',
    hackathonsAttended: 5,
    availability: 'Flexible',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    userId: { _id: 'u4', name: 'David Kim', email: 'david@example.com' },
  }
];

// ── Main Page ──────────────────────────────────────────────
export default function FindTeammatesPage() {
  const navigate = useNavigate();

  // State
  const [teammates, setTeammates] = useState([]);
  const [myProfile, setMyProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('Any');
  const [skillFilter, setSkillFilter] = useState('');
  const [activeSkills, setActiveSkills] = useState([]);
  const [expFilter, setExpFilter] = useState('');

  // UI State
  const [inviteStates, setInviteStates] = useState({}); // { [teammateId]: 'idle'|'loading'|'invited' }
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [toasts, setToasts] = useState([]);

  // Debounce search
  const searchTimeout = useRef(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => setDebouncedSearch(search), 380);
    return () => clearTimeout(searchTimeout.current);
  }, [search]);

  // ── Fetch my profile ───────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('hackmate_token');
    if (!token) return;
    apiFetch('/api/profile/me')
      .then(d => setMyProfile(d.profile))
      .catch(() => setMyProfile(null));
  }, []);

  // ── Fetch teammates ────────────────────────────────────
  const fetchTeammates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (selectedRole && selectedRole !== 'Any') params.set('role', selectedRole);
      if (activeSkills.length > 0) params.set('skill', activeSkills.join(','));

      const data = await apiFetch(`/api/teammates?${params.toString()}`);
      let list = data.teammates && data.teammates.length > 0 ? data.teammates : MOCK_TEAMMATES;

      if (debouncedSearch) {
        const query = debouncedSearch.toLowerCase();
        list = list.filter(t =>
          (t.fullName || '').toLowerCase().includes(query) ||
          (t.college || '').toLowerCase().includes(query) ||
          (t.preferredRole || '').toLowerCase().includes(query) ||
          (t.technicalSkills || []).some(s => s.toLowerCase().includes(query))
        );
      }
      if (selectedRole && selectedRole !== 'Any') {
        list = list.filter(t => (t.preferredRole || '').toLowerCase().includes(selectedRole.toLowerCase()));
      }
      if (activeSkills.length > 0) {
        list = list.filter(t =>
          activeSkills.some(sk => (t.technicalSkills || []).some(s => s.toLowerCase().includes(sk.toLowerCase())))
        );
      }

      // Client-side experience filter
      if (expFilter === '0-1') list = list.filter(t => (t.hackathonsAttended ?? 0) <= 1);
      else if (expFilter === '2-5') list = list.filter(t => (t.hackathonsAttended ?? 0) >= 2 && (t.hackathonsAttended ?? 0) <= 5);
      else if (expFilter === '5+') list = list.filter(t => (t.hackathonsAttended ?? 0) > 5);

      // Attach match %
      list = list.map(t => ({ ...t, _matchPct: computeMatchPct(myProfile, t) }));
      // Sort by match descending
      list.sort((a, b) => b._matchPct - a._matchPct);

      setTeammates(list);
    } catch (err) {
      let list = MOCK_TEAMMATES.map(t => ({ ...t, _matchPct: computeMatchPct(myProfile, t) }));
      setTeammates(list);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, selectedRole, activeSkills, expFilter, myProfile]);

  useEffect(() => { fetchTeammates(); }, [fetchTeammates]);

  // ── Toast helper ───────────────────────────────────────
  const addToast = (msg, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  };

  // ── Invite handler ─────────────────────────────────────
  const handleInvite = async (teammate) => {
    const token = localStorage.getItem('hackmate_token');
    if (!token) {
      addToast('Please sign in to send team requests', 'info');
      setTimeout(() => navigate('/auth'), 1200);
      return;
    }

    const receiverId = teammate.userId?._id || teammate.userId;
    if (!receiverId) {
      addToast('Could not find user ID for this teammate', 'error');
      return;
    }

    setInviteStates(prev => ({ ...prev, [teammate._id]: 'loading' }));
    try {
      await apiFetch('/api/requests', {
        method: 'POST',
        body: JSON.stringify({ receiverId }),
      });
      setInviteStates(prev => ({ ...prev, [teammate._id]: 'invited' }));
      addToast(`Invite sent to ${teammate.fullName || 'teammate'}! 🎉`, 'success');
    } catch (err) {
      setInviteStates(prev => ({ ...prev, [teammate._id]: 'idle' }));
      addToast(err.message || 'Failed to send invite', 'error');
    }
  };

  // ── Skill chip toggle ──────────────────────────────────
  const toggleSkill = (skill) => {
    setActiveSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  // ── Clear filters ──────────────────────────────────────
  const clearFilters = () => {
    setSelectedRole('Any');
    setActiveSkills([]);
    setSkillFilter('');
    setExpFilter('');
    setSearch('');
  };

  const hasFilters = selectedRole !== 'Any' || activeSkills.length > 0 || expFilter || search;

  // ── Logout ─────────────────────────────────────────────
  const handleLogout = () => {
    localStorage.removeItem('hackmate_token');
    navigate('/');
  };

  // Nav links
  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Teammates', href: '/teammates', active: true },
    { label: 'My Profile', href: '/profile' },
  ];

  return (
    <div className="ft-page">
      {/* ── Top Bar ─────────────────────────────────────── */}
      <header className="ft-topbar">
        <a href="/" className="ft-topbar-brand">
          <span className="ft-topbar-brand-icon">⚡</span>
          HackMate
        </a>

        <nav>
          <ul className="ft-topbar-nav">
            {navLinks.map(link => (
              <li key={link.label}>
                <a
                  href={link.href}
                  className={link.active ? 'active' : ''}
                  onClick={e => { e.preventDefault(); navigate(link.href); }}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ft-topbar-right">
          {/* Search */}
          <div className="ft-search-bar" id="global-search-bar">
            <SearchIcon />
            <input
              type="text"
              placeholder="Search skills, names…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              aria-label="Search teammates"
            />
          </div>

          <button className="ft-icon-btn" aria-label="Notifications">
            <BellIcon />
          </button>
          <button className="ft-icon-btn" aria-label="My profile" onClick={() => navigate('/profile')}>
            <UserCircleIcon />
          </button>
          <button className="ft-icon-btn" aria-label="Log out" onClick={handleLogout} title="Log out">
            <LogoutIcon />
          </button>
        </div>
      </header>

      {/* ── Body ────────────────────────────────────────── */}
      <div className="ft-body">
        {/* ── Sidebar ─────────────────────────────────── */}
        <aside className="ft-sidebar" aria-label="Filters">
          <div className="ft-sidebar-header">
            <span className="ft-sidebar-title">Filters</span>
            {hasFilters && (
              <button className="ft-clear-btn" onClick={clearFilters}>Clear All</button>
            )}
          </div>

          {/* Role Filter */}
          <div className="ft-filter-group">
            <label className="ft-filter-label">Role</label>
            <div className="ft-radio-list">
              {ROLE_OPTIONS.map(role => (
                <label
                  key={role}
                  className={`ft-radio-item${selectedRole === role ? ' active' : ''}`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={role}
                    checked={selectedRole === role}
                    onChange={() => setSelectedRole(role)}
                  />
                  <span>{role}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="ft-filter-divider" />

          {/* Skills Filter */}
          <div className="ft-filter-group">
            <label className="ft-filter-label">Skills</label>
            <div className="ft-skill-search">
              <SearchIcon />
              <input
                type="text"
                placeholder="Find a skill…"
                value={skillFilter}
                onChange={e => setSkillFilter(e.target.value)}
              />
            </div>
            <div className="ft-skill-chips">
              {SKILL_SUGGESTIONS.filter(s =>
                s.toLowerCase().includes(skillFilter.toLowerCase())
              ).map(skill => (
                <button
                  key={skill}
                  className={`ft-chip-filter${activeSkills.includes(skill) ? ' active' : ''}`}
                  onClick={() => toggleSkill(skill)}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>

          <div className="ft-filter-divider" />

          {/* Experience Filter */}
          <div className="ft-filter-group">
            <label className="ft-filter-label">Experience</label>
            <div className="ft-radio-list">
              {EXP_OPTIONS.map(opt => (
                <label
                  key={opt.value}
                  className={`ft-radio-item${expFilter === opt.value ? ' active' : ''}`}
                >
                  <input
                    type="radio"
                    name="exp"
                    value={opt.value}
                    checked={expFilter === opt.value}
                    onChange={() => setExpFilter(opt.value)}
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* ── Main ────────────────────────────────────── */}
        <main className="ft-main">
          <div className="ft-main-header">
            <h1 className="ft-main-title">Find Teammates</h1>
            <p className="ft-main-sub">Based on your project needs and skills.</p>
          </div>

          {/* Results Bar */}
          {!loading && !error && (
            <div className="ft-results-bar">
              <p className="ft-results-count">
                <strong>{teammates.length}</strong>{' '}
                {teammates.length === 1 ? 'teammate' : 'teammates'} found
                {hasFilters && ' (filtered)'}
              </p>
              {hasFilters && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FilterIcon />
                  {activeSkills.map(s => (
                    <span key={s} className="ft-chip-filter active" style={{ cursor: 'default' }}>{s}</span>
                  ))}
                  {selectedRole !== 'Any' && (
                    <span className="ft-chip-filter active" style={{ cursor: 'default' }}>{selectedRole}</span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="ft-skeleton-grid">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="ft-error-state">
              <span className="ft-error-icon">⚠️</span>
              <h3>Failed to load teammates</h3>
              <p>{error}</p>
              <button className="ft-retry-btn" onClick={fetchTeammates}>Try Again</button>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && teammates.length === 0 && (
            <div className="ft-empty-state">
              <span className="ft-empty-icon">🔍</span>
              <h3>No teammates found</h3>
              <p>
                {hasFilters
                  ? 'Try adjusting your filters or search query.'
                  : 'No other profiles exist yet. Be the first to invite others!'}
              </p>
              {hasFilters && (
                <button className="ft-retry-btn" onClick={clearFilters}>
                  Clear Filters
                </button>
              )}
            </div>
          )}

          {/* Cards Grid */}
          {!loading && !error && teammates.length > 0 && (
            <div className="ft-cards-grid" id="teammates-grid">
              {teammates.map((t, idx) => (
                <TeammateCard
                  key={t._id}
                  teammate={t}
                  onViewProfile={setSelectedProfile}
                  onInvite={handleInvite}
                  inviteState={inviteStates[t._id] || 'idle'}
                  animDelay={idx * 0.05}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* ── Profile Modal ──────────────────────────────── */}
      {selectedProfile && (
        <ProfileModal
          teammate={selectedProfile}
          onClose={() => setSelectedProfile(null)}
          onInvite={(profile) => {
            setSelectedProfile(null);
            handleInvite(profile);
          }}
          inviteState={inviteStates[selectedProfile._id] || 'idle'}
        />
      )}

      {/* ── Toasts ────────────────────────────────────── */}
      <Toast toasts={toasts} />
    </div>
  );
}
