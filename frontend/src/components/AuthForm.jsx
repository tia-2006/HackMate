import React, { useState } from 'react';

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

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
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

export default function AuthForm() {
  const [isRegister, setIsRegister] = useState(true);
  const [formData, setFormData] = useState({
    name: 'Tia',
    email: 'tia@gmail.com',
    password: 'tia123'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiResponse, setApiResponse] = useState(null);
  const [showRawJson, setShowRawJson] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setApiResponse(null);

    const endpoint = isRegister
      ? 'http://localhost:5000/api/users/register'
      : 'http://localhost:5000/api/users/login';

    const payload = isRegister
      ? { name: formData.name, email: formData.email, password: formData.password }
      : { email: formData.email, password: formData.password };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
        message: 'Could not connect to server at http://localhost:5000. Ensure the backend server is running.',
        errorDetail: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsRegister(!isRegister);
    setApiResponse(null);
    setShowRawJson(false);
  };

  return (
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
              <label className="input-label" htmlFor="name">
                Full Name
              </label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <UserIcon />
                </span>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  placeholder="e.g. Tia"
                  value={formData.name}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
            </div>
          )}

          {/* Email Field */}
          <div className="input-group">
            <label className="input-label" htmlFor="email">
              College Email
            </label>
            <div className="input-wrapper">
              <span className="input-icon">
                <MailIcon />
              </span>
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
              <label className="input-label" htmlFor="password">
                Password
              </label>
              {!isRegister && (
                <a href="#forgot" className="forgot-link" onClick={(e) => e.preventDefault()}>
                  Forgot Password?
                </a>
              )}
            </div>
            <div className="input-wrapper">
              <span className="input-icon">
                <LockIcon />
              </span>
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

        {/* Divider */}
        <div className="divider">
          <span>Or continue with</span>
        </div>

        {/* Third Party Login Placeholder */}
        <button
          type="button"
          className="google-btn"
          onClick={() => alert('Google Sign In integration ready.')}
        >
          <GoogleIcon />
          <span>Sign in with Google</span>
        </button>

        {/* Clean User Feedback Banner */}
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

            {/* Optional Collapsible Debug View */}
            {apiResponse.data && (
              <div className="debug-toggle-container">
                <button
                  type="button"
                  className="debug-toggle-btn"
                  onClick={() => setShowRawJson(!showRawJson)}
                >
                  {showRawJson ? 'Hide Backend Response Payload' : 'View Backend Response Payload'}
                </button>

                {showRawJson && (
                  <div className="response-details">
                    <pre>{JSON.stringify(apiResponse.data, null, 2)}</pre>
                  </div>
                )}
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
            <button type="button" onClick={toggleMode} className="switch-mode-btn">
              Sign In
            </button>
          </p>
        ) : (
          <p>
            Don't have an account?{' '}
            <button type="button" onClick={toggleMode} className="switch-mode-btn">
              Sign Up
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
