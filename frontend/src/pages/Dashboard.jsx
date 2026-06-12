import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Mail, Shield, ShieldAlert, Key, Award, Clock, Loader2 } from 'lucide-react';
import Alert from '../components/Alert';

export default function Dashboard() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const response = await fetch('http://localhost:3000/auth/profile', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            // Unauthenticated/Expired token
            localStorage.removeItem('access_token');
            navigate('/login');
            return;
          }
          throw new Error('Không thể tải thông tin cá nhân');
        }

        const data = await response.json();
        setProfile(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleSignOut = () => {
    localStorage.removeItem('access_token');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="auth-wrapper" style={{ minHeight: '80vh' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <Loader2 className="spinner" size={40} style={{ color: 'var(--primary)' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Đang tải thông tin tài khoản...</p>
        </div>
      </div>
    );
  }

  const userDisplayName = profile?.name || profile?.email?.split('@')[0] || 'Thành viên';
  const avatarLetter = userDisplayName.charAt(0).toUpperCase();



  return (
    <div className="dashboard-container">

      {/* Navigation Header */}
      <nav className="dashboard-nav">
        <div className="nav-brand">
          <Shield size={22} style={{ color: 'var(--primary)', flexShrink: 0 }} />
          <span>Antigravity Auth</span>
        </div>
        <div className="nav-user">
          {profile && (
            <div className="user-badge">
              <div className="user-avatar">{avatarLetter}</div>
              <span>{userDisplayName}</span>
            </div>
          )}
          <button className="btn-signout" onClick={handleSignOut}>
            <LogOut size={16} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="dashboard-content">
        {error && <Alert message={error} type="error" />}

        {profile && (
          <>
            {/* Welcome banner */}
            <div className="welcome-banner">
              <h1 className="welcome-title">Xin chào, {userDisplayName}! 👋</h1>
              <p className="welcome-subtitle">
                Chào mừng bạn đã đăng nhập thành công vào hệ thống. Tài khoản của bạn hiện được bảo mật hoàn toàn.
              </p>
            </div>

            {/* Stats section */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon-wrapper">
                  <Mail size={22} />
                </div>
                <div className="stat-info">
                  <span className="stat-label">Email tài khoản</span>
                  <span className="stat-value" style={{ fontSize: '1rem', wordBreak: 'break-all' }}>{profile.email}</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-wrapper" style={{ color: 'var(--success)' }}>
                  <Award size={22} />
                </div>
                <div className="stat-info">
                  <span className="stat-label">Trạng thái xác thực</span>
                  <span className="stat-value" style={{ color: '#34D399' }}>Đã xác minh (JWT)</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-wrapper" style={{ color: 'var(--secondary)' }}>
                  <Key size={22} />
                </div>
                <div className="stat-info">
                  <span className="stat-label">ID Người dùng</span>
                  <span className="stat-value">UID - #{profile.id || profile.userId || 'N/A'}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
