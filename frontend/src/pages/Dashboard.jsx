import { useState, useEffect, useRef, useCallback } from 'react';
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
import PlannerBoard from '../components/PlannerBoard';

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
  const [activePath, setActivePath] = useState({ spaceName: 'Home', tabName: '' });

  const handleStateChange = useCallback((spaceName, tabName) => {
    setActivePath(prev => {
      if (prev.spaceName === spaceName && prev.tabName === tabName) {
        return prev;
      }
      return { spaceName, tabName };
    });
  }, []);
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 className="dash-page-title" style={{ color: '#94a3b8', fontWeight: 500 }}>Dashboard</h2>
              {activePath.spaceName && (
                <>
                  <span style={{ color: '#cbd5e1', fontWeight: 500 }}>/</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {activePath.spaceName !== 'Home' && (
                      <span style={{
                        width: '18px', height: '18px',
                        backgroundColor: '#7c3aed', color: 'white',
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        borderRadius: '4px', fontWeight: 'bold', fontSize: '9px'
                      }}>
                        {activePath.spaceName.charAt(0).toUpperCase()}
                      </span>
                    )}
                    <span className="dash-page-title" style={{ color: '#1f2937', fontWeight: 700 }}>
                      {activePath.spaceName}
                    </span>
                  </div>
                </>
              )}
              {activePath.spaceName && activePath.spaceName !== 'Home' && activePath.tabName && (
                <>
                  <span style={{ color: '#cbd5e1', fontWeight: 500 }}>/</span>
                  <span style={{ color: '#6b7280', fontSize: '0.875rem', fontWeight: 600, textTransform: 'capitalize' }}>
                    {activePath.tabName}
                  </span>
                </>
              )}
            </div>
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
        <div className="dash-body dash-body--planner">
          {/* Planner board replacing account info */}
          <PlannerBoard onStateChange={handleStateChange} />
        </div>
      </div>
    </div>
  );
}
