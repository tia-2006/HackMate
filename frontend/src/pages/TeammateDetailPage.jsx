import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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

export default function TeammateDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [profile, setProfile] = useState(ALEX_CHEN_MOCK);
  const [invited, setInvited] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    const token = localStorage.getItem('hackmate_token');

    setLoading(true);
    fetch(`/api/profile/${id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
      .then(res => res.json())
      .then(data => {
        if (data.profile) {
          setProfile({
            ...ALEX_CHEN_MOCK,
            ...data.profile,
            fullName: data.profile.fullName || ALEX_CHEN_MOCK.fullName,
            college: `${data.profile.college || 'Stanford'} • Year ${data.profile.year || 3}`,
            photo: data.profile.photo || ALEX_CHEN_MOCK.photo
          });
        }
      })
      .catch(() => setProfile(ALEX_CHEN_MOCK))
      .finally(() => setLoading(false));
  }, [id]);

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
          body: JSON.stringify({ receiverId: profile.userId?._id || profile._id })
        });
      } catch (err) {
        console.error(err);
      }
    }
  };

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
      <header className="tp-topbar">
        <div className="tp-topbar-container">
          <div className="tp-brand" onClick={() => navigate('/')}>
            HackMate
          </div>

          <nav>
            <ul className="tp-nav-menu">
              {navLinks.map(link => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className={`tp-nav-link ${link.active ? 'active' : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(link.href);
                    }}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="tp-topbar-right">
            <button
              className="rq-avatar-btn"
              aria-label="User Profile"
              onClick={() => navigate('/profile')}
            >
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                alt="Profile Avatar"
              />
            </button>
          </div>
        </div>
      </header>

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
          id="btn-invite-alex"
        >
          <span>{invited ? '✓ Invited!' : '👤+ Invite Alex to Team'}</span>
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
