import React, { useEffect, useRef } from 'react';

// ── Icons ──────────────────────────────────────────────────
const XIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);
const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const SendIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" />
  </svg>
);

// ── Helpers ────────────────────────────────────────────────
function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function getMatchLevel(pct) {
  if (pct >= 75) return 'high';
  if (pct >= 45) return 'mid';
  return 'low';
}

// ── ProfileModal ───────────────────────────────────────────
export default function ProfileModal({ teammate, onClose, onInvite, inviteState }) {
  const overlayRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  if (!teammate) return null;

  const profile = teammate;
  const name = profile.fullName || profile.userId?.name || 'Unknown';
  const email = profile.userId?.email || '';
  const matchPct = profile._matchPct ?? 70;
  const matchLevel = getMatchLevel(matchPct);

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  const isInvited = inviteState === 'invited';
  const isLoading = inviteState === 'loading';

  return (
    <div className="ft-modal-overlay" ref={overlayRef} onClick={handleOverlayClick}>
      <div className="ft-modal" role="dialog" aria-modal="true" aria-label={`${name}'s profile`}>
        {/* Banner */}
        <div className="ft-modal-banner">
          <button className="ft-modal-close" onClick={onClose} aria-label="Close profile">
            <XIcon />
          </button>
        </div>

        {/* Body */}
        <div className="ft-modal-body">
          {/* Avatar + Name */}
          <div className="ft-modal-avatar-row">
            <div className="ft-modal-avatar">
              {profile.photo
                ? <img src={profile.photo} alt={name} />
                : getInitials(name)}
            </div>
            <div className="ft-modal-name-block">
              <p className="ft-modal-name">{name}</p>
              {email && <p className="ft-modal-email">{email}</p>}
            </div>
          </div>

          {/* Badges */}
          <div className="ft-modal-badges">
            <span className={`ft-match-badge ${matchLevel}`}>
              ⚡ {matchPct}% Match
            </span>
            <span className="ft-role-badge">
              {profile.preferredRole || 'Developer'}
            </span>
            {profile.availability && (
              <span className="ft-avail-badge">
                🟢 {profile.availability}
              </span>
            )}
          </div>

          {/* Bio */}
          {profile.bio && (
            <div className="ft-modal-section">
              <p className="ft-modal-section-title">About</p>
              <p className="ft-modal-bio">{profile.bio}</p>
            </div>
          )}

          {/* Stats grid */}
          <div className="ft-modal-section">
            <p className="ft-modal-section-title">Details</p>
            <div className="ft-modal-meta-grid">
              <div className="ft-modal-meta-item">
                <p className="ft-modal-meta-label">College</p>
                <p className="ft-modal-meta-value">{profile.college || '—'}</p>
              </div>
              <div className="ft-modal-meta-item">
                <p className="ft-modal-meta-label">Course</p>
                <p className="ft-modal-meta-value">{profile.course || '—'}</p>
              </div>
              <div className="ft-modal-meta-item">
                <p className="ft-modal-meta-label">Year</p>
                <p className="ft-modal-meta-value">Year {profile.year || '—'}</p>
              </div>
              <div className="ft-modal-meta-item">
                <p className="ft-modal-meta-label">Hackathons</p>
                <p className="ft-modal-meta-value">{profile.hackathonsAttended ?? 0} attended</p>
              </div>
            </div>
          </div>

          {/* Technical Skills */}
          {profile.technicalSkills?.length > 0 && (
            <div className="ft-modal-section">
              <p className="ft-modal-section-title">Technical Skills</p>
              <div className="ft-modal-chips">
                {profile.technicalSkills.map((s, i) => (
                  <span key={i} className="ft-modal-chip">{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Non-Technical Skills */}
          {profile.nonTechnicalSkills?.length > 0 && (
            <div className="ft-modal-section">
              <p className="ft-modal-section-title">Non-Technical Skills</p>
              <div className="ft-modal-chips">
                {profile.nonTechnicalSkills.map((s, i) => (
                  <span key={i} className="ft-modal-chip non-tech">{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Interests */}
          {profile.interests?.length > 0 && (
            <div className="ft-modal-section">
              <p className="ft-modal-section-title">Interests</p>
              <div className="ft-modal-chips">
                {profile.interests.map((interest, i) => (
                  <span key={i} className="ft-modal-chip interest">{interest}</span>
                ))}
              </div>
            </div>
          )}

          <div className="ft-modal-divider" />

          {/* Actions */}
          <div className="ft-modal-actions">
            <button className="ft-modal-btn-close" onClick={onClose}>
              Close
            </button>
            <button
              className={`ft-modal-btn-invite${isInvited ? ' invited' : ''}`}
              onClick={() => !isInvited && !isLoading && onInvite(profile)}
              disabled={isInvited || isLoading}
            >
              {isInvited ? (
                <><CheckIcon /> Invited!</>
              ) : isLoading ? (
                'Sending...'
              ) : (
                <><SendIcon /> Invite to Team</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
