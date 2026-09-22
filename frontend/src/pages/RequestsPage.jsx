import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/RequestsPage.css';

// ── Fallback sample requests matching screenshot ─────────────────────
const MOCK_RECEIVED_REQUESTS = [
  {
    _id: 'mock_req_1',
    sender: { _id: 'u_alex', name: 'Alex Chen', email: 'alex@hackmate.io' },
    senderProfile: {
      fullName: 'Alex Chen',
      photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
    team: { name: 'Data Wizards' },
    requestedRole: 'Frontend Dev',
    status: 'pending',
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'mock_req_2',
    sender: { _id: 'u_sarah', name: 'Sarah Jenkins', email: 'sarah@hackmate.io' },
    senderProfile: {
      fullName: 'Sarah Jenkins',
      photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    },
    team: { name: 'Hack & Slash' },
    requestedRole: 'UX Designer',
    status: 'pending',
    createdAt: new Date().toISOString(),
  },
];

const MOCK_SENT_REQUESTS = [
  {
    _id: 'mock_sent_1',
    receiver: { _id: 'u_david', name: 'David Kim', email: 'david@hackmate.io' },
    receiverProfile: {
      fullName: 'David Kim',
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    },
    team: { name: 'Code Warriors' },
    requestedRole: 'Backend Developer',
    status: 'pending',
    createdAt: new Date().toISOString(),
  }
];

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function RequestsPage() {
  const navigate = useNavigate();

  // State
  const [activeTab, setActiveTab] = useState('received'); // 'received' | 'sent'
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // ── Fetch requests from backend ────────────────────────────────────
  const fetchRequests = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem('hackmate_token');

    if (!token) {
      // Use fallback mock data if unauthenticated so user can preview UI
      setReceivedRequests(MOCK_RECEIVED_REQUESTS);
      setSentRequests(MOCK_SENT_REQUESTS);
      setLoading(false);
      return;
    }

    try {
      const [recvRes, sentRes] = await Promise.all([
        fetch('/api/requests/received?status=all', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/requests/sent?status=all', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const recvData = await recvRes.json();
      const sentData = await sentRes.json();

      if (recvRes.ok && Array.isArray(recvData.requests)) {
        setReceivedRequests(recvData.requests);
      } else {
        setReceivedRequests(MOCK_RECEIVED_REQUESTS);
      }

      if (sentRes.ok && Array.isArray(sentData.requests)) {
        setSentRequests(sentData.requests);
      } else {
        setSentRequests(MOCK_SENT_REQUESTS);
      }
    } catch (err) {
      console.error('Failed to fetch requests from server:', err);
      setReceivedRequests(MOCK_RECEIVED_REQUESTS);
      setSentRequests(MOCK_SENT_REQUESTS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // ── Action Handlers ────────────────────────────────────────────────
  const handleAccept = async (requestId) => {
    const token = localStorage.getItem('hackmate_token');
    setActionLoading(prev => ({ ...prev, [requestId]: 'accepting' }));

    if (token && !requestId.startsWith('mock_')) {
      try {
        const res = await fetch(`/api/requests/${requestId}/accept`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.message || 'Failed to accept request');
        }
        await fetchRequests();
      } catch (err) {
        alert(err.message);
      }
    } else {
      setReceivedRequests(prev =>
        prev.map(r => r._id === requestId ? { ...r, status: 'accepted' } : r)
      );
    }
    setActionLoading(prev => ({ ...prev, [requestId]: null }));
  };

  const handleDecline = async (requestId) => {
    const token = localStorage.getItem('hackmate_token');
    setActionLoading(prev => ({ ...prev, [requestId]: 'declining' }));

    if (token && !requestId.startsWith('mock_')) {
      try {
        const res = await fetch(`/api/requests/${requestId}/reject`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.message || 'Failed to decline request');
        }
        await fetchRequests();
      } catch (err) {
        alert(err.message);
      }
    } else {
      setReceivedRequests(prev =>
        prev.map(r => r._id === requestId ? { ...r, status: 'rejected' } : r)
      );
    }
    setActionLoading(prev => ({ ...prev, [requestId]: null }));
  };

  const handleCancelSent = async (requestId) => {
    const token = localStorage.getItem('hackmate_token');
    setActionLoading(prev => ({ ...prev, [requestId]: 'canceling' }));

    if (token && !requestId.startsWith('mock_')) {
      try {
        const res = await fetch(`/api/requests/${requestId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.message || 'Failed to cancel request');
        }
        await fetchRequests();
      } catch (err) {
        alert(err.message);
      }
    } else {
      setSentRequests(prev => prev.filter(r => r._id !== requestId));
    }
    setActionLoading(prev => ({ ...prev, [requestId]: null }));
  };

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Teammates', href: '/teammates' },
    { label: 'Matches', href: '/matches' },
    { label: 'My Team', href: '/team' },
    { label: 'Requests', href: '/requests', active: true },
  ];

  const currentRequests = activeTab === 'received' ? receivedRequests : sentRequests;

  return (
    <div className="rq-page">
      {/* ── Header Topbar ────────────────────────────────────────────── */}
      <header className="rq-topbar">
        <div className="rq-topbar-container">
          <div className="rq-brand" onClick={() => navigate('/')}>
            HackMate
          </div>

          <nav>
            <ul className="rq-nav-menu">
              {navLinks.map(link => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className={`rq-nav-link ${link.active ? 'active' : ''}`}
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

          <div className="rq-topbar-right">
            <button
              className="rq-icon-btn"
              aria-label="Notifications"
              onClick={() => setNotificationsOpen(!notificationsOpen)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span className="rq-bell-badge" />
            </button>

            <button
              className="rq-avatar-btn"
              aria-label="User Profile"
              onClick={() => navigate('/profile')}
              title="My Profile"
            >
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                alt="Profile Avatar"
              />
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Content Area ────────────────────────────────────────── */}
      <main className="rq-main">
        <div className="rq-header">
          <h1 className="rq-title">Requests</h1>
          <p className="rq-subtitle">Manage your incoming and outgoing team invitations.</p>
        </div>

        {/* Sub-tabs */}
        <div className="rq-tabs-container">
          <button
            type="button"
            className={`rq-tab-btn ${activeTab === 'received' ? 'active' : ''}`}
            onClick={() => setActiveTab('received')}
            id="tab-received"
          >
            Received
          </button>
          <button
            type="button"
            className={`rq-tab-btn ${activeTab === 'sent' ? 'active' : ''}`}
            onClick={() => setActiveTab('sent')}
            id="tab-sent"
          >
            Sent
          </button>
        </div>

        {/* Requests Card & Table */}
        <div className="rq-card">
          {loading ? (
            <div className="rq-empty">Loading requests...</div>
          ) : currentRequests.length === 0 ? (
            <div className="rq-empty">
              <span className="rq-empty-icon">✉️</span>
              <p className="rq-empty-title">No requests found</p>
              <p>You have no {activeTab} team invitations at this moment.</p>
            </div>
          ) : (
            <table className="rq-table">
              <thead>
                <tr>
                  <th>{activeTab === 'received' ? 'INVITER' : 'RECEIVER'}</th>
                  <th>TEAM NAME</th>
                  <th>REQUESTED ROLE</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {currentRequests.map((item) => {
                  const person = activeTab === 'received' ? item.sender : item.receiver;
                  const profile = activeTab === 'received' ? item.senderProfile : item.receiverProfile;
                  const name = profile?.fullName || person?.name || 'Unknown User';
                  const photo = profile?.photo;
                  const teamName = item.team?.name || 'Data Wizards';
                  const role = item.requestedRole || 'Frontend Dev';
                  const isPending = item.status === 'pending';

                  return (
                    <tr key={item._id}>
                      {/* Inviter / Receiver Person */}
                      <td>
                        <div className="rq-user-cell">
                          {photo ? (
                            <img src={photo} alt={name} className="rq-user-avatar" />
                          ) : (
                            <div className="rq-user-avatar-initial">{getInitials(name)}</div>
                          )}
                          <span className="rq-user-name">{name}</span>
                        </div>
                      </td>

                      {/* Team Name */}
                      <td>
                        <span className="rq-team-name">{teamName}</span>
                      </td>

                      {/* Requested Role */}
                      <td>
                        <span className="rq-role-badge">{role}</span>
                      </td>

                      {/* Actions */}
                      <td>
                        <div className="rq-actions-cell">
                          {activeTab === 'received' ? (
                            isPending ? (
                              <>
                                <button
                                  type="button"
                                  className="rq-btn-accept"
                                  onClick={() => handleAccept(item._id)}
                                  disabled={actionLoading[item._id]}
                                  id={`accept-${item._id}`}
                                >
                                  {actionLoading[item._id] === 'accepting' ? 'Accepting...' : 'Accept'}
                                </button>
                                <button
                                  type="button"
                                  className="rq-btn-decline"
                                  onClick={() => handleDecline(item._id)}
                                  disabled={actionLoading[item._id]}
                                  id={`decline-${item._id}`}
                                >
                                  {actionLoading[item._id] === 'declining' ? 'Declining...' : 'Decline'}
                                </button>
                              </>
                            ) : (
                              <span className={`rq-status-badge ${item.status}`}>
                                {item.status}
                              </span>
                            )
                          ) : (
                            <>
                              {isPending ? (
                                <button
                                  type="button"
                                  className="rq-btn-cancel"
                                  onClick={() => handleCancelSent(item._id)}
                                  disabled={actionLoading[item._id]}
                                  id={`cancel-${item._id}`}
                                >
                                  {actionLoading[item._id] === 'canceling' ? 'Canceling...' : 'Cancel'}
                                </button>
                              ) : (
                                <span className={`rq-status-badge ${item.status}`}>
                                  {item.status}
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="rq-footer">
        <div className="rq-footer-container">
          <div className="rq-footer-brand">HackMate</div>

          <ul className="rq-footer-nav">
            <li><a href="#about">About</a></li>
            <li><a href="#privacy">Privacy</a></li>
            <li><a href="#terms">Terms</a></li>
            <li><a href="#support">Support</a></li>
          </ul>

          <div className="rq-footer-copy">
            © 2024 HackMate. Built for builders.
          </div>
        </div>
      </footer>
    </div>
  );
}
