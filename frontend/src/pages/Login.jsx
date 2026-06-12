import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, LogIn, Loader2 } from 'lucide-react';
import Alert from '../components/Alert';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ message: '', type: 'error' });
  const navigate = useNavigate();

  useEffect(() => {
    // If user is already logged in, redirect to dashboard
    const token = localStorage.getItem('access_token');
    if (token) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert({ message: '', type: 'error' });

    // Client-side validation
    if (!email || !password) {
      setAlert({ message: 'Vui lòng nhập đầy đủ email và mật khẩu', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Email hoặc mật khẩu không chính xác');
      }

      // Save token and navigate
      localStorage.setItem('access_token', data.access_token);
      setAlert({ message: 'Đăng nhập thành công! Đang chuyển hướng...', type: 'success' });

      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } catch (err) {
      setAlert({ message: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="auth-split-container">
      {/* Left panel: Brand Showcase */}
      <div className="brand-section">
        <div className="brand-glow"></div>

        <div className="brand-header-logo">
          <LogIn size={26} style={{ color: 'var(--primary)' }} />
          <span>Antigravity Portal</span>
        </div>

        <div className="brand-content">
          <h1 className="brand-tagline">
            Trải nghiệm nền tảng bảo mật thế hệ mới
          </h1>
          <p className="brand-description">
            Đăng nhập vào bảng điều khiển để quản lý dự án, theo dõi bảo mật thời gian thực và quản lý phân quyền dễ dàng.
          </p>

          <div className="brand-features">
            <div className="brand-feature-item">
              <div className="brand-feature-icon">
                <LogIn size={18} />
              </div>
              <div>Bảo mật chuẩn mã hóa JWT Token</div>
            </div>

            <div className="brand-feature-item">
              <div className="brand-feature-icon">
                <LogIn size={18} />
              </div>
              <div>Giao diện Glassmorphic hiện đại và mượt mà</div>
            </div>

            <div className="brand-feature-item">
              <div className="brand-feature-icon">
                <LogIn size={18} />
              </div>
              <div>Tối ưu hóa và bảo vệ tài khoản đa lớp</div>
            </div>
          </div>
        </div>

        <div className="brand-footer">
          &copy; 2026 Antigravity. Tất cả quyền được bảo lưu.
        </div>
      </div>

      {/* Right panel: Login Form */}
      <div className="form-section">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">
              <LogIn size={24} />
            </div>
            <h2 className="auth-title">Đăng Nhập</h2>
            <p className="auth-subtitle">Chào mừng bạn quay trở lại</p>
          </div>

          <Alert message={alert.message} type={alert.type} />

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email</label>
              <div className="input-wrapper">
                <Mail className="input-icon" size={18} />
                <input
                  id="email"
                  type="email"
                  className="auth-input"
                  placeholder="ten@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Mật khẩu</label>
              <div className="input-wrapper">
                <Lock className="input-icon" size={18} />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input password-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex="-1"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn-submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="spinner" />
                  Đang đăng nhập...
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  Đăng Nhập
                </>
              )}
            </button>
          </form>

          <div className="auth-footer">
            Chưa có tài khoản?
            <Link to="/register" className="auth-link">Đăng ký ngay</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
