import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TopNavbar from '../components/TopNavbar';
import '../styles/TeamDashboardPage.css';

// Keywords mapping for accurate role skill matching
const ROLE_KEYWORDS = {
  backend: ['node', 'express', 'python', 'django', 'fastapi', 'sql', 'mongo', 'postgres', 'java', 'spring', 'go', 'golang', 'api', 'docker', 'database'],
  frontend: ['react', 'vue', 'angular', 'next', 'javascript', 'typescript', 'html', 'css', 'tailwind', 'redux', 'ui', 'web'],
  'ui/ux': ['figma', 'design', 'ux', 'ui', 'prototyping', 'wireframing', 'user research', 'adobe'],
  designer: ['figma', 'design', 'ux', 'ui', 'prototyping', 'wireframing', 'user research', 'adobe'],
  'data scientist': ['python', 'pandas', 'numpy', 'sql', 'machine learning', 'scikit', 'tableau', 'statistics', 'r', 'data'],
  data: ['python', 'pandas', 'numpy', 'sql', 'machine learning', 'scikit', 'tableau', 'statistics', 'r', 'data'],
  'ai/ml': ['python', 'pytorch', 'tensorflow', 'machine learning', 'deep learning', 'nlp', 'llm', 'cv', 'keras', 'ai', 'ml'],
  ai: ['python', 'pytorch', 'tensorflow', 'machine learning', 'deep learning', 'nlp', 'llm', 'cv', 'keras', 'ai'],
  ml: ['python', 'pytorch', 'tensorflow', 'machine learning', 'deep learning', 'nlp', 'llm', 'cv', 'keras', 'ml'],
  mobile: ['flutter', 'react native', 'swift', 'kotlin', 'android', 'ios', 'mobile'],
  devops: ['docker', 'kubernetes', 'aws', 'ci/cd', 'linux', 'terraform', 'jenkins', 'cloud', 'devops']
};

function computeRoleMatchScore(neededRole, candidate, teamRequiredSkills = []) {
  if (!candidate) return 50;
  const targetLower = (neededRole || '').toLowerCase().trim();
  const candRole = (candidate.preferredRole || '').toLowerCase().trim();
  const candSkills = (candidate.technicalSkills || []).map(s => s.toLowerCase().trim());

  // 1. Role alignment (up to 42 pts)
  let rolePoints = 8;
  if (candRole && (candRole === targetLower || candRole.includes(targetLower) || targetLower.includes(candRole))) {
    rolePoints = 42;
  } else if (
    (targetLower.includes('backend') || targetLower.includes('frontend')) &&
    (candRole.includes('full stack') || candRole.includes('full-stack'))
  ) {
    rolePoints = 28;
  } else {
    const stopWords = new Set(['developer', 'engineer', 'specialist', 'expert', 'lead', 'dev', 'and', 'the']);
    const targetTokens = targetLower.split(/[\s/]+/).map(t => t.trim()).filter(t => t.length > 2 && !stopWords.has(t));
    if (targetTokens.length > 0 && targetTokens.some(t => candRole.includes(t))) {
      rolePoints = 36;
    }
  }

  // 2. Skill alignment (up to 34 pts)
  let relevantKeywords = (teamRequiredSkills || []).map(s => s.toLowerCase().trim());
  Object.keys(ROLE_KEYWORDS).forEach(key => {
    if (targetLower.includes(key)) {
      relevantKeywords = [...relevantKeywords, ...ROLE_KEYWORDS[key]];
    }
  });

  const matchingSkills = candSkills.filter(s =>
    relevantKeywords.some(kw => s === kw || s.includes(kw) || kw.includes(s))
  );

  let skillPoints = 0;
  if (matchingSkills.length >= 3) {
    skillPoints = 34;
  } else if (matchingSkills.length === 2) {
    skillPoints = 24;
  } else if (matchingSkills.length === 1) {
    skillPoints = 14;
  }

  // 3. Hackathon experience (up to 10 pts)
  const expPoints = Math.min((candidate.hackathonsAttended || 0) * 2, 10);

  // 4. Baseline (12 pts)
  return Math.min(rolePoints + skillPoints + expPoints + 12, 98);
}

