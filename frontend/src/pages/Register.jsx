import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, UserPlus, Loader2 } from 'lucide-react';
import Alert from '../components/Alert';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ message: '', type: 'error' });
  const navigate = useNavigate();
  const specialCharRegex = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;

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

    // Client-side validations
    if (!email || !password || !confirmPassword) {
      setAlert({ message: 'Vui lòng điền đầy đủ các thông tin bắt buộc', type: 'error' });
      return;
    }

    if (password.length < 6) {
      setAlert({ message: 'Mật khẩu phải chứa ít nhất 6 ký tự', type: 'error' });
      return;
    }

    if (password !== confirmPassword) {
      setAlert({ message: 'Xác nhận mật khẩu không khớp', type: 'error' });
      return;
    }

    if (!specialCharRegex.test(password)) {
      setAlert({ message: 'Yêu cầu mật khẩu chứa ít nhất một kí tự đặc biệt', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          name: name || undefined, // Send name if provided
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Đăng ký thất bại. Vui lòng thử lại.');
      }

      setAlert({ message: 'Đăng ký tài khoản thành công! Đang chuyển sang trang Đăng nhập...', type: 'success' });

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
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
          <UserPlus size={26} style={{ color: 'var(--primary)' }} />
          <span>Yorbid</span>
        </div>

        <div className="brand-content">
          <h1 className="brand-tagline">
            Bảo vệ tài nguyên và thông tin của bạn
          </h1>
          <p className="brand-description">
            Đăng ký tài khoản ngay hôm nay để trải nghiệm cơ chế xác thực JWT bảo mật cao, giao diện kính mờ sang trọng và phản hồi tức thì.
          </p>

          <div className="brand-features">
            <div className="brand-feature-item">
              <div className="brand-feature-icon">
                <UserPlus size={18} />
              </div>
              <div>Khởi tạo tài khoản hoàn toàn miễn phí</div>
            </div>

            <div className="brand-feature-item">
              <div className="brand-feature-icon">
                <UserPlus size={18} />
              </div>
              <div>Xác thực mật khẩu mạnh mẽ tích hợp regex</div>
            </div>

            <div className="brand-feature-item">
              <div className="brand-feature-icon">
                <UserPlus size={18} />
              </div>
              <div>Bảo mật cơ sở dữ liệu với hash bcrypt</div>
            </div>
          </div>
        </div>

        <div className="brand-footer">
          &copy; 2026 Antigravity. Tất cả quyền được bảo lưu.
        </div>
      </div>

      {/* Right panel: Register Form */}
      <div className="form-section">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">
              <UserPlus size={24} />
            </div>
            <h2 className="auth-title">Đăng Ký</h2>
            <p className="auth-subtitle">Tạo tài khoản mới hoàn toàn miễn phí</p>
          </div>

          <Alert message={alert.message} type={alert.type} />

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="name">Họ và tên (Tùy chọn)</label>
              <div className="input-wrapper">
                <User className="input-icon" size={18} />
                <input
                  id="name"
                  type="text"
                  className="auth-input"
                  placeholder="Nguyễn Văn A"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

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
                  placeholder="Tối thiểu 6 ký tự"
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

            <div className="form-group">
              <label className="form-label" htmlFor="confirmPassword">Xác nhận mật khẩu</label>
              <div className="input-wrapper">
                <Lock className="input-icon" size={18} />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="auth-input password-input"
                  placeholder="Nhập lại mật khẩu"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex="-1"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
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
                  Đang tạo tài khoản...
                </>
              ) : (
                <>
                  <UserPlus size={18} />
                  Đăng Ký
                </>
              )}
            </button>
          </form>

          <div className="auth-footer">
            Đã có tài khoản?
            <Link to="/login" className="auth-link">Đăng nhập</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
