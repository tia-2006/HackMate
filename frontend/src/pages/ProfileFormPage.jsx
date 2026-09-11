import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/ProfileFormPage.css';

// ── Icons ──────────────────────────────────────────────────
const CameraIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
    <circle cx="12" cy="13" r="3" />
  </svg>
);

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const AlertCircleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5" /><path d="m12 19-7-7 7-7" />
  </svg>
);

const XIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const SparklesIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3z" />
  </svg>
);

// ── Sample Profile Object (from User Request) ──────────────
const SAMPLE_PROFILE = {
  fullName: "Alex Rivera",
  college: "Stanford University",
  year: 3,
  course: "Computer Science",
  bio: "Full-stack developer building AI apps.",
  photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb",
  preferredRole: "Full Stack Developer",
  technicalSkills: ["React", "Node.js", "MongoDB", "Python"],
  nonTechnicalSkills: ["Leadership", "Public Speaking"],
  hackathonsAttended: 3,
  availability: "full-time",
  interests: ["AI/ML", "Web3"]
};

// Available dropdown options
const ROLE_OPTIONS = [
  "Full Stack Developer",
  "Frontend Developer",
  "Backend Developer",
  "UI/UX Designer",
  "ML/AI Developer",
  "Mobile Developer",
  "DevOps Engineer",
  "Data Scientist"
];

const AVAILABILITY_OPTIONS = [
  "full-time",
  "Mostly Weekends",
  "Part-time",
  "Flexible"
];

const HACKATHON_OPTIONS = [
  { label: "0 (First Time!)", value: 0 },
  { label: "1", value: 1 },
  { label: "2", value: 2 },
  { label: "3", value: 3 },
  { label: "4", value: 4 },
  { label: "5+", value: 5 }
];

