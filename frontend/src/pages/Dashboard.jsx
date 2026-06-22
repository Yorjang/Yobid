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
import { useAuth } from '../context/AuthContext';
import { notificationsApi } from '../services/api';
import Sidebar from '../components/Sidebar';

/** Map backend role → display label + color */
const ROLE_META = {
  ADMIN:           { label: 'Admin',           color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  PROJECT_MANAGER: { label: 'Project Manager', color: '#7c3aed', bg: 'rgba(124,58,237,0.1)' },
  MEMBER:          { label: 'Member',           color: '#06b6d4', bg: 'rgba(6,182,212,0.1)' },
  GUEST:           { label: 'Guest',            color: '#9ca3af', bg: 'rgba(156,163,175,0.1)' },
};

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('sidebarOpen');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const toggleSidebar = () => {
    setSidebarOpen(prev => {
      const next = !prev;
      localStorage.setItem('sidebarOpen', JSON.stringify(next));
      return next;
    });
  };

  // Fetch unread notification count
  useEffect(() => {
    notificationsApi.countUnread()
      .then(d => setUnreadCount(d.unreadCount ?? 0))
      .catch(() => {});
  }, []);

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
    logout();
    navigate('/login');
  };

  const userDisplayName = user?.name || user?.email?.split('@')[0] || 'User';
  const avatarLetter = userDisplayName.charAt(0).toUpperCase();
  const roleMeta = ROLE_META[user?.role] ?? ROLE_META.MEMBER;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  const stats = [
    { icon: <CheckSquare size={20} />, label: 'Tasks Completed', value: '0', color: '#7c3aed', bg: 'rgba(124,58,237,0.08)' },
    { icon: <Users size={20} />,       label: 'Team Members',    value: '1', color: '#06b6d4', bg: 'rgba(6,182,212,0.08)' },
    { icon: <BarChart2 size={20} />,   label: 'Projects Active', value: '0', color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
    { icon: <TrendingUp size={20} />,  label: 'Productivity',    value: '—', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
  ];

  return (
    <div className={`dash-page ${sidebarOpen ? '' : 'dash-page--collapsed'}`}>

      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Main content */}
      <div className="dash-main">
        {/* Top bar */}
        <header className="dash-topbar">
          <div className="dash-topbar-left">
            <h2 className="dash-page-title">Dashboard</h2>
          </div>
          <div className="dash-topbar-right">
            {/* Notifications bell with badge */}
            <button className="dash-icon-btn" id="btn-notifications" aria-label="Notifications" style={{ position: 'relative' }}>
              <Bell size={18} />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute', top: 2, right: 2,
                  background: '#ef4444', color: '#fff',
                  borderRadius: '999px', fontSize: '10px',
                  minWidth: 16, height: 16,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 3px', lineHeight: 1,
                }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
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

                  {/* Actions */}
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
                      { icon: <Sparkles size={14} />, label: 'AI Notetaker', pin: false },
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
          {/* Welcome section */}
          <div className="dash-welcome">
            <div className="dash-welcome-text">
              <h1 className="dash-welcome-title">{greeting}, {userDisplayName}! 👋</h1>
              <p className="dash-welcome-subtitle">
                You're successfully authenticated. Here's an overview of your workspace.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {/* Role badge */}
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '4px 12px', borderRadius: '999px', fontSize: 12, fontWeight: 600,
                color: roleMeta.color, background: roleMeta.bg, border: `1px solid ${roleMeta.color}33`,
              }}>
                <Shield size={12} />
                {roleMeta.label}
              </span>
              <div className="dash-welcome-badge">
                <Zap size={14} />
                <span>JWT Secured</span>
              </div>
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
          {user && (
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
                    <span className="dash-profile-row-value">{user.email}</span>
                  </div>
                </div>

                <div className="dash-profile-row">
                  <div className="dash-profile-row-icon" style={{ color: '#06b6d4', background: 'rgba(6,182,212,0.08)' }}>
                    <Key size={16} />
                  </div>
                  <div className="dash-profile-row-info">
                    <span className="dash-profile-row-label">User ID</span>
                    <span className="dash-profile-row-value dash-mono">
                      #{user.id ?? 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="dash-profile-row">
                  <div className="dash-profile-row-icon" style={{ color: roleMeta.color, background: roleMeta.bg }}>
                    <Shield size={16} />
                  </div>
                  <div className="dash-profile-row-info">
                    <span className="dash-profile-row-label">Role</span>
                    <span className="dash-profile-row-value" style={{ color: roleMeta.color, fontWeight: 600 }}>
                      {roleMeta.label}
                    </span>
                  </div>
                </div>

                <div className="dash-profile-row">
                  <div className="dash-profile-row-icon" style={{ color: '#6366f1', background: 'rgba(99,102,241,0.08)' }}>
                    <Zap size={16} />
                  </div>
                  <div className="dash-profile-row-info">
                    <span className="dash-profile-row-label">Auth Method</span>
                    <span className="dash-profile-row-value">
                      {user.provider === 'google'
                        ? '🔵 Google OAuth'
                        : user.provider === 'github'
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
