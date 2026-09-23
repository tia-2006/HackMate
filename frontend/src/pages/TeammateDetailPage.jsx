import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import TopNavbar from '../components/TopNavbar';
import '../styles/TeammateDetailPage.css';

const ALEX_CHEN_MOCK = {
  _id: 'u_alex',
  fullName: 'Alex Chen',
  college: 'Stanford University • CS Junior',
  photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
  preferredRole: 'Full-Stack Developer',
  additionalRoles: ['UI/UX Designer'],
  bio: "I'm a junior CS major passionate about building intuitive tools for developers. I have experience leading frontend teams in fast-paced hackathon environments and love bridging the gap between solid engineering and great design. Looking for a team building something in the devtools or edtech space.",
  technicalSkills: ['React / Next.js', 'TypeScript', 'Node.js', 'Tailwind CSS', 'Python', 'Figma'],
  nonTechnicalSkills: ['Agile Management', 'Pitch Presenting', 'User Research'],
  projects: [
    {
      id: 'p1',
      title: 'CodeCollab',
      tag: "HackMIT '23",
      desc: 'Real-time collaborative code editor tailored for interview prep.',
      winnerBadge: '⭐ Winner: Best DevTool',
      iconType: 'code',
    },
    {
      id: 'p2',
      title: 'StudyBot AI',
      tag: "TreeHacks '24",
      desc: 'An AI study assistant that generates flashcards from lecture notes.',
      iconType: 'bot',
    }
  ],
  matchScore: 94,
  whyMatch: [
    'Complementary Skills: You need a Frontend Dev, Alex excels in React.',
    'Shared Interests: Both flagged "DevTools" as primary interest.',
    'Timezone Alignment: Both in PST.'
  ],
  availability: 'Actively looking for a team',
  availSub: 'Ready to start immediately',
  commitment: '15-20 hours / hackathon',
  commitNote: 'Prefers synchronous collaboration in evenings.'
};

const DAVID_CHEN_MOCK = {
  _id: 'u_david_chen',
  fullName: 'David Chen',
  college: 'Carnegie Mellon University • Data Science Senior',
  photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
  preferredRole: 'UI/UX Designer & Data Science',
  additionalRoles: ['UX Researcher'],
  bio: 'Looking for a frontend developer to bring UX wireframes to life. I specialize in data visualization, Figma prototyping, and user research to build intuitive hackathon projects.',
  technicalSkills: ['Figma', 'UX Research', 'Python', 'Data Science', 'User Testing'],
  nonTechnicalSkills: ['Wireframing', 'Design Systems', 'Product Strategy'],
  projects: [
    {
      id: 'p1',
      title: 'VizFlow',
      tag: "PennApps '23",
      desc: 'Interactive data visualization dashboard for complex datasets.',
      winnerBadge: '⭐ Winner: Best UI/UX',
      iconType: 'code',
    },
    {
      id: 'p2',
      title: 'DesignKit AI',
      tag: "TreeHacks '24",
      desc: 'An AI-powered Figma plugin for accessible color palettes.',
      iconType: 'bot',
    }
  ],
  matchScore: 88,
  whyMatch: [
    'Strong Match: Design - Looking for a frontend developer to bring UX wireframes to life.',
    'Skill Synergy: David designs high-fidelity UX wireframes while you build frontend UI.',
    'Complementary Focus: High interest in UX Research and Data Science.'
  ],
  availability: 'Actively looking for a team',
  availSub: 'Ready to start immediately',
  commitment: '15-20 hours / hackathon',
  commitNote: 'Prefers synchronous design reviews & async feedback.'
};

const SARAH_JENKINS_MOCK = {
  _id: 'u_sarah',
  fullName: 'Sarah Jenkins',
  college: 'MIT • Computer Science Junior',
  photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
  preferredRole: 'Backend Developer',
  additionalRoles: ['Cloud Architect'],
  bio: 'Junior CS student at MIT focused on high-throughput backend services, database optimization, and FinTech infrastructure. Looking for frontend teammates for upcoming hackathons.',
  technicalSkills: ['Python', 'Node.js', 'PostgreSQL', 'Docker', 'Redis', 'GraphQL'],
  nonTechnicalSkills: ['System Architecture', 'Agile Planning'],
  projects: [
    {
      id: 'p1',
      title: 'PaySwift',
      tag: "HackMIT '23",
      desc: 'Micropayment processing API built with Node.js & PostgreSQL.',
      winnerBadge: '⭐ Winner: FinTech Track',
      iconType: 'code',
    }
  ],
  matchScore: 94,
  whyMatch: [
    'Complementary Skills: You need a Backend Dev, Sarah excels in Python & Node.js.',
    'Shared Track Interest: Both flagged FinTech Track as primary interest.',
    'Timezone Alignment: Same timezone.'
  ],
  availability: 'Actively looking for a team',
  availSub: 'Ready to start immediately',
  commitment: '20+ hours / hackathon',
  commitNote: 'Available for full weekend sprint.'
};