export default function ProfileFormPage() {
  const navigate = useNavigate();

  // Form fields state
  const [fullName, setFullName] = useState('');
  const [college, setCollege] = useState('');
  const [year, setYear] = useState('');
  const [course, setCourse] = useState('');
  const [bio, setBio] = useState('');
  const [photo, setPhoto] = useState('');

  const [preferredRole, setPreferredRole] = useState('');
  const [technicalSkills, setTechnicalSkills] = useState([]);
  const [techInput, setTechInput] = useState('');

  const [nonTechnicalSkills, setNonTechnicalSkills] = useState([]);
  const [nonTechInput, setNonTechInput] = useState('');

  const [hackathonsAttended, setHackathonsAttended] = useState(0);
  const [availability, setAvailability] = useState('');
  const [interests, setInterests] = useState([]);
  const [interestInput, setInterestInput] = useState('');

  // UI state
  const [hasExistingProfile, setHasExistingProfile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [notification, setNotification] = useState(null);
  const [showPhotoUrlModal, setShowPhotoUrlModal] = useState(false);

  // Check auth & fetch profile on mount
  useEffect(() => {
    const token = localStorage.getItem('hackmate_token');
    if (!token) {
      navigate('/auth', { replace: true });
      return;
    }

    const fetchMyProfile = async () => {
      setFetching(true);
      try {
        const res = await fetch('/api/profile/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.profile) {
            populateForm(data.profile);
            setHasExistingProfile(true);
          }
        } else {
          // Check draft in localStorage if no profile found on server
          const savedDraft = localStorage.getItem('hackmate_profile_draft');
          if (savedDraft) {
            try {
              const parsed = JSON.parse(savedDraft);
              populateForm(parsed);
              showNotice('Loaded saved draft from local browser storage.', 'info');
            } catch (e) { /* ignore */ }
          }
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setFetching(false);
      }
    };

    fetchMyProfile();
  }, [navigate]);

  const populateForm = (data) => {
    setFullName(data.fullName || '');
    setCollege(data.college || '');
    setYear(data.year !== undefined ? data.year : '');
    setCourse(data.course || '');
    setBio(data.bio || '');
    setPhoto(data.photo || '');
    setPreferredRole(data.preferredRole || '');
    setTechnicalSkills(Array.isArray(data.technicalSkills) ? data.technicalSkills : []);
    setNonTechnicalSkills(Array.isArray(data.nonTechnicalSkills) ? data.nonTechnicalSkills : []);
    setHackathonsAttended(data.hackathonsAttended !== undefined ? data.hackathonsAttended : 0);
    setAvailability(data.availability || '');
    setInterests(Array.isArray(data.interests) ? data.interests : []);
  };

  const showNotice = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // 1-Click Autofill Alex Rivera Sample
  const handleAutoFillSample = () => {
    populateForm(SAMPLE_PROFILE);
    showNotice('Loaded Alex Rivera sample profile data!', 'success');
  };

  // Tag helper functions
  const handleAddTechSkill = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && techInput.trim()) {
      e.preventDefault();
      const val = techInput.trim().replace(/^,|,$/g, '');
      if (val && !technicalSkills.includes(val)) {
        setTechnicalSkills([...technicalSkills, val]);
      }
      setTechInput('');
    }
  };

  const handleRemoveTechSkill = (skillToRemove) => {
    setTechnicalSkills(technicalSkills.filter(s => s !== skillToRemove));
  };

  const handleAddNonTechSkill = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && nonTechInput.trim()) {
      e.preventDefault();
      const val = nonTechInput.trim().replace(/^,|,$/g, '');
      if (val && !nonTechnicalSkills.includes(val)) {
        setNonTechnicalSkills([...nonTechnicalSkills, val]);
      }
      setNonTechInput('');
    }
  };

  const handleRemoveNonTechSkill = (skillToRemove) => {
    setNonTechnicalSkills(nonTechnicalSkills.filter(s => s !== skillToRemove));
  };

  const handleAddInterest = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && interestInput.trim()) {
      e.preventDefault();
      const val = interestInput.trim().replace(/^,|,$/g, '');
      if (val && !interests.includes(val)) {
        setInterests([...interests, val]);
      }
      setInterestInput('');
    }
  };

  const handleRemoveInterest = (interestToRemove) => {
    setInterests(interests.filter(i => i !== interestToRemove));
  };

  // Save as Draft
  const handleSaveDraft = () => {
    const draftData = {
      fullName,
      college,
      year: Number(year),
      course,
      bio,
      photo,
      preferredRole,
      technicalSkills,
      nonTechnicalSkills,
      hackathonsAttended: Number(hackathonsAttended),
      availability,
      interests
    };
    localStorage.setItem('hackmate_profile_draft', JSON.stringify(draftData));
    showNotice('Profile saved as draft in local storage!', 'info');
  };

  // Handle Submit (Create or Update Profile)
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!fullName || !college || !year || !course || !preferredRole || !availability) {
      showNotice('Please complete all required fields (Full Name, College, Year, Course, Preferred Role, Availability).', 'error');
      return;
    }

    const payload = {
      fullName,
      college,
      year: Number(year),
      course,
      bio,
      photo,
      preferredRole,
      technicalSkills,
      nonTechnicalSkills,
      hackathonsAttended: Number(hackathonsAttended),
      availability,
      interests
    };

    setLoading(true);
    const token = localStorage.getItem('hackmate_token');

    try {
      const endpoint = '/api/profile';
      const method = 'POST'; // Backend POST /api/profile handles upsert now

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.removeItem('hackmate_profile_draft');
        setHasExistingProfile(true);
        showNotice(data.message || 'Profile saved successfully! Redirecting...', 'success');
        setTimeout(() => {
          navigate('/teammates');
        }, 1500);
      } else {
        showNotice(data.message || 'Failed to save profile.', 'error');
      }
    } catch (err) {
      showNotice('Network error. Please check backend connection.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="pf-loading-container">
        <div className="pf-spinner" />
        <p>Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="pf-page">
      {/* Top Navbar */}
      <header className="pf-topbar">
        <div className="pf-topbar-inner">
          <button className="pf-back-btn" onClick={() => navigate('/teammates')}>
            <ArrowLeftIcon />
            <span>Back to Teammates</span>
          </button>
          <a href="/" className="pf-brand">
            <span className="pf-brand-icon">⚡</span>
            <span className="pf-brand-name">HackMate</span>
          </a>
          <button className="pf-autofill-btn" onClick={handleAutoFillSample} title="Fill Alex Rivera sample profile">
            <SparklesIcon />
            <span>Fill Sample Data</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="pf-container">
        {/* Header Titles */}
        <div className="pf-header">
          <h1 className="pf-title">
            {hasExistingProfile ? 'Edit Your Profile' : 'Complete Your Profile'}
          </h1>
          <p className="pf-subtitle">
            Let's get you set up to find the perfect hackathon team.
          </p>
        </div>

        {/* Form Notification Banner */}
        {notification && (
          <div className={`pf-notification ${notification.type}`}>
            {notification.type === 'success' ? <CheckCircleIcon /> : <AlertCircleIcon />}
            <span>{notification.message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="pf-form">

          {/* ── CARD 1: Basic Information ── */}
          <div className="pf-card">
            <h2 className="pf-card-title">Basic Information</h2>

            <div className="pf-basic-grid">
              {/* Photo Upload Box */}
              <div className="pf-photo-column">
                <div className="pf-avatar-box">
                  {photo ? (
                    <img src={photo} alt="Profile Avatar" className="pf-avatar-img" />
                  ) : (
                    <div className="pf-avatar-placeholder">
                      <CameraIcon />
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  className="pf-photo-upload-btn"
                  onClick={() => setShowPhotoUrlModal(true)}
                >
                  {photo ? 'Change Photo' : 'Upload Photo'}
                </button>
              </div>

              {/* Basic Fields */}
              <div className="pf-fields-column">
                {/* Full Name */}
                <div className="pf-field-group">
                  <label className="pf-label">Full Name <span className="pf-required">*</span></label>
                  <input
                    type="text"
                    className="pf-input"
                    placeholder="e.g. Jane Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>

                {/* College & Year row */}
                <div className="pf-row-2">
                  <div className="pf-field-group">
                    <label className="pf-label">College / University <span className="pf-required">*</span></label>
                    <input
                      type="text"
                      className="pf-input"
                      placeholder="e.g. MIT"
                      value={college}
                      onChange={(e) => setCollege(e.target.value)}
                      required
                    />
                  </div>

                  <div className="pf-field-group">
                    <label className="pf-label">Year of Study <span className="pf-required">*</span></label>
                    <select
                      className="pf-select"
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      required
                    >
                      <option value="" disabled>Select Year</option>
                      <option value={1}>1st Year</option>
                      <option value={2}>2nd Year</option>
                      <option value={3}>3rd Year</option>
                      <option value={4}>4th Year</option>
                      <option value={5}>5th Year / Grad</option>
                    </select>
                  </div>
                </div>

                {/* Course / Department */}
                <div className="pf-field-group">
                  <label className="pf-label">Course / Department <span className="pf-required">*</span></label>
                  <input
                    type="text"
                    className="pf-input"
                    placeholder="e.g. Computer Science"
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    required
                  />
                </div>

                {/* Short Bio */}
                <div className="pf-field-group">
                  <label className="pf-label">Short Bio</label>
                  <textarea
                    className="pf-textarea"
                    placeholder="Tell potential teammates a bit about yourself..."
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>


          {/* ── CARD 2: Skills & Roles ── */}
          <div className="pf-card">
            <h2 className="pf-card-title">Skills & Roles</h2>

            <div className="pf-card-body">
              {/* Preferred Role */}
              <div className="pf-field-group">
                <label className="pf-label">Preferred Role <span className="pf-required">*</span></label>
                <select
                  className="pf-select"
                  value={preferredRole}
                  onChange={(e) => setPreferredRole(e.target.value)}
                  required
                >
                  <option value="" disabled>Select Primary Role</option>
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>

              {/* Technical Skills */}
              <div className="pf-field-group">
                <label className="pf-label">Technical Skills</label>
                <div className="pf-input-search-wrapper">
                  <span className="pf-search-icon"><SearchIcon /></span>
                  <input
                    type="text"
                    className="pf-input pf-input-search"
                    placeholder="Search and add skills (e.g. React, Node.js, Python — press Enter)"
                    value={techInput}
                    onChange={(e) => setTechInput(e.target.value)}
                    onKeyDown={handleAddTechSkill}
                  />
                </div>

                {/* Tech Chips */}
                {technicalSkills.length > 0 && (
                  <div className="pf-tags-wrap">
                    {technicalSkills.map((skill, i) => (
                      <span key={i} className="pf-chip">
                        {skill}
                        <button
                          type="button"
                          className="pf-chip-remove"
                          onClick={() => handleRemoveTechSkill(skill)}
                          aria-label={`Remove ${skill}`}
                        >
                          <XIcon />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Non-Technical Skills */}
              <div className="pf-field-group">
                <label className="pf-label">Non-Technical Skills</label>
                <input
                  type="text"
                  className="pf-input"
                  placeholder="e.g. Public Speaking, Project Management, Pitching (press Enter)"
                  value={nonTechInput}
                  onChange={(e) => setNonTechInput(e.target.value)}
                  onKeyDown={handleAddNonTechSkill}
                />

                {/* Non-Tech Chips */}
                {nonTechnicalSkills.length > 0 && (
                  <div className="pf-tags-wrap">
                    {nonTechnicalSkills.map((skill, i) => (
                      <span key={i} className="pf-chip pf-chip-nontech">
                        {skill}
                        <button
                          type="button"
                          className="pf-chip-remove"
                          onClick={() => handleRemoveNonTechSkill(skill)}
                          aria-label={`Remove ${skill}`}
                        >
                          <XIcon />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>


          {/* ── CARD 3: Experience & Availability ── */}
          <div className="pf-card">
            <h2 className="pf-card-title">Experience & Availability</h2>

            <div className="pf-card-body">
              {/* Row: Hackathons & Availability */}
              <div className="pf-row-2">
                <div className="pf-field-group">
                  <label className="pf-label">Hackathons Attended</label>
                  <select
                    className="pf-select"
                    value={hackathonsAttended}
                    onChange={(e) => setHackathonsAttended(Number(e.target.value))}
                  >
                    {HACKATHON_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div className="pf-field-group">
                  <label className="pf-label">General Availability <span className="pf-required">*</span></label>
                  <select
                    className="pf-select"
                    value={availability}
                    onChange={(e) => setAvailability(e.target.value)}
                    required
                  >
                    <option value="" disabled>Select Availability</option>
                    {AVAILABILITY_OPTIONS.map((avail) => (
                      <option key={avail} value={avail}>{avail}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Areas of Interest */}
              <div className="pf-field-group">
                <label className="pf-label">Areas of Interest</label>
                <input
                  type="text"
                  className="pf-input"
                  placeholder="e.g. EdTech, Web3, HealthTech, FinTech, AI/ML (press Enter)"
                  value={interestInput}
                  onChange={(e) => setInterestInput(e.target.value)}
                  onKeyDown={handleAddInterest}
                />

                {/* Interest Chips */}
                {interests.length > 0 && (
                  <div className="pf-tags-wrap">
                    {interests.map((interest, i) => (
                      <span key={i} className="pf-chip pf-chip-interest">
                        {interest}
                        <button
                          type="button"
                          className="pf-chip-remove"
                          onClick={() => handleRemoveInterest(interest)}
                          aria-label={`Remove ${interest}`}
                        >
                          <XIcon />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>


          {/* ── Form Actions Bar ── */}
          <div className="pf-actions-row">
            <button
              type="button"
              className="pf-btn-draft"
              onClick={handleSaveDraft}
            >
              Save as Draft
            </button>

            <button
              type="submit"
              className="pf-btn-submit"
              disabled={loading}
            >
              {loading ? (
                <span>Saving Profile...</span>
              ) : hasExistingProfile ? (
                'Update Profile'
              ) : (
                'Create Profile'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Photo URL Modal */}
      {showPhotoUrlModal && (
        <div className="pf-modal-overlay" onClick={() => setShowPhotoUrlModal(false)}>
          <div className="pf-modal-box" onClick={(e) => e.stopPropagation()}>
            <h3 className="pf-modal-title">Profile Photo Image URL</h3>
            <p className="pf-modal-sub">Paste an image URL (Unsplash, GitHub avatar, Gravatar, etc.):</p>
            <input
              type="url"
              className="pf-input"
              placeholder="https://images.unsplash.com/..."
              value={photo}
              onChange={(e) => setPhoto(e.target.value)}
            />
            {photo && (
              <div className="pf-modal-preview">
                <img src={photo} alt="Preview" onError={(e) => { e.target.style.display = 'none'; }} />
              </div>
            )}
            <div className="pf-modal-actions">
              <button
                type="button"
                className="pf-btn-draft"
                onClick={() => setPhoto('')}
              >
                Clear Photo
              </button>
              <button
                type="button"
                className="pf-btn-submit"
                onClick={() => setShowPhotoUrlModal(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