function getTopCandidateForRole(neededRole, candidates, teamRequiredSkills = []) {
  if (!candidates || candidates.length === 0) return null;
  let best = null;
  let maxScore = 0;

  candidates.forEach(cand => {
    const score = computeRoleMatchScore(neededRole, cand, teamRequiredSkills);
    if (score > maxScore) {
      maxScore = score;
      best = {
        id: cand._id,
        name: cand.fullName || cand.userId?.name || 'Candidate',
        role: cand.preferredRole || 'Developer',
        score
      };
    }
  });

  return best;
}

export default function TeamDashboardPage() {
  const navigate = useNavigate();

  // Loading & Data State
  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState(null);
  const [candidates, setCandidates] = useState([]);

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Create Team Form State
  const [createForm, setCreateForm] = useState({
    name: '',
    hackathon: '',
    description: '',
    requiredRoles: 'Backend Developer, UI/UX Designer',
    maxMembers: 4,
  });

  // Edit Team Form State
  const [editForm, setEditForm] = useState({
    name: '',
    hackathon: '',
    description: '',
    maxMembers: 4,
  });

  // New Role Form State
  const [newRoleInput, setNewRoleInput] = useState('');

  // ── Fetch User's Team & Candidates from Backend ───────────────
  const fetchMyTeam = async () => {
    const token = localStorage.getItem('hackmate_token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/teams/my-teams', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.teams && data.teams.length > 0) {
          const currentTeam = data.teams[0];
          setTeam(currentTeam);
          setEditForm({
            name: currentTeam.name || '',
            hackathon: currentTeam.hackathon || '',
            description: currentTeam.description || '',
            maxMembers: currentTeam.maxMembers || 4,
          });
        } else {
          setTeam(null);
        }
      } else {
        setTeam(null);
      }

      // Also fetch candidates to calculate match score for each needed role
      const tmRes = await fetch('/api/teammates', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (tmRes.ok) {
        const tmData = await tmRes.json();
        setCandidates(tmData.teammates || []);
      }
    } catch (err) {
      console.error('Failed to fetch team data:', err);
      setTeam(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyTeam();
  }, []);

  // ── Create Team Handler (POST /api/teams) ────────────────────
  const handleCreateTeam = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    const token = localStorage.getItem('hackmate_token');
    if (!token) {
      navigate('/auth');
      return;
    }

    if (!createForm.name.trim() || !createForm.hackathon.trim()) {
      setErrorMsg('Please enter both Team Name and Hackathon Name.');
      return;
    }

    try {
      setActionLoading(true);
      const rolesArray = createForm.requiredRoles
        .split(',')
        .map((r) => r.trim())
        .filter(Boolean);

      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: createForm.name.trim(),
          hackathon: createForm.hackathon.trim(),
          description: createForm.description.trim(),
          requiredRoles: rolesArray,
          maxMembers: Number(createForm.maxMembers) || 4,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setShowCreateModal(false);
        setCreateForm({
          name: '',
          hackathon: '',
          description: '',
          requiredRoles: 'Backend Developer, UI/UX Designer',
          maxMembers: 4,
        });
        await fetchMyTeam();
      } else {
        setErrorMsg(data.message || 'Failed to create team.');
      }
    } catch (err) {
      setErrorMsg('Network error. Ensure backend is running.');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Update Team Details (PUT /api/teams/:id) ─────────────────
  const handleUpdateTeam = async (e) => {
    e.preventDefault();
    if (!team) return;
    setErrorMsg('');
    const token = localStorage.getItem('hackmate_token');

    try {
      setActionLoading(true);
      const res = await fetch(`/api/teams/${team._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editForm.name.trim(),
          hackathon: editForm.hackathon.trim(),
          description: editForm.description.trim(),
          maxMembers: Number(editForm.maxMembers) || 4,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setShowEditModal(false);
        await fetchMyTeam();
      } else {
        setErrorMsg(data.message || 'Failed to update team.');
      }
    } catch (err) {
      setErrorMsg('Network error.');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Add Needed Role (PUT /api/teams/:id) ─────────────────────
  const handleAddRole = async (e) => {
    e.preventDefault();
    if (!team || !newRoleInput.trim()) return;
    const token = localStorage.getItem('hackmate_token');

    const updatedRoles = [...(team.requiredRoles || []), newRoleInput.trim()];

    try {
      setActionLoading(true);
      const res = await fetch(`/api/teams/${team._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          requiredRoles: updatedRoles,
        }),
      });

      if (res.ok) {
        setNewRoleInput('');
        setShowAddRoleModal(false);
        await fetchMyTeam();
      }
    } catch (err) {
      console.error('Failed to add role:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // ── Remove Needed Role ────────────────────────────────────────
  const handleRemoveRole = async (roleToRemove) => {
    if (!team) return;
    const token = localStorage.getItem('hackmate_token');
    const updatedRoles = (team.requiredRoles || []).filter((r) => r !== roleToRemove);

    try {
      const res = await fetch(`/api/teams/${team._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          requiredRoles: updatedRoles,
        }),
      });
      if (res.ok) {
        await fetchMyTeam();
      }
    } catch (err) {
      console.error('Failed to remove role:', err);
    }
  };

  // Calculations
  const members = team?.members || [];
  const maxMembers = team?.maxMembers || 4;
  const leaderId = team?.leader?._id || team?.leader;
  const formationPct = Math.min(Math.round((members.length / maxMembers) * 100), 100);
  const openSlotCount = Math.max(0, maxMembers - members.length);

  return (
    <div className="td-page">
      {/* ── Top Navbar ──────────────────────────────────────────── */}
      <TopNavbar activePage="team" />

      <main className="td-main-container">
        {/* ── 1. Loading State ── */}
        {loading && (
          <div className="td-loading-card">
            <div className="td-spinner" />
            <p>Loading your hackathon team...</p>
          </div>
        )}

        {/* ── 2. No Team Exists State ── */}
        {!loading && !team && (
          <div className="td-empty-hero">
            <div className="td-empty-icon-wrap">
              <span className="td-empty-icon">🚀</span>
            </div>
            <h1 className="td-empty-title">You don't have a team yet</h1>
            <p className="td-empty-sub">
              Create your hackathon squad to define open roles, set your team capacity, and recruit top teammates.
            </p>

            <div className="td-empty-actions">
              <button
                type="button"
                className="td-btn-primary td-btn-large"
                onClick={() => {
                  setErrorMsg('');
                  setShowCreateModal(true);
                }}
              >
                + Create a New Team
              </button>
              <button
                type="button"
                className="td-btn-secondary td-btn-large"
                onClick={() => navigate('/teammates')}
              >
                Explore Teammates
              </button>
            </div>
          </div>
        )}

        {/* ── 3. Team Exists Dashboard ── */}
        {!loading && team && (
          <>
            {/* Header */}
            <section className="td-team-header-row">
              <div className="td-team-header-left">
                <div className="td-hackathon-badge">
                  <span>🏆</span>
                  <span>{team.hackathon}</span>
                </div>
                <h1 className="td-team-title">{team.name}</h1>
                {team.description && <p className="td-team-desc">{team.description}</p>}
              </div>

              <div className="td-team-header-right">
                <button
                  type="button"
                  className="td-btn-secondary"
                  onClick={() => {
                    setErrorMsg('');
                    setShowEditModal(true);
                  }}
                >
                  ✏️ Edit Team Details
                </button>
                <button
                  type="button"
                  className="td-btn-primary"
                  onClick={() => navigate('/teammates')}
                >
                  🔍 Recruit Teammates
                </button>
              </div>
            </section>

            {/* Formation Card */}
            <section className="td-formation-card">
              <div className="td-formation-left">
                <div className="td-formation-label">TEAM CAPACITY & PROGRESS</div>
                <div className="td-formation-value">
                  {members.length} / {maxMembers} Members ({formationPct}%)
                </div>
                <div className="td-progress-track">
                  <div className="td-progress-fill" style={{ width: `${formationPct}%` }} />
                </div>
              </div>

              <div className="td-formation-right">
                <div className="td-stat-chip members">
                  <span className="td-stat-num">{members.length}</span>
                  <span className="td-stat-text">Active Members</span>
                </div>
                <div className="td-stat-chip missing">
                  <span className="td-stat-num">{openSlotCount}</span>
                  <span className="td-stat-text">Open Slots</span>
                </div>
              </div>
            </section>

            {/* Main 2-Column Content Grid */}
            <div className="td-simple-grid">
              {/* Left Column: Team Members Roster */}
              <section className="td-panel">
                <div className="td-panel-header">
                  <h2 className="td-panel-title">
                    Team Members ({members.length})
                  </h2>
                  <span className="td-badge-sub">Current Roster</span>
                </div>

                <div className="td-members-list">
                  {members.map((member) => {
                    const mId = member._id || member;
                    const isLeader = mId === leaderId;
                    const profile = member.profile || {};
                    const name = profile.fullName || member.name || 'Student Developer';
                    const role = profile.preferredRole || (isLeader ? 'Team Leader' : 'Developer');
                    const skills = profile.technicalSkills || [];
                    const photo = profile.photo;

                    return (
                      <div key={mId} className="td-member-item">
                        <div className="td-member-avatar-wrap">
                          {photo ? (
                            <img src={photo} alt={name} className="td-member-avatar" />
                          ) : (
                            <div className="td-member-avatar-initials">
                              {name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>

                        <div className="td-member-info">
                          <div className="td-member-name-row">
                            <span className="td-member-name">{name}</span>
                            {isLeader && <span className="td-leader-tag">Leader ⭐</span>}
                          </div>
                          <span className="td-member-role">{role}</span>

                          {skills.length > 0 && (
                            <div className="td-member-skills">
                              {skills.slice(0, 3).map((s) => (
                                <span key={s} className="td-skill-chip">{s}</span>
                              ))}
                              {skills.length > 3 && (
                                <span className="td-skill-chip muted">+{skills.length - 3}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Right Column: Needed Roles & Recruitment */}
              <section className="td-panel">
                <div className="td-panel-header">
                  <h2 className="td-panel-title">
                    Open Positions Needed
                  </h2>
                  <button
                    type="button"
                    className="td-btn-text"
                    onClick={() => setShowAddRoleModal(true)}
                  >
                    + Add Role
                  </button>
                </div>

                <div className="td-roles-list">
                  {/* Explicit Required Roles with Targeted Match Score */}
                  {(team.requiredRoles || []).map((roleName) => {
                    const candidatePool = candidates.filter((cand) => {
                      const candUserId = cand.userId?._id || cand.userId;
                      return !members.some((m) => (m._id || m).toString() === (candUserId || '').toString());
                    });
                    const topCand = getTopCandidateForRole(roleName, candidatePool, team.requiredSkills);
                    return (
                      <div key={roleName} className="td-role-card">
                        <div className="td-role-card-left">
                          <div className="td-role-tag-row">
                            <span className="td-role-tag">Needed Role</span>
                            {topCand && (
                              <span className="td-match-score-badge" title="Top candidate match score for this position">
                                ⚡ {topCand.score}% Match
                              </span>
                            )}
                          </div>
                          <h3 className="td-role-title">{roleName}</h3>
                          {topCand && (
                            <span className="td-top-candidate-sub">
                              Top match: <strong>{topCand.name}</strong> ({topCand.role})
                            </span>
                          )}
                        </div>
                        <div className="td-role-card-right">
                          <button
                            type="button"
                            className="td-btn-sm-primary"
                            onClick={() => navigate(`/teammates?role=${encodeURIComponent(roleName)}`)}
                            title={`Find candidates matching ${roleName}`}
                          >
                            Find Teammates ➔
                          </button>
                          <button
                            type="button"
                            className="td-btn-icon-danger"
                            onClick={() => handleRemoveRole(roleName)}
                            title="Remove this open role"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Empty/Unfilled Generic Slots */}
                  {openSlotCount > (team.requiredRoles || []).length && (
                    <div className="td-generic-slot-card">
                      <div className="td-slot-dash-icon">+</div>
                      <div>
                        <h4>General Vacancy</h4>
                        <p>{openSlotCount - (team.requiredRoles || []).length} more member slot(s) open</p>
                      </div>
                      <button
                        type="button"
                        className="td-btn-secondary"
                        onClick={() => navigate('/teammates')}
                      >
                        Browse All Candidates
                      </button>
                    </div>
                  )}

                  {(team.requiredRoles || []).length === 0 && openSlotCount === 0 && (
                    <div className="td-team-full-banner">
                      <span>🎉</span>
                      <p>Your team is full! Best of luck at {team.hackathon}!</p>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </>
        )}
      </main>

      {/* ── CREATE TEAM MODAL ────────────────────────────────────── */}
      {showCreateModal && (
        <div className="td-modal-overlay">
          <div className="td-modal-box">
            <div className="td-modal-header">
              <h3 className="td-modal-title">Create Your Hackathon Team</h3>
              <button
                type="button"
                className="td-modal-close-btn"
                onClick={() => setShowCreateModal(false)}
              >
                ✕
              </button>
            </div>

            {errorMsg && <div className="td-modal-error">{errorMsg}</div>}

            <form onSubmit={handleCreateTeam} className="td-modal-form">
              <div className="td-form-group">
                <label className="td-form-label">Team Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Code Warriors"
                  className="td-form-input"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                />
              </div>

              <div className="td-form-group">
                <label className="td-form-label">Hackathon Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Smart India Hackathon 2024"
                  className="td-form-input"
                  value={createForm.hackathon}
                  onChange={(e) => setCreateForm({ ...createForm, hackathon: e.target.value })}
                />
              </div>

              <div className="td-form-group">
                <label className="td-form-label">Team Description</label>
                <textarea
                  rows="2"
                  placeholder="What is your team building or aiming to solve?"
                  className="td-form-textarea"
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                />
              </div>

              <div className="td-form-group">
                <label className="td-form-label">Needed Roles (comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Backend Developer, UI/UX Designer, AI Engineer"
                  className="td-form-input"
                  value={createForm.requiredRoles}
                  onChange={(e) => setCreateForm({ ...createForm, requiredRoles: e.target.value })}
                />
              </div>

              <div className="td-form-group">
                <label className="td-form-label">Max Team Members</label>
                <input
                  type="number"
                  min="2"
                  max="10"
                  className="td-form-input"
                  value={createForm.maxMembers}
                  onChange={(e) => setCreateForm({ ...createForm, maxMembers: e.target.value })}
                />
              </div>

              <div className="td-modal-actions">
                <button
                  type="button"
                  className="td-btn-cancel"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="td-btn-primary"
                >
                  {actionLoading ? 'Creating Team...' : 'Create Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── EDIT TEAM MODAL ──────────────────────────────────────── */}
      {showEditModal && (
        <div className="td-modal-overlay">
          <div className="td-modal-box">
            <div className="td-modal-header">
              <h3 className="td-modal-title">Edit Team Details</h3>
              <button
                type="button"
                className="td-modal-close-btn"
                onClick={() => setShowEditModal(false)}
              >
                ✕
              </button>
            </div>

            {errorMsg && <div className="td-modal-error">{errorMsg}</div>}

            <form onSubmit={handleUpdateTeam} className="td-modal-form">
              <div className="td-form-group">
                <label className="td-form-label">Team Name</label>
                <input
                  type="text"
                  required
                  className="td-form-input"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>

              <div className="td-form-group">
                <label className="td-form-label">Hackathon Name</label>
                <input
                  type="text"
                  required
                  className="td-form-input"
                  value={editForm.hackathon}
                  onChange={(e) => setEditForm({ ...editForm, hackathon: e.target.value })}
                />
              </div>

              <div className="td-form-group">
                <label className="td-form-label">Description</label>
                <textarea
                  rows="2"
                  className="td-form-textarea"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                />
              </div>

              <div className="td-form-group">
                <label className="td-form-label">Max Members</label>
                <input
                  type="number"
                  min={members.length}
                  max="10"
                  className="td-form-input"
                  value={editForm.maxMembers}
                  onChange={(e) => setEditForm({ ...editForm, maxMembers: e.target.value })}
                />
              </div>

              <div className="td-modal-actions">
                <button
                  type="button"
                  className="td-btn-cancel"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="td-btn-primary"
                >
                  {actionLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── ADD ROLE MODAL ───────────────────────────────────────── */}
      {showAddRoleModal && (
        <div className="td-modal-overlay">
          <div className="td-modal-box">
            <div className="td-modal-header">
              <h3 className="td-modal-title">Add Open Position Needed</h3>
              <button
                type="button"
                className="td-modal-close-btn"
                onClick={() => setShowAddRoleModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddRole} className="td-modal-form">
              <div className="td-form-group">
                <label className="td-form-label">Role Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AI/ML Engineer, DevOps Specialist"
                  className="td-form-input"
                  value={newRoleInput}
                  onChange={(e) => setNewRoleInput(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="td-modal-actions">
                <button
                  type="button"
                  className="td-btn-cancel"
                  onClick={() => setShowAddRoleModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="td-btn-primary"
                >
                  {actionLoading ? 'Adding...' : 'Add Position'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