const MOCK_PROFILES = {
  u_alex: ALEX_CHEN_MOCK,
  u_david_chen: DAVID_CHEN_MOCK,
  u_sarah: SARAH_JENKINS_MOCK,
};

export default function TeammateDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  const getInitialProfile = () => {
    if (location.state?.profile) {
      const p = location.state.profile;
      const base = MOCK_PROFILES[p._id || id] || MOCK_PROFILES[id] || DAVID_CHEN_MOCK;
      return {
        ...base,
        ...p,
        fullName: p.fullName || p.name || base.fullName,
        photo: p.photo || base.photo,
        college: p.college || base.college,
        preferredRole: p.preferredRole || p.matchRole || base.preferredRole,
        bio: p.bio || p.matchDesc || base.bio,
        matchScore: p.matchScore || p.score || base.matchScore,
        whyMatch: p.whyMatch
          ? (Array.isArray(p.whyMatch) ? p.whyMatch : [p.whyMatch])
          : base.whyMatch,
        technicalSkills: p.skills || p.technicalSkills || base.technicalSkills,
      };
    }
    if (id && MOCK_PROFILES[id]) {
      return MOCK_PROFILES[id];
    }
    return DAVID_CHEN_MOCK;
  };

  const [profile, setProfile] = useState(getInitialProfile);
  const [invited, setInvited] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (location.state?.profile) {
      const p = location.state.profile;
      const base = MOCK_PROFILES[p._id || id] || MOCK_PROFILES[id] || DAVID_CHEN_MOCK;
      setProfile({
        ...base,
        ...p,
        fullName: p.fullName || p.name || base.fullName,
        photo: p.photo || base.photo,
        college: p.college || base.college,
        preferredRole: p.preferredRole || p.matchRole || base.preferredRole,
        bio: p.bio || p.matchDesc || base.bio,
        matchScore: p.matchScore || p.score || base.matchScore,
        whyMatch: p.whyMatch
          ? (Array.isArray(p.whyMatch) ? p.whyMatch : [p.whyMatch])
          : base.whyMatch,
        technicalSkills: p.skills || p.technicalSkills || base.technicalSkills,
      });
      return;
    }

    if (id && MOCK_PROFILES[id]) {
      setProfile(MOCK_PROFILES[id]);
    }

    if (!id) return;
    const token = localStorage.getItem('hackmate_token');

    setLoading(true);
    fetch(`/api/profile/${id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
      .then(res => res.json())
      .then(data => {
        if (data.profile) {
          const base = MOCK_PROFILES[id] || DAVID_CHEN_MOCK;
          setProfile({
            ...base,
            ...data.profile,
            fullName: data.profile.fullName || data.profile.userId?.name || base.fullName,
            college: data.profile.college ? `${data.profile.college} • Year ${data.profile.year || 3}` : base.college,
            photo: data.profile.photo || base.photo,
            bio: data.profile.bio || base.bio,
            preferredRole: data.profile.preferredRole || base.preferredRole,
            technicalSkills: data.profile.technicalSkills?.length ? data.profile.technicalSkills : base.technicalSkills,
          });
        }
      })
      .catch(() => {
        if (MOCK_PROFILES[id]) {
          setProfile(MOCK_PROFILES[id]);
        }
      })
      .finally(() => setLoading(false));
  }, [id, location.state]);

  const handleInvite = async () => {
    const token = localStorage.getItem('hackmate_token');
    setInvited(true);

    if (token) {
      try {
        await fetch('/api/requests', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            receiverId: profile.userId?._id || profile._id,
            requestedRole: profile.preferredRole || 'Developer'
          })
        });
      } catch (err) {
        console.error(err);
      }
    }
  };

  const firstName = profile.fullName ? profile.fullName.split(' ')[0] : 'User';

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Teammates', href: '/teammates', active: true },
    { label: 'Matches', href: '/matches' },
    { label: 'My Team', href: '/team' },
    { label: 'Requests', href: '/requests' },
  ];

  return (
    <div className="tp-page">
      {/* Top Navbar */}
      <TopNavbar activePage="teammates" />

      {/* Main Body */}
      <main className="tp-main">
        {/* Profile Banner Card */}
        <section className="tp-profile-card">
          <div className="tp-avatar-wrapper">
            <img src={profile.photo} alt={profile.fullName} className="tp-avatar-img" />
            <div className="tp-verified-badge" title="Verified Hacker">✓</div>
          </div>

          <div className="tp-profile-info">
            <h1 className="tp-profile-name">{profile.fullName}</h1>
            <p className="tp-profile-college">
              🎓 {profile.college}
            </p>

            <div className="tp-role-pills">
              <span className="tp-role-pill">
                &lt;&gt; {profile.preferredRole}
              </span>
              {(profile.additionalRoles || []).map(r => (
                <span key={r} className="tp-role-pill">
                  ✏️ {r}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Two-Column Grid */}
        <div className="tp-grid">
          {/* Left Column */}
          <div className="tp-left-col">
            {/* About Me Card */}
            <div className="tp-card">
              <h2 className="tp-card-title">
                <span>👤</span> About Me
              </h2>
              <p className="tp-text">{profile.bio}</p>
            </div>

            {/* Skills & Expertise Card */}
            <div className="tp-card">
              <h2 className="tp-card-title">
                <span>⚡</span> Skills & Expertise
              </h2>

              <div className="tp-section-subtitle">TECHNICAL</div>
              <div className="tp-skills-list">
                {(profile.technicalSkills || []).map(skill => (
                  <span key={skill} className="tp-skill-tag">{skill}</span>
                ))}
              </div>

              {profile.nonTechnicalSkills?.length > 0 && (
                <>
                  <div className="tp-section-subtitle">NON-TECHNICAL</div>
                  <div className="tp-skills-list">
                    {profile.nonTechnicalSkills.map(skill => (
                      <span key={skill} className="tp-skill-tag non-tech">{skill}</span>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Previous Projects Card */}
            <div className="tp-card">
              <h2 className="tp-card-title">
                <span>🚀</span> Previous Projects
              </h2>

              {(profile.projects || []).map(proj => (
                <div key={proj.id} className="tp-project-card">
                  <div className="tp-project-header">
                    <div className="tp-project-main">
                      <div className={`tp-project-icon-box ${proj.iconType === 'bot' ? 'blue' : ''}`}>
                        {proj.iconType === 'bot' ? '🤖' : '💻'}
                      </div>
                      <h3 className="tp-project-name">{proj.title}</h3>
                    </div>
                    <span className="tp-project-tag">{proj.tag}</span>
                  </div>

                  <p className="tp-project-desc">{proj.desc}</p>

                  {proj.winnerBadge && (
                    <div className="tp-winner-badge">{proj.winnerBadge}</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right Column */}
          <div className="tp-right-col">
            {/* Compatibility Score Card */}
            <div className="tp-card compatibility">
              <h2 className="tp-card-title">
                <span>🎯</span> Compatibility Score
              </h2>

              <div className="tp-score-circle-wrapper">
                <div className="tp-score-circle">
                  <span className="tp-score-val">{profile.matchScore}%</span>
                  <span className="tp-score-lbl">STRONG MATCH</span>
                </div>
              </div>

              <div className="tp-why-title">Why we match:</div>
              <ul className="tp-why-list">
                {(profile.whyMatch || []).map((reason, idx) => (
                  <li key={idx} className="tp-why-item">
                    <span className="tp-why-icon">✓</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Availability Card */}
            <div className="tp-card">
              <h2 className="tp-card-title">
                <span>🕒</span> Availability
              </h2>

              <div className="tp-status-box">
                <div className="tp-status-dot" />
                <div>
                  <div className="tp-status-title">{profile.availability}</div>
                  <div className="tp-status-sub">{profile.availSub}</div>
                </div>
              </div>

              <div className="tp-commit-label">EXPECTED COMMITMENT</div>
              <div className="tp-commit-val">{profile.commitment}</div>
              <p className="tp-commit-sub">{profile.commitNote}</p>
            </div>
          </div>
        </div>

        {/* Floating Action Invite Button */}
        <button
          type="button"
          className={`tp-invite-float-btn ${invited ? 'invited' : ''}`}
          onClick={handleInvite}
          disabled={invited}
          id={`btn-invite-${profile._id || 'user'}`}
        >
          <span>{invited ? '✓ Invited!' : `👤+ Invite ${firstName} to Team`}</span>
        </button>
      </main>

      {/* Footer */}
      <footer className="tp-footer">
        <div className="tp-footer-container">
          <div className="rq-footer-brand">HackMate</div>
          <div className="rq-footer-copy">© 2024 HackMate. Built for builders.</div>
          <ul className="rq-footer-nav">
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
