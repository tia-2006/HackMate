import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TeamNavbar from '../components/TeamNavbar';
import '../styles/BuildTeamPage.css';

export default function BuildTeamPage() {
  const navigate = useNavigate();

  // Team profile state
  const [teamId, setTeamId] = useState(null);
  const [teamName, setTeamName] = useState('Code Warriors');
  const [hackathon, setHackathon] = useState('Smart India Hackathon 2024');
  const [maxMembers, setMaxMembers] = useState(4);
  const [showEditModal, setShowEditModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Edit modal temporary form state
  const [editName, setEditName] = useState(teamName);
  const [editHackathon, setEditHackathon] = useState(hackathon);
  const [editMax, setEditMax] = useState(maxMembers);

  // Current members state (starts with fallback data, updated via backend API)
  const [members, setMembers] = useState([
    {
      id: 'alex',
      name: 'Alex Chen',
      role: 'Frontend Developer',
      starred: true,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      skills: ['React', 'Tailwind', 'TypeScript'],
    },
    {
      id: 'sarah',
      name: 'Sarah Jenkins',
      role: 'UI/UX Designer',
      starred: false,
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      skills: ['Figma', 'Prototyping', 'User Research'],
    },
  ]);

  // Missing roles state
  const [missingRoles, setMissingRoles] = useState([
    { id: 'be', title: 'Backend Developer', badge: 'Required', type: 'required' },
    { id: 'aiml', title: 'AI/ML Engineer', badge: 'Optional', type: 'optional' },
  ]);

  // Recommended candidates state
  const [candidates, setCandidates] = useState([
    {
      id: 'david-k',
      receiverId: null,
      name: 'David K.',
      role: 'Backend Dev',
      matchScore: 95,
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
      skills: ['NODE.JS', 'MONGODB'],
      invited: false,
    },
    {
      id: 'priya-s',
      receiverId: null,
      name: 'Priya S.',
      role: 'AI/ML',
      matchScore: 88,
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80',
      skills: ['PYTHON', 'TENSORFLOW'],
      invited: false,
    },
  ]);

  // Fetch team details and candidates from backend
  useEffect(() => {
    const fetchBackendData = async () => {
      const token = localStorage.getItem('hackmate_token');
      if (!token) return;

      try {
        setLoading(true);

        // Fetch user's team
        const teamRes = await fetch('/api/teams/my-teams', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (teamRes.ok) {
          const teamData = await teamRes.json();
          if (teamData.teams && teamData.teams.length > 0) {
            const currentTeam = teamData.teams[0];
            setTeamId(currentTeam._id);
            setTeamName(currentTeam.name);
            setHackathon(currentTeam.hackathon);
            setMaxMembers(currentTeam.maxMembers || 4);

            if (currentTeam.members && currentTeam.members.length > 0) {
              const leaderId = currentTeam.leader?._id || currentTeam.leader;
              const formattedMembers = currentTeam.members.map((m) => {
                const isLeader = (m._id || m) === leaderId;
                return {
                  id: m._id || m,
                  name: m.profile?.fullName || m.name || 'Team Member',
                  role: m.profile?.preferredRole || (isLeader ? 'Team Leader' : 'Developer'),
                  starred: isLeader,
                  avatar: m.profile?.photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
                  skills: m.profile?.technicalSkills?.length ? m.profile.technicalSkills : ['React', 'Node.js'],
                };
              });
              setMembers(formattedMembers);
            }

            if (currentTeam.requiredRoles && currentTeam.requiredRoles.length > 0) {
              const formattedMissing = currentTeam.requiredRoles.map((r, idx) => ({
                id: `role-${idx}`,
                title: r,
                badge: idx === 0 ? 'Required' : 'Optional',
                type: idx === 0 ? 'required' : 'optional',
              }));
              setMissingRoles(formattedMissing);
            }
          }
        }

        // Fetch candidates from teammates API
        const tmRes = await fetch('/api/teammates', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (tmRes.ok) {
          const tmData = await tmRes.json();
          if (tmData.teammates && tmData.teammates.length > 0) {
            const mappedCandidates = tmData.teammates.map((t, index) => ({
              id: t._id,
              receiverId: t.userId?._id || t.userId,
              name: t.fullName || t.userId?.name || 'Candidate',
              role: t.preferredRole || 'Developer',
              matchScore: Math.max(70, 95 - index * 5),
              avatar: t.photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
              skills: (t.technicalSkills || []).map((s) => s.toUpperCase()),
              invited: false,
            }));
            setCandidates(mappedCandidates);
          }
        }
      } catch (err) {
        console.error('Error fetching backend team data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBackendData();
  }, []);

  // Invite / Add candidate handler
  const handleInviteCandidate = async (candidate) => {
    if (members.length >= maxMembers) {
      alert(`Team already reached max capacity of ${maxMembers} members!`);
      return;
    }

    const token = localStorage.getItem('hackmate_token');
    const targetUserId = candidate.receiverId || candidate.id;

    if (token && targetUserId) {
      try {
        const response = await fetch('/api/requests', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            receiverId: targetUserId,
            team: teamId,
            requestedRole: candidate.role,
          }),
        });
        const resData = await response.json();
        if (!response.ok && resData.message) {
          console.warn('API notice:', resData.message);
        }
      } catch (err) {
        console.error('Error sending request:', err);
      }
    }

    // Toggle invited state
    setCandidates(
      candidates.map((c) => (c.id === candidate.id ? { ...c, invited: true } : c))
    );

    // Add candidate to current members UI
    const newMember = {
      id: candidate.id,
      name: candidate.name,
      role: candidate.role,
      starred: false,
      avatar: candidate.avatar,
      skills: candidate.skills.map((s) => s.charAt(0) + s.slice(1).toLowerCase()),
    };

    setMembers([...members, newMember]);
  };

  // Toggle member star
  const toggleStar = (id) => {
    setMembers(
      members.map((m) => (m.id === id ? { ...m, starred: !m.starred } : m))
    );
  };

  const handleSaveTeam = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('hackmate_token');

    if (token) {
      try {
        const endpoint = teamId ? `/api/teams/${teamId}` : '/api/teams';
        const method = teamId ? 'PUT' : 'POST';

        const response = await fetch(endpoint, {
          method,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: editName,
            hackathon: editHackathon,
            maxMembers: Number(editMax),
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.team) {
            setTeamId(data.team._id);
            setTeamName(data.team.name);
            setHackathon(data.team.hackathon);
            setMaxMembers(data.team.maxMembers);
          }
        }
      } catch (err) {
        console.error('Failed to save team on backend:', err);
      }
    }

    setTeamName(editName);
    setHackathon(editHackathon);
    setMaxMembers(Number(editMax));
    setShowEditModal(false);
  };

  const progressPct = Math.min(Math.round((members.length / maxMembers) * 100), 100);

  return (
    <div className="bt-page">
      {/* ── Top Navbar ─────────────────────────────────────────────── */}
      <TeamNavbar
        activeTab="build"
        onTabChange={(tab) => {
          if (tab === 'dashboard') navigate('/team');
        }}
      />

      <main className="bt-main-container">
        {/* ── Top Header Row ───────────────────────────────────────── */}
        <section className="bt-header-row">
          <div className="bt-header-info">
            <span className="bt-pre-title">TEAM CREATION</span>
            <h1 className="bt-title">Build Your Team</h1>
          </div>
          <button
            type="button"
            className="bt-edit-team-btn"
            onClick={() => {
              setEditName(teamName);
              setEditHackathon(hackathon);
              setEditMax(maxMembers);
              setShowEditModal(true);
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
              <path d="m15 5 4 4" />
            </svg>
            <span>Edit Team</span>
          </button>
        </section>

        {/* ── Overview Card ────────────────────────────────────────── */}
        <section className="bt-overview-card">
          <div className="bt-overview-left">
            <div className="bt-team-icon-box">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                <path d="M2 12h20" />
              </svg>
            </div>
            <div className="bt-overview-details">
              <h2 className="bt-team-name">{teamName}</h2>
              <div className="bt-team-hackathon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span>{hackathon}</span>
              </div>
            </div>
          </div>

          <div className="bt-overview-right">
            <div className="bt-filled-row">
              <span className="bt-filled-label">Team Filled</span>
              <span>
                {members.length}/{maxMembers}
              </span>
            </div>
            <div className="bt-filled-progress-track">
              <div
                className="bt-filled-progress-fill"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </section>

        {/* ── Main Content Grid ────────────────────────────────────── */}
        <div className="bt-content-grid">
          {/* ── Left Column: Current Members ───────────────────────── */}
          <section className="bt-members-section">
            <div className="bt-section-heading">
              <span className="bt-section-heading-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </span>
              <span>Current Members</span>
            </div>

            <div className="bt-members-grid">
              {members.map((member) => (
                <div key={member.id} className="bt-member-card">
                  <div className="bt-member-top">
                    <div className="bt-member-profile-row">
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="bt-member-avatar"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80';
                        }}
                      />
                      <div className="bt-member-meta">
                        <div className="bt-member-name">{member.name}</div>
                        <div className="bt-member-role">{member.role}</div>
                      </div>
                    </div>

                    <div
                      className="bt-star-icon"
                      onClick={() => toggleStar(member.id)}
                      title={member.starred ? 'Team Leader / Starred' : 'Mark as key contact'}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill={member.starred ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    </div>
                  </div>

                  <div className="bt-member-tags">
                    {member.skills.map((skill) => (
                      <span key={skill} className="bt-member-tag">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Right Column: Sidebar ──────────────────────────────── */}
          <aside className="bt-sidebar-col">
            {/* Missing Roles Card */}
            <div className="bt-missing-card">
              <div className="bt-missing-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <span>Missing Roles</span>
              </div>

              <div className="bt-roles-list">
                {missingRoles.length > 0 ? (
                  missingRoles.map((role) => (
                    <div key={role.id} className="bt-role-row">
                      <div className="bt-role-left">
                        <span className="bt-role-icon">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                        </span>
                        <span>{role.title}</span>
                      </div>
                      <span className={`bt-role-badge ${role.type}`}>
                        {role.badge}
                      </span>
                    </div>
                  ))
                ) : (
                  <div style={{ fontSize: '0.85rem', color: '#16a34a', fontWeight: 600, textAlign: 'center', padding: '10px 0' }}>
                    ✓ All recommended team roles have been filled!
                  </div>
                )}
              </div>

              <button
                type="button"
                className="bt-find-missing-btn"
                onClick={() => navigate('/teammates')}
              >
                <span>Find Missing Skills</span>
                <span>→</span>
              </button>
            </div>

            {/* Recommended Candidates Card */}
            <div className="bt-recommended-card">
              <div className="bt-rec-header">
                <h3 className="bt-rec-title">Recommended</h3>
                <span className="bt-top-matches-badge">Top Matches</span>
              </div>

              <div className="bt-candidates-list">
                {candidates.map((candidate) => (
                  <div key={candidate.id} className="bt-candidate-item">
                    <div className="bt-candidate-top">
                      <div className="bt-candidate-info-wrap">
                        <img
                          src={candidate.avatar}
                          alt={candidate.name}
                          className="bt-candidate-avatar"
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80';
                          }}
                        />
                        <div className="bt-candidate-names">
                          <span className="bt-candidate-name">{candidate.name}</span>
                          <span className="bt-candidate-sub">{candidate.role}</span>
                        </div>
                      </div>
                      <span className="bt-match-score-pill">
                        {candidate.matchScore}% Match
                      </span>
                    </div>

                    <div className="bt-candidate-bottom">
                      <div className="bt-candidate-skills">
                        {candidate.skills.map((skill) => (
                          <span key={skill} className="bt-skill-capsule">
                            {skill}
                          </span>
                        ))}
                      </div>
                      <button
                        type="button"
                        className={`bt-invite-btn ${candidate.invited ? 'invited' : ''}`}
                        onClick={() => handleInviteCandidate(candidate)}
                        disabled={candidate.invited}
                      >
                        {candidate.invited ? '✓ Added' : '+ Add to Team'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* ── Edit Team Modal ────────────────────────────────────────── */}
      {showEditModal && (
        <div className="bt-modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="bt-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="bt-modal-header">
              <h3 className="bt-modal-title">Edit Team Details</h3>
              <button
                type="button"
                className="bt-modal-close-btn"
                onClick={() => setShowEditModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTeam} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="bt-form-group">
                <label className="bt-form-label">Team Name</label>
                <input
                  type="text"
                  className="bt-form-input"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </div>

              <div className="bt-form-group">
                <label className="bt-form-label">Hackathon</label>
                <input
                  type="text"
                  className="bt-form-input"
                  value={editHackathon}
                  onChange={(e) => setEditHackathon(e.target.value)}
                  required
                />
              </div>

              <div className="bt-form-group">
                <label className="bt-form-label">Maximum Members</label>
                <select
                  className="bt-form-select"
                  value={editMax}
                  onChange={(e) => setEditMax(e.target.value)}
                >
                  <option value="3">3 Members</option>
                  <option value="4">4 Members (Standard)</option>
                  <option value="5">5 Members</option>
                  <option value="6">6 Members</option>
                </select>
              </div>

              <div className="bt-modal-actions">
                <button
                  type="button"
                  className="bt-btn-cancel"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="bt-btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="bt-footer">
        <div className="bt-footer-container">
          <div className="bt-footer-left">
            <span className="bt-footer-brand">HackMate</span>
            <span>© 2024 HackMate. Built for builders.</span>
          </div>
          <ul className="bt-footer-links">
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
