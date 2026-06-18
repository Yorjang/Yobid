import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogOut, Mail, Shield, Key, Award, Loader2,
  LayoutDashboard, CheckSquare, Users, BarChart2,
  Bell, Settings, Zap, TrendingUp, Clock,
  ChevronLeft, ChevronRight, ChevronDown,
  Smile, BellOff, Palette, Keyboard, Download,
  HelpCircle, Briefcase, FileText, Video,
  AlarmClock, Sparkles, Trash2, Pin,
} from 'lucide-react';

export default function Dashboard() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('sidebarOpen');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const toggleSidebar = () => {
    setSidebarOpen(prev => {
      const next = !prev;
      localStorage.setItem('sidebarOpen', JSON.stringify(next));
      return next;
    });
  };
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const res = await fetch(`${API_URL}/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          if (res.status === 401) {
            localStorage.removeItem('access_token');
            navigate('/login');
            return;
          }
          throw new Error('Failed to load profile information');
        }

        const data = await res.json();
        setProfile(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate, API_URL]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem('access_token');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="dash-loading-screen">
        <div className="dash-loading-card">
          <div className="dash-loading-icon">
            <Loader2 size={32} className="dash-spinner" />
          </div>
          <p className="dash-loading-text">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  const userDisplayName = profile?.name || profile?.email?.split('@')[0] || 'User';
  const avatarLetter = userDisplayName.charAt(0).toUpperCase();
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  const stats = [
    { icon: <CheckSquare size={20} />, label: 'Tasks Completed', value: '0', color: '#7c3aed', bg: 'rgba(124,58,237,0.08)' },
    { icon: <Users size={20} />, label: 'Team Members', value: '1', color: '#06b6d4', bg: 'rgba(6,182,212,0.08)' },
    { icon: <BarChart2 size={20} />, label: 'Projects Active', value: '0', color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
    { icon: <TrendingUp size={20} />, label: 'Productivity', value: '—', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
  ];

  return (
    <div className={`dash-page ${sidebarOpen ? '' : 'dash-page--collapsed'}`}>

      {/* Sidebar */}
      <aside className={`dash-sidebar ${sidebarOpen ? 'dash-sidebar--open' : 'dash-sidebar--closed'}`}>
        <div className="dash-sidebar-logo">
          <div className="dash-sidebar-icon">
            <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
              <path d="M4 20L10 14L14 18L20 10L24 14" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="14" cy="14" r="12" stroke="white" strokeWidth="2" opacity="0.3"/>
            </svg>
          </div>
          {sidebarOpen && <span className="dash-sidebar-brand">Yobid</span>}
        </div>

        <nav className="dash-nav-links">
          <a href="#" className="dash-nav-item dash-nav-item--active" id="nav-dashboard">
            <LayoutDashboard size={18} />
            {sidebarOpen && <span>Dashboard</span>}
          </a>
          <a href="#" className="dash-nav-item" id="nav-tasks">
            <CheckSquare size={18} />
            {sidebarOpen && <span>Tasks</span>}
          </a>
          <a href="#" className="dash-nav-item" id="nav-team">
            <Users size={18} />
            {sidebarOpen && <span>Team</span>}
          </a>
          <a href="#" className="dash-nav-item" id="nav-reports">
            <BarChart2 size={18} />
            {sidebarOpen && <span>Reports</span>}
          </a>
        </nav>

        {/* Collapse toggle button */}
        <button
          className="dash-sidebar-toggle"
          onClick={toggleSidebar}
          id="btn-toggle-sidebar"
          aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      </aside>

      {/* Main content */}
      <div className="dash-main">
        {/* Top bar */}
        <header className="dash-topbar">
          <div className="dash-topbar-left">
            <h2 className="dash-page-title">Dashboard</h2>
          </div>
          <div className="dash-topbar-right">
            <button className="dash-icon-btn" id="btn-notifications" aria-label="Notifications">
              <Bell size={18} />
            </button>

            {/* Profile dropdown */}
            <div className="dash-profile-dropdown" ref={dropdownRef}>
              <button
                className="dash-user-pill"
                id="btn-profile-menu"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
              >
                <div className="dash-avatar">{avatarLetter}</div>
                <span className="dash-user-name">{userDisplayName}</span>
                <ChevronDown
                  size={14}
                  className={`dash-chevron ${dropdownOpen ? 'dash-chevron--open' : ''}`}
                />
              </button>

              {dropdownOpen && (
                <div className="dash-dropdown-menu" role="menu">
                  {/* Header: User Info */}
                  <div className="dash-dropdown-header">
                    <div className="dash-dropdown-avatar">{avatarLetter}</div>
                    <div className="dash-dropdown-user-info">
                      <span className="dash-dropdown-name">{userDisplayName}</span>
                      <span className="dash-dropdown-status">
                        <span className="dash-status-dot" /> Online
                      </span>
                    </div>
                  </div>

                  {/* Actions: Set Status / Mute Notifications */}
                  <div className="dash-dropdown-actions">
                    <div className="dash-status-input-container">
                      <Smile size={14} className="dash-status-icon" />
                      <input type="text" placeholder="Set status" className="dash-status-input" />
                    </div>
                    <button className="dash-dropdown-row-btn" type="button">
                      <div className="dash-btn-left">
                        <BellOff size={14} />
                        <span>Mute notifications</span>
                      </div>
                      <ChevronRight size={12} />
                    </button>
                  </div>

                  <div className="dash-dropdown-divider" />

                  {/* Scrollable menu items */}
                  <div className="dash-dropdown-items-scroller">
                    <button className="dash-dropdown-item" onClick={() => { setDropdownOpen(false); navigate('/settings?tab=profile'); }} role="menuitem" type="button">
                      <Settings size={15} />
                      <span>Settings</span>
                    </button>
                    <button className="dash-dropdown-item" onClick={() => { setDropdownOpen(false); navigate('/settings?tab=notifications'); }} role="menuitem" type="button">
                      <Bell size={15} />
                      <span>Notifications</span>
                    </button>
                    <button className="dash-dropdown-item" onClick={() => { setDropdownOpen(false); navigate('/settings?tab=themes'); }} role="menuitem" type="button">
                      <Palette size={15} />
                      <span>Themes</span>
                    </button>
                    <button className="dash-dropdown-item" onClick={() => { setDropdownOpen(false); navigate('/settings?tab=shortcuts'); }} role="menuitem" type="button">
                      <Keyboard size={15} />
                      <span>Keyboard shortcuts</span>
                    </button>
                    <button className="dash-dropdown-item" role="menuitem" type="button">
                      <Download size={15} />
                      <span>Download Yobid</span>
                    </button>
                    <button className="dash-dropdown-item" role="menuitem" type="button">
                      <HelpCircle size={15} />
                      <span>Help</span>
                    </button>

                    <div className="dash-dropdown-section-title">Personal Tools</div>

                    {[
                      { icon: <CheckSquare size={14} />, label: 'Create task', pin: true },
                      { icon: <Briefcase size={14} />, label: 'My Work', pin: true },
                      { icon: <Clock size={14} />, label: 'Track Time', pin: false },
                      { icon: <FileText size={14} />, label: 'Notepad', pin: true },
                      { icon: <Video size={14} />, label: 'Record a Clip', pin: true },
                      { icon: <AlarmClock size={14} />, label: 'Create Reminder', pin: true },
                      { icon: <FileText size={14} />, label: 'Create Doc', pin: false },
                      { icon: <LayoutDashboard size={14} />, label: 'Create Whiteboard', pin: false },
                      { icon: <Users size={14} />, label: 'View People', pin: false },
                      { icon: <LayoutDashboard size={14} />, label: 'Create Dashboard', pin: true },
                      { icon: <Sparkles size={14} />, label: 'AI Notetaker', pin: false }
                    ].map((tool, idx) => (
                      <button className="dash-dropdown-item dash-dropdown-item--tool" key={idx} role="menuitem" type="button">
                        <div className="dash-tool-left">
                          {tool.icon}
                          <span>{tool.label}</span>
                        </div>
                        {tool.pin && <Pin size={11} className="dash-tool-pin" />}
                      </button>
                    ))}

                    <div className="dash-dropdown-divider" />
                    
                    <button className="dash-dropdown-item" onClick={() => { setDropdownOpen(false); navigate('/settings?tab=trash'); }} role="menuitem" type="button">
                      <Trash2 size={15} />
                      <span>Trash</span>
                    </button>
                    
                    <button
                      className="dash-dropdown-item dash-dropdown-item--danger"
                      id="btn-signout"
                      onClick={handleSignOut}
                      role="menuitem"
                      type="button"
                    >
                      <LogOut size={15} />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Body */}
        <div className="dash-body">
          {error && (
            <div className="dash-error-banner">
              <Shield size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Welcome section */}
          <div className="dash-welcome">
            <div className="dash-welcome-text">
              <h1 className="dash-welcome-title">{greeting}, {userDisplayName}! 👋</h1>
              <p className="dash-welcome-subtitle">
                You're successfully authenticated. Here's an overview of your workspace.
              </p>
            </div>
            <div className="dash-welcome-badge">
              <Zap size={14} />
              <span>JWT Secured</span>
            </div>
          </div>

          {/* Stats grid */}
          <div className="dash-stats-grid">
            {stats.map((s, i) => (
              <div className="dash-stat-card" key={i}>
                <div className="dash-stat-icon" style={{ color: s.color, background: s.bg }}>
                  {s.icon}
                </div>
                <div className="dash-stat-info">
                  <span className="dash-stat-label">{s.label}</span>
                  <span className="dash-stat-value">{s.value}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Profile info card */}
          {profile && (
            <div className="dash-profile-card">
              <div className="dash-profile-card-header">
                <h3 className="dash-section-title">Account Information</h3>
                <span className="dash-verified-badge">
                  <Award size={13} />
                  Verified
                </span>
              </div>
              <div className="dash-profile-rows">
                <div className="dash-profile-row">
                  <div className="dash-profile-row-icon" style={{ color: '#7c3aed', background: 'rgba(124,58,237,0.08)' }}>
                    <Mail size={16} />
                  </div>
                  <div className="dash-profile-row-info">
                    <span className="dash-profile-row-label">Email Address</span>
                    <span className="dash-profile-row-value">{profile.email}</span>
                  </div>
                </div>

                <div className="dash-profile-row">
                  <div className="dash-profile-row-icon" style={{ color: '#06b6d4', background: 'rgba(6,182,212,0.08)' }}>
                    <Key size={16} />
                  </div>
                  <div className="dash-profile-row-info">
                    <span className="dash-profile-row-label">User ID</span>
                    <span className="dash-profile-row-value dash-mono">
                      #{profile.id || profile.userId || 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="dash-profile-row">
                  <div className="dash-profile-row-icon" style={{ color: '#10b981', background: 'rgba(16,185,129,0.08)' }}>
                    <Shield size={16} />
                  </div>
                  <div className="dash-profile-row-info">
                    <span className="dash-profile-row-label">Auth Method</span>
                    <span className="dash-profile-row-value">
                      {profile.provider === 'google'
                        ? '🔵 Google OAuth'
                        : profile.provider === 'github'
                        ? '⚫ GitHub OAuth'
                        : '🔑 Email / Password (JWT)'}
                    </span>
                  </div>
                </div>

                <div className="dash-profile-row">
                  <div className="dash-profile-row-icon" style={{ color: '#f59e0b', background: 'rgba(245,158,11,0.08)' }}>
                    <Clock size={16} />
                  </div>
                  <div className="dash-profile-row-info">
                    <span className="dash-profile-row-label">Session</span>
                    <span className="dash-profile-row-value" style={{ color: '#10b981' }}>
                      Active &amp; Secure
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
