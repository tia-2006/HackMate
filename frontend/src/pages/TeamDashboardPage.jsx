import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TeamNavbar from '../components/TeamNavbar';
import '../styles/TeamDashboardPage.css';

export default function TeamDashboardPage() {
  const navigate = useNavigate();

  // Active sub-view / modal states
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [showPostReqModal, setShowPostReqModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showTasksModal, setShowTasksModal] = useState(false);
  const [showFilesModal, setShowFilesModal] = useState(false);

  // Backend team data state
  const [teamId, setTeamId] = useState(null);
  const [teamName, setTeamName] = useState('Code Warriors');
  const [hackathonName, setHackathonName] = useState('Smart India Hackathon');
  const [maxMembers, setMaxMembers] = useState(5);

  // Requirement form state
  const [reqRole, setReqRole] = useState('Backend Developer');
  const [reqSkills, setReqSkills] = useState('Python, FastAPI, PostgreSQL');
  const [reqDesc, setReqDesc] = useState('Build scalable APIs and orchestrate cloud deployment.');

  // Team roster state (starts with fallback, populated via backend API)
  const [members, setMembers] = useState([
    {
      id: 1,
      name: 'Alex Chen',
      role: 'Full Stack Developer',
      isLeader: true,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      skills: ['React', 'Node.js', 'UI/UX'],
    },
    {
      id: 2,
      name: 'Sarah Jenkins',
      role: 'Data Engineer',
      isLeader: false,
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      skills: ['Python', 'SQL', 'AWS'],
    },
    {
      id: 3,
      name: 'David Kim',
      role: 'Frontend Specialist',
      isLeader: false,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      skills: ['Vue.js', 'Tailwind', 'Figma'],
    },
  ]);

  const [openSlots, setOpenSlots] = useState([
    { id: 'slot-1', role: 'Backend' },
    { id: 'slot-2', role: 'AI/ML' },
  ]);

  // Fetch team details from backend API
  useEffect(() => {
    const fetchBackendTeam = async () => {
      const token = localStorage.getItem('hackmate_token');
      if (!token) return;

      try {
        const response = await fetch('/api/teams/my-teams', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.teams && data.teams.length > 0) {
            const currentTeam = data.teams[0];
            setTeamId(currentTeam._id);
            setTeamName(currentTeam.name);
            setHackathonName(currentTeam.hackathon);
            const teamMax = currentTeam.maxMembers || 5;
            setMaxMembers(teamMax);

            if (currentTeam.members && currentTeam.members.length > 0) {
              const leaderId = currentTeam.leader?._id || currentTeam.leader;
              const formattedMembers = currentTeam.members.map((m) => {
                const isLeader = (m._id || m) === leaderId;
                return {
                  id: m._id || m,
                  name: m.profile?.fullName || m.name || 'Team Member',
                  role: m.profile?.preferredRole || (isLeader ? 'Leader' : 'Developer'),
                  isLeader,
                  avatar: m.profile?.photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
                  skills: m.profile?.technicalSkills?.length ? m.profile.technicalSkills : ['React', 'Node.js'],
                };
              });
              setMembers(formattedMembers);

              const emptyCount = Math.max(0, teamMax - formattedMembers.length);
              const calculatedSlots = [];
              const requiredRolesList = currentTeam.requiredRoles || ['Backend', 'AI/ML'];
              for (let i = 0; i < emptyCount; i++) {
                calculatedSlots.push({
                  id: `slot-${i}`,
                  role: requiredRolesList[i] || 'Teammate',
                });
              }
              setOpenSlots(calculatedSlots);
            }
          }
        }
      } catch (err) {
        console.error('Error loading team dashboard backend data:', err);
      }
    };

    fetchBackendTeam();
  }, []);

  // Chat message state for Team Chat modal
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { id: 1, sender: 'Alex Chen', time: '10:14 AM', text: 'Hey team! SIH registration deadline is approaching fast.' },
    { id: 2, sender: 'Sarah Jenkins', time: '10:16 AM', text: 'I completed the data pipeline schema on GitHub.' },
    { id: 3, sender: 'David Kim', time: '10:19 AM', text: 'Frontend layouts are ready. We just need the Backend & AI/ML teammates now!' },
  ]);

  // Tasks state for Tasks modal
  const [tasks, setTasks] = useState([
    { id: 1, text: 'Submit SIH Project Abstract', done: true },
    { id: 2, text: 'Finalize Tech Stack & Architecture', done: true },
    { id: 3, text: 'Onboard Backend & AI/ML Specialist', done: false },
    { id: 4, text: 'Complete Functional Prototype', done: false },
  ]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setChatMessages([
      ...chatMessages,
      { id: Date.now(), sender: 'Alex Chen (You)', time: 'Just now', text: chatInput },
    ]);
    setChatInput('');
  };

  const toggleTask = (id) => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  const handleAddCandidate = async (candidate) => {
    if (members.length >= maxMembers) return;

    const token = localStorage.getItem('hackmate_token');
    if (token && candidate.receiverId) {
      try {
        await fetch('/api/requests', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            receiverId: candidate.receiverId,
            team: teamId,
            requestedRole: candidate.role,
          }),
        });
      } catch (err) {
        console.error('Failed to send invite request:', err);
      }
    }

    setMembers([...members, candidate]);
    setOpenSlots(openSlots.slice(1));
    setShowAddMemberModal(false);
  };

  const handlePublishRequirement = async () => {
    const token = localStorage.getItem('hackmate_token');
    const skillsArray = reqSkills.split(',').map((s) => s.trim()).filter(Boolean);

    if (token && teamId) {
      try {
        await fetch(`/api/teams/${teamId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            requiredRoles: [reqRole],
            requiredSkills: skillsArray,
            description: reqDesc,
          }),
        });
      } catch (err) {
        console.error('Failed to publish requirement to backend:', err);
      }
    }

    alert(`Requirement published for ${reqRole}! Matches will now be highlighted.`);
    setShowPostReqModal(false);
  };

  const formationPct = Math.min(Math.round((members.length / maxMembers) * 100), 100);

  return (
    <div className="td-page">
      {/* ── Top Navbar ─────────────────────────────────────────────── */}
      <TeamNavbar activeTab="dashboard" onTabChange={(tab) => {
        if (tab === 'build') navigate('/team/build');
      }} />

      <main className="td-main-container">
        {/* ── Team Header ────────────────────────────────────────── */}
        <section className="td-team-header">
          <h1 className="td-team-title">Team: {teamName}</h1>
          <div className="td-team-subtitle">
            <span className="td-trophy-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                <path d="M4 22h16" />
                <path d="M10 14.66V17c0 .55-.45 1-1 1H8c-.55 0-1 .45-1 1v1h10v-1c0-.55-.45-1-1-1h-1c-.55 0-1-.45-1-1v-2.34" />
                <path d="M6 2v7a6 6 0 0 0 12 0V2Z" />
              </svg>
            </span>
            <span>{hackathonName}</span>
          </div>
        </section>

        {/* ── Team Formation Card ────────────────────────────────── */}
        <section className="td-formation-card">
          <div className="td-formation-left">
            <div className="td-formation-label">TEAM FORMATION</div>
            <div className="td-formation-value">{formationPct}% Complete</div>
            <div className="td-progress-track">
              <div className="td-progress-fill" style={{ width: `${formationPct}%` }} />
            </div>
          </div>

          <div className="td-formation-right">
            {/* Members Stat Pill */}
            <div className="td-stat-chip members">
              <div className="td-stat-icon-circle">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div className="td-stat-info">
                <span className="td-stat-num">{members.length}</span>
                <span className="td-stat-text">Members</span>
              </div>
            </div>

            {/* Missing Skills Pill */}
            <div className="td-stat-chip missing">
              <div className="td-stat-icon-circle">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  <line x1="8" y1="11" x2="14" y2="11" />
                </svg>
              </div>
              <div className="td-stat-info">
                <span className="td-stat-num">{openSlots.length}</span>
                <span className="td-stat-text">Missing Skills</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Content Grid ───────────────────────────────────────── */}
        <div className="td-content-grid">
          {/* ── Left Sidebar ───────────────────────────────────── */}
          <aside className="td-sidebar-col">
            {/* Navigation Menu */}
            <div className="td-menu-card">
              <button
                type="button"
                className={`td-menu-item ${activeMenu === 'dashboard' ? 'active' : ''}`}
                onClick={() => setActiveMenu('dashboard')}
              >
                <div className="td-menu-item-left">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="7" height="7" x="3" y="3" rx="1" />
                    <rect width="7" height="7" x="14" y="3" rx="1" />
                    <rect width="7" height="7" x="14" y="14" rx="1" />
                    <rect width="7" height="7" x="3" y="14" rx="1" />
                  </svg>
                  <span>Dashboard</span>
                </div>
              </button>

              <button
                type="button"
                className={`td-menu-item ${activeMenu === 'chat' ? 'active' : ''}`}
                onClick={() => {
                  setActiveMenu('chat');
                  setShowChatModal(true);
                }}
              >
                <div className="td-menu-item-left">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
                  </svg>
                  <span>Team Chat</span>
                </div>
                <span className="td-badge-red">3</span>
              </button>

              <button
                type="button"
                className={`td-menu-item ${activeMenu === 'files' ? 'active' : ''}`}
                onClick={() => {
                  setActiveMenu('files');
                  setShowFilesModal(true);
                }}
              >
                <div className="td-menu-item-left">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 8 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
                  </svg>
                  <span>Files</span>
                </div>
              </button>

              <button
                type="button"
                className={`td-menu-item ${activeMenu === 'tasks' ? 'active' : ''}`}
                onClick={() => {
                  setActiveMenu('tasks');
                  setShowTasksModal(true);
                }}
              >
                <div className="td-menu-item-left">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                  <span>Tasks</span>
                </div>
              </button>
            </div>

            {/* Upcoming Deadlines */}
            <div className="td-deadlines-card">
              <div className="td-card-heading">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span>Upcoming Deadlines</span>
              </div>
              <div className="td-timeline">
                <div className="td-timeline-item">
                  <span className="td-timeline-label">Registration Ends</span>
                  <span className="td-timeline-date">Oct 15, 2024</span>
                </div>
                <div className="td-timeline-item">
                  <span className="td-timeline-label">Project Submission</span>
                  <span className="td-timeline-date">Nov 20, 2024</span>
                </div>
              </div>
            </div>

            {/* Synergy Score */}
            <div className="td-synergy-card">
              <div className="td-synergy-title">Synergy Score</div>
              <div className="td-synergy-circle-wrapper">
                <svg className="td-synergy-svg" viewBox="0 0 36 36">
                  {/* Background Track */}
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="3.2"
                  />
                  {/* Progress Arc */}
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#0284c7"
                    strokeWidth="3.2"
                    strokeDasharray="91, 100"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="td-synergy-center-text">91%</div>
              </div>
              <p className="td-synergy-caption">
                Excellent team balance based on skill distribution.
              </p>
            </div>
          </aside>

          {/* ── Right Main Column ───────────────────────────────── */}
          <section className="td-main-col">
            {/* Looking for Teammates Banner */}
            <div className="td-looking-banner">
              <div className="td-looking-left">
                <div className="td-search-icon-badge">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
                <div>
                  <h2 className="td-looking-title">Looking for Teammates</h2>
                  <p className="td-looking-desc">
                    We need experts in Backend & AI/ML to complete our roster.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="td-post-req-btn"
                onClick={() => setShowPostReqModal(true)}
              >
                Post Requirement
              </button>
            </div>

            {/* Team Roster */}
            <div className="td-roster-section">
              <div className="td-roster-header">
                <h2 className="td-roster-title">Team Roster ({members.length}/{maxMembers})</h2>
                <button
                  type="button"
                  className="td-add-member-btn"
                  onClick={() => setShowAddMemberModal(true)}
                >
                  + Add Member
                </button>
              </div>

              <div className="td-roster-grid">
                {/* Current Members */}
                {members.map((member) => (
                  <div key={member.id} className="td-member-card">
                    {member.isLeader && (
                      <span className="td-leader-badge">
                        <span>⭐</span> Leader
                      </span>
                    )}
                    <div className="td-avatar-wrap">
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="td-avatar-img"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';
                        }}
                      />
                    </div>
                    <div className="td-member-name">{member.name}</div>
                    <div className="td-member-role">{member.role}</div>
                    <div className="td-skill-pills">
                      {member.skills.map((skill) => (
                        <span key={skill} className="td-skill-pill">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Open Slots */}
                {openSlots.map((slot) => (
                  <div
                    key={slot.id}
                    className="td-slot-card"
                    onClick={() => navigate('/team/build')}
                    role="button"
                    tabIndex={0}
                    title="Click to find teammates for this role"
                  >
                    <div className="td-slot-icon-wrap">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <line x1="19" y1="8" x2="19" y2="14" />
                        <line x1="22" y1="11" x2="16" y2="11" />
                      </svg>
                    </div>
                    <div className="td-slot-title">Open Slot</div>
                    <div className="td-slot-sub">Looking for {slot.role}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* ── Post Requirement Modal ─────────────────────────────────── */}
      {showPostReqModal && (
        <div className="td-modal-overlay" onClick={() => setShowPostReqModal(false)}>
          <div className="td-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="td-modal-header">
              <h3 className="td-modal-title">Post Teammate Requirement</h3>
              <button
                type="button"
                className="td-modal-close-btn"
                onClick={() => setShowPostReqModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="td-form-group">
              <label className="td-form-label">Role Needed</label>
              <input
                type="text"
                className="td-form-input"
                value={reqRole}
                onChange={(e) => setReqRole(e.target.value)}
                placeholder="e.g. Backend Developer or AI/ML Specialist"
              />
            </div>
            <div className="td-form-group">
              <label className="td-form-label">Key Required Skills</label>
              <input
                type="text"
                className="td-form-input"
                value={reqSkills}
                onChange={(e) => setReqSkills(e.target.value)}
                placeholder="e.g. Node.js, MongoDB, Express"
              />
            </div>
            <div className="td-form-group">
              <label className="td-form-label">Responsibilities & Description</label>
              <textarea
                className="td-form-textarea"
                rows="3"
                value={reqDesc}
                onChange={(e) => setReqDesc(e.target.value)}
              />
            </div>
            <div className="td-modal-actions">
              <button
                type="button"
                className="td-btn-cancel"
                onClick={() => setShowPostReqModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="td-btn-primary"
                onClick={handlePublishRequirement}
              >
                Publish Requirement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Member Modal ───────────────────────────────────────── */}
      {showAddMemberModal && (
        <div className="td-modal-overlay" onClick={() => setShowAddMemberModal(false)}>
          <div className="td-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="td-modal-header">
              <h3 className="td-modal-title">Add Member to Team</h3>
              <button
                type="button"
                className="td-modal-close-btn"
                onClick={() => setShowAddMemberModal(false)}
              >
                ✕
              </button>
            </div>
            <p style={{ fontSize: '0.88rem', color: '#64748b', margin: 0 }}>
              Choose from recommended candidates matching your missing skills:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px',
                  background: '#f8fafc',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img
                    src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80"
                    alt="David K."
                    style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>David K.</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Backend Developer • 95% Match</div>
                  </div>
                </div>
                <button
                  type="button"
                  className="td-btn-primary"
                  style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                  onClick={() =>
                    handleAddCandidate({
                      id: Date.now(),
                      name: 'David K.',
                      role: 'Backend Developer',
                      isLeader: false,
                      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
                      skills: ['Node.js', 'MongoDB', 'Docker'],
                    })
                  }
                >
                  Add
                </button>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px',
                  background: '#f8fafc',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img
                    src="https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80"
                    alt="Priya S."
                    style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>Priya S.</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>AI/ML Engineer • 88% Match</div>
                  </div>
                </div>
                <button
                  type="button"
                  className="td-btn-primary"
                  style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                  onClick={() =>
                    handleAddCandidate({
                      id: Date.now() + 1,
                      name: 'Priya S.',
                      role: 'AI/ML Engineer',
                      isLeader: false,
                      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80',
                      skills: ['Python', 'TensorFlow', 'PyTorch'],
                    })
                  }
                >
                  Add
                </button>
              </div>
            </div>
            <div className="td-modal-actions">
              <button
                type="button"
                className="td-btn-cancel"
                onClick={() => navigate('/team/build')}
              >
                Go to Build Team Page →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Team Chat Modal ────────────────────────────────────────── */}
      {showChatModal && (
        <div className="td-modal-overlay" onClick={() => setShowChatModal(false)}>
          <div className="td-modal-box" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="td-modal-header">
              <h3 className="td-modal-title">Team Chat • Code Warriors</h3>
              <button
                type="button"
                className="td-modal-close-btn"
                onClick={() => setShowChatModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="td-chat-feed">
              {chatMessages.map((msg) => (
                <div key={msg.id} className="td-chat-msg">
                  <div>
                    <span className="td-chat-sender">{msg.sender}</span>
                    <span className="td-chat-time">{msg.time}</span>
                  </div>
                  <div>{msg.text}</div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                className="td-form-input"
                placeholder="Type a message to your team..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
              />
              <button type="submit" className="td-btn-primary">
                Send
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Tasks Modal ────────────────────────────────────────────── */}
      {showTasksModal && (
        <div className="td-modal-overlay" onClick={() => setShowTasksModal(false)}>
          <div className="td-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="td-modal-header">
              <h3 className="td-modal-title">Team Tasks & Milestones</h3>
              <button
                type="button"
                className="td-modal-close-btn"
                onClick={() => setShowTasksModal(false)}
              >
                ✕
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {tasks.map((task) => (
                <label
                  key={task.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 14px',
                    background: '#f8fafc',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    textDecoration: task.done ? 'line-through' : 'none',
                    color: task.done ? '#94a3b8' : '#0f172a',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={task.done}
                    onChange={() => toggleTask(task.id)}
                  />
                  <span>{task.text}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Files Modal ────────────────────────────────────────────── */}
      {showFilesModal && (
        <div className="td-modal-overlay" onClick={() => setShowFilesModal(false)}>
          <div className="td-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="td-modal-header">
              <h3 className="td-modal-title">Team Shared Files</h3>
              <button
                type="button"
                className="td-modal-close-btn"
                onClick={() => setShowFilesModal(false)}
              >
                ✕
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px',
                  background: '#f8fafc',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>SIH_Problem_Statement_Solution.pdf</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Uploaded by Alex Chen • 2.4 MB</div>
                </div>
                <button type="button" className="td-btn-cancel" style={{ fontSize: '0.8rem', padding: '6px 10px' }}>
                  Download
                </button>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px',
                  background: '#f8fafc',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>System_Architecture_Diagram.png</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Uploaded by Sarah Jenkins • 1.1 MB</div>
                </div>
                <button type="button" className="td-btn-cancel" style={{ fontSize: '0.8rem', padding: '6px 10px' }}>
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="td-footer">
        <div className="td-footer-container">
          <div className="td-footer-left">
            <span className="td-footer-brand">HackMate</span>
            <span>© 2024 HackMate. Built for builders.</span>
          </div>
          <ul className="td-footer-links">
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
