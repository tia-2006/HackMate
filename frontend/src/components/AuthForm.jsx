import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Custom SVG Icons for self-contained UI
const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const MailIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const LockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
    <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
    <line x1="2" x2="22" y1="2" y2="22" />
  </svg>
);



const CheckCircleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const AlertCircleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" x2="12" y1="8" y2="12" />
    <line x1="12" x2="12.01" y1="16" y2="16" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5" /><path d="m12 19-7-7 7-7" />
  </svg>
);

export default function AuthForm() {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiResponse, setApiResponse] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setApiResponse(null);

    // Using relative paths — Vite proxy forwards /api/* → http://localhost:5000
    const endpoint = isRegister
      ? '/api/users/register'
      : '/api/users/login';

    const payload = isRegister
      ? { name: formData.name, email: formData.email, password: formData.password }
      : { email: formData.email, password: formData.password };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        setApiResponse({
          type: 'success',
          message: data.message || (isRegister ? 'Account created successfully!' : 'Login successful!'),
          user: data.user,
          token: data.token,
          data: data,
        });

        if (data.token) {
          localStorage.setItem('hackmate_token', data.token);
          // Redirect to dashboard/home after short delay
          setTimeout(() => navigate('/'), 1500);
        }
      } else {
        setApiResponse({
          type: 'error',
          message: data.message || 'Authentication request failed.',
          data: data,
        });
      }
    } catch (err) {
      setApiResponse({
        type: 'error',
        message: 'Could not connect to server. Ensure the backend is running on port 5000.',
        errorDetail: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsRegister(!isRegister);
    setApiResponse(null);
  };

  return (
    <div className="auth-page">
      {/* Back to Home */}
      <button className="auth-back-btn" onClick={() => navigate('/')}>
        <ArrowLeftIcon />
        Back to Home
      </button>

      <div className="auth-wrapper">
        {/* Brand Header */}
        <div className="brand-header">
          <div className="brand-badge">
            <span className="brand-icon">⚡</span>
            <span className="brand-name">HackMate</span>
          </div>
          <h1 className="auth-title">
            {isRegister ? 'Create Your Account' : 'Welcome Back'}
          </h1>
          <p className="auth-subtitle">
            {isRegister
              ? 'Join HackMate to connect with your hackathon team'
              : 'Sign in to continue to your hackathon team'}
          </p>
        </div>

        {/* Main Auth Card */}
        <div className="auth-card">
          <form onSubmit={handleSubmit} className="auth-form">
            {/* Full Name Field (Only in Register Mode) */}
            {isRegister && (
              <div className="input-group">
                <label className="input-label" htmlFor="name">Full Name</label>
                <div className="input-wrapper">
                  <span className="input-icon"><UserIcon /></span>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    placeholder="e.g. Alex Johnson"
                    value={formData.name}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div className="input-group">
              <label className="input-label" htmlFor="email">College Email</label>
              <div className="input-wrapper">
                <span className="input-icon"><MailIcon /></span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="you@university.edu"
                  value={formData.email}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="input-group">
              <div className="input-label-row">
                <label className="input-label" htmlFor="password">Password</label>
                {!isRegister && (
                  <a href="#forgot" className="forgot-link" onClick={(e) => e.preventDefault()}>
                    Forgot Password?
                  </a>
                )}
              </div>
              <div className="input-wrapper">
                <span className="input-icon"><LockIcon /></span>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className="form-input"
                />
                <button
                  type="button"
                  className="toggle-password-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? (
                <span className="btn-spinner">Processing...</span>
              ) : isRegister ? (
                'Create Account'
              ) : (
                'Sign In'
              )}
            </button>
          </form>



          {/* API Response Banner */}
          {apiResponse && (
            <div className={`response-banner ${apiResponse.type}`}>
              <div className="banner-header">
                {apiResponse.type === 'success' ? <CheckCircleIcon /> : <AlertCircleIcon />}
                <span className="banner-title">{apiResponse.message}</span>
              </div>

              {apiResponse.type === 'success' && apiResponse.user && (
                <div className="user-welcome-info">
                  <p className="welcome-user-text">
                    Welcome, <strong>{apiResponse.user.name}</strong> ({apiResponse.user.email})!
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Switch Mode Footer */}
        <div className="auth-footer">
          {isRegister ? (
            <p>
              Already have an account?{' '}
              <button type="button" onClick={toggleMode} className="switch-mode-btn">Sign In</button>
            </p>
          ) : (
            <p>
              Don't have an account?{' '}
              <button type="button" onClick={toggleMode} className="switch-mode-btn">Sign Up</button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
