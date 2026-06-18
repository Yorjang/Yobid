import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';
import Alert from '../components/Alert';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ message: '', type: 'error' });
  const [focusedField, setFocusedField] = useState(null);
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert({ message: '', type: 'error' });

    if (!email || !password) {
      setAlert({ message: 'Please enter your email and password', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Invalid email or password');
      }

      localStorage.setItem('access_token', data.access_token);
      setAlert({ message: 'Login successful! Redirecting...', type: 'success' });

      setTimeout(() => navigate('/dashboard'), 1000);
    } catch (err) {
      setAlert({ message: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cu-page">
      {/* Left decorative panel */}
      <div className="cu-left-panel">
        <div className="cu-left-inner">
          {/* Logo */}
          <div className="cu-brand-logo">
            <div className="cu-brand-icon">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path d="M4 20L10 14L14 18L20 10L24 14" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="14" cy="14" r="12" stroke="white" strokeWidth="2" opacity="0.3"/>
              </svg>
            </div>
            <span className="cu-brand-name">Yobid</span>
          </div>

          {/* Hero content */}
          <div className="cu-hero">
            <div className="cu-hero-badge">✨ The #1 Project Management Platform</div>
            <h1 className="cu-hero-title">
              Everything you need to
              <span className="cu-hero-highlight"> work smarter</span>
            </h1>
            <p className="cu-hero-desc">
              Manage tasks, track progress, and collaborate with your team — all in one powerful platform.
            </p>

            <div className="cu-feature-list">
              {[
                'Visual task & deadline management',
                'Role-based access & team collaboration',
                'Real-time reporting dashboard',
              ].map((feature, i) => (
                <div className="cu-feature-item" key={i}>
                  <CheckCircle2 size={16} className="cu-check-icon" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Floating card mockups */}
          <div className="cu-mockup-cards">
            <div className="cu-mock-card cu-mock-card--top">
              <div className="cu-mock-avatar" style={{ background: 'linear-gradient(135deg, #7C3AED, #A855F7)' }}>A</div>
              <div className="cu-mock-info">
                <div className="cu-mock-title">Completed Sprint #4</div>
                <div className="cu-mock-sub">3 tasks · Today</div>
              </div>
              <div className="cu-mock-badge cu-mock-badge--done">Done</div>
            </div>
            <div className="cu-mock-card cu-mock-card--mid">
              <div className="cu-mock-avatar" style={{ background: 'linear-gradient(135deg, #2563EB, #06B6D4)' }}>B</div>
              <div className="cu-mock-info">
                <div className="cu-mock-title">Review UI Design</div>
                <div className="cu-mock-sub">5 members · In Progress</div>
              </div>
              <div className="cu-mock-badge cu-mock-badge--progress">In Progress</div>
            </div>
          </div>

          {/* Footer */}
          <div className="cu-left-footer">
            © 2026 Yobid. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right: Login form */}
      <div className="cu-right-panel">
        <div className="cu-form-card">
          {/* Mobile logo */}
          <div className="cu-mobile-logo">
            <div className="cu-brand-icon cu-brand-icon--sm">
              <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
                <path d="M4 20L10 14L14 18L20 10L24 14" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="cu-brand-name">Yobid</span>
          </div>

          <div className="cu-form-header">
            <h2 className="cu-form-title">Welcome back 👋</h2>
            <p className="cu-form-subtitle">Sign in to continue where you left off</p>
          </div>

          <Alert message={alert.message} type={alert.type} />

          {/* Social login buttons */}
          <div className="cu-social-btns">
            <button
              type="button"
              className="cu-social-btn"
              id="btn-google-login"
              onClick={() => window.location.href = `${API_URL}/auth/google`}
            >
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
            <button
              type="button"
              className="cu-social-btn"
              id="btn-github-login"
              onClick={() => window.location.href = `${API_URL}/auth/github`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
              </svg>
              Continue with GitHub
            </button>
          </div>

          <div className="cu-divider">
            <span>or continue with email</span>
          </div>

          <form onSubmit={handleSubmit} className="cu-form">
            <div className={`cu-field ${focusedField === 'email' ? 'cu-field--focused' : ''} ${email ? 'cu-field--filled' : ''}`}>
              <label className="cu-label" htmlFor="login-email">Email</label>
              <div className="cu-input-wrap">
                <Mail size={16} className="cu-input-icon" />
                <input
                  id="login-email"
                  type="email"
                  className="cu-input"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  disabled={loading}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className={`cu-field ${focusedField === 'password' ? 'cu-field--focused' : ''} ${password ? 'cu-field--filled' : ''}`}>
              <div className="cu-label-row">
                <label className="cu-label" htmlFor="login-password">Password</label>
                <a href="#" className="cu-forgot-link" id="link-forgot-password">Forgot password?</a>
              </div>
              <div className="cu-input-wrap">
                <Lock size={16} className="cu-input-icon" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="cu-input cu-input--password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  disabled={loading}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="cu-eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex="-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              id="btn-submit-login"
              type="submit"
              className="cu-btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="cu-spinner" size={18} />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          <p className="cu-signup-prompt">
            Don't have an account?{' '}
            <Link to="/register" className="cu-signup-link" id="link-go-to-register">
              Sign up for free
            </Link>
          </p>

          <p className="cu-terms">
            By signing in, you agree to our{' '}
            <a href="#" className="cu-terms-link">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="cu-terms-link">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
