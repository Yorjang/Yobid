import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Settings, Bell, Palette, Keyboard, HelpCircle,
  Users, Shield, FileText, Trash2, LogOut,
  CheckSquare, Briefcase, Clock,
  Video, AlarmClock, LayoutDashboard, Bot, Smile, Globe,
  User, Lock, Camera, ChevronLeft, ChevronRight, Save,
  Mail, Eye, EyeOff, Loader2, Pin, Sparkles, ChevronDown, BellOff,
  BarChart2, Download
} from 'lucide-react';

export default function SettingsPage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  
  // URL and navigation hooks
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeSection = searchParams.get('tab') || 'profile';
  
  // Sidebar state synced with localStorage
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

  // Profile dropdown menu state
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) { navigate('/login'); return; }
    fetch(`${API_URL}/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(d => {
        setProfile(d);
        setFullName(d.name || '');
        setEmail(d.email || '');
      })
      .catch(() => { localStorage.removeItem('access_token'); navigate('/login'); })
      .finally(() => setLoading(false));
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

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg('');
    const token = localStorage.getItem('access_token');
    try {
      const payload = {
        name: fullName,
        email: email,
      };
      if (newPassword) {
        payload.password = newPassword;
      }
      
      const res = await fetch(`${API_URL}/auth/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to save changes');
      }

      const updated = await res.json();
      setProfile(updated);
      setNewPassword(''); // Reset password field
      setSaveMsg('Changes saved!');
    } catch (err) {
      setSaveMsg(`Error: ${err.message}`);
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(''), 4000);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('access_token');
    navigate('/login');
  };

  const setActiveSection = (tabId) => {
    setSearchParams({ tab: tabId });
  };

  if (loading) {
    return (
      <div className="dash-loading-screen">
        <div className="dash-loading-card">
          <div className="dash-loading-icon">
            <Loader2 size={32} className="dash-spinner" />
          </div>
          <p className="dash-loading-text">Loading settings...</p>
        </div>
      </div>
    );
  }

  const userDisplayName = profile?.name || profile?.email?.split('@')[0] || 'User';
  const avatarLetter = userDisplayName.charAt(0).toUpperCase();

  const leftSections = [
    {
      group: 'My Settings',
      items: [
        { id: 'profile', icon: <User size={15} />, label: 'Profile' },
        { id: 'notifications', icon: <Bell size={15} />, label: 'Notifications' },
        { id: 'themes', icon: <Palette size={15} />, label: 'Themes' },
        { id: 'shortcuts', icon: <Keyboard size={15} />, label: 'Keyboard Shortcuts' },
      ],
    },
    {
      group: 'Admin',
      items: [
        { id: 'general', icon: <Settings size={15} />, label: 'General' },
        { id: 'people', icon: <Users size={15} />, label: 'People' },
        { id: 'teams', icon: <Globe size={15} />, label: 'Teams' },
        { id: 'security', icon: <Shield size={15} />, label: 'Security & Permissions' },
        { id: 'audit', icon: <FileText size={15} />, label: 'Audit Logs' },
        { id: 'trash', icon: <Trash2 size={15} />, label: 'Trash' },
      ],
    },
    {
      group: 'Features',
      items: [
        { id: 'automations', icon: <Bot size={15} />, label: 'Automations Manager' },
        { id: 'emojis', icon: <Smile size={15} />, label: 'Emojis' },
        { id: 'task-types', icon: <CheckSquare size={15} />, label: 'Task Types' },
      ],
    },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <div className="set-content-inner">
            <h1 className="set-content-title">My Settings</h1>

            {/* Profile section */}
            <section className="set-section">
              <div className="set-section-left">
                <h3 className="set-section-heading">Profile</h3>
                <p className="set-section-desc">Your personal information and account security settings.</p>
              </div>
              <div className="set-section-right">
                {/* Avatar */}
                <div className="set-avatar-group">
                  <label className="set-field-label">Avatar</label>
                  <div className="set-avatar-row">
                    <div className="set-avatar-circle">
                      {avatarLetter}
                      <div className="set-avatar-overlay">
                        <Camera size={16} />
                      </div>
                    </div>
                    <div className="set-avatar-name">{userDisplayName}</div>
                  </div>
                </div>

                {/* Full Name */}
                <div className="set-field">
                  <label className="set-field-label">Full Name</label>
                  <div className="set-input-wrap">
                    <User size={14} className="set-input-icon" />
                    <input
                      className="set-input"
                      type="text"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="set-field">
                  <label className="set-field-label">Email</label>
                  <div className="set-input-wrap">
                    <Mail size={14} className="set-input-icon" />
                    <input
                      className="set-input"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="name@company.com"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="set-field">
                  <label className="set-field-label">Password</label>
                  <div className="set-input-wrap">
                    <Lock size={14} className="set-input-icon" />
                    <input
                      className="set-input set-input--password"
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      className="set-eye-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label="Toggle password"
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <div className="set-divider" />

            {/* 2FA section */}
            <section className="set-section">
              <div className="set-section-left">
                <h3 className="set-section-heading">Two-factor authentication (2FA)</h3>
                <p className="set-section-desc">
                  Keep your account secure by enabling 2FA via SMS or using a temporary one-time passcode (TOTP) from an authenticator app.
                </p>
              </div>
              <div className="set-section-right">
                <div className="set-toggle-row">
                  <button
                    className={`set-toggle ${twoFAEnabled ? 'set-toggle--on' : ''}`}
                    onClick={() => setTwoFAEnabled(!twoFAEnabled)}
                    id="btn-toggle-2fa"
                    aria-label="Toggle 2FA"
                    type="button"
                  >
                    <span className="set-toggle-knob" />
                  </button>
                  <div className="set-toggle-info">
                    <span className="set-toggle-label">Text Message (SMS)</span>
                    <span className="set-toggle-desc">Receive a one-time passcode via SMS each time you log in.</span>
                  </div>
                </div>
              </div>
            </section>
          </div>
        );

      case 'notifications':
        return (
          <div className="set-content-inner">
            <h1 className="set-content-title">Notifications</h1>
            <section className="set-section">
              <div className="set-section-left">
                <h3 className="set-section-heading">Email Notifications</h3>
                <p className="set-section-desc">Choose what kinds of emails you'd like to receive.</p>
              </div>
              <div className="set-section-right">
                {['Task assigned to you', 'Task completed', 'Comment mentions', 'Due date reminders'].map(item => (
                  <div className="set-checkbox-row" key={item}>
                    <input type="checkbox" defaultChecked id={`notif-${item}`} className="set-checkbox" />
                    <label htmlFor={`notif-${item}`} className="set-checkbox-label">{item}</label>
                  </div>
                ))}
              </div>
            </section>
          </div>
        );

      case 'themes':
        return (
          <div className="set-content-inner">
            <h1 className="set-content-title">Themes</h1>
            <section className="set-section">
              <div className="set-section-left">
                <h3 className="set-section-heading">Appearance</h3>
                <p className="set-section-desc">Customize the look and feel of your workspace.</p>
              </div>
              <div className="set-section-right">
                <div className="set-theme-grid">
                  {[
                    { id: 'light', label: 'Light', bg: '#ffffff', accent: '#7c3aed' },
                    { id: 'dark', label: 'Dark', bg: '#1e1b4b', accent: '#a855f7' },
                    { id: 'purple', label: 'Purple', bg: '#4c1d95', accent: '#f0abfc' },
                  ].map(t => (
                    <div key={t.id} className="set-theme-card" style={{ background: t.bg, borderColor: t.accent }}>
                      <div className="set-theme-preview">
                        <div className="set-theme-sidebar" style={{ background: t.accent }} />
                        <div className="set-theme-main" />
                      </div>
                      <span className="set-theme-label" style={{ color: t.id === 'light' ? '#374151' : '#fff' }}>{t.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        );

      case 'security':
        return (
          <div className="set-content-inner">
            <h1 className="set-content-title">Security & Permissions</h1>
            <section className="set-section">
              <div className="set-section-left">
                <h3 className="set-section-heading">Active Sessions</h3>
                <p className="set-section-desc">Manage where you're logged in.</p>
              </div>
              <div className="set-section-right">
                <div className="set-session-card">
                  <div className="set-session-icon">💻</div>
                  <div className="set-session-info">
                    <span className="set-session-device">This device (Current)</span>
                    <span className="set-session-meta">Last active: just now · {window.location.hostname}</span>
                  </div>
                  <span className="set-session-badge">Active</span>
                </div>
              </div>
            </section>
          </div>
        );

      default:
        return (
          <div className="set-content-inner">
            <h1 className="set-content-title">{leftSections.flatMap(s => s.items).find(i => i.id === activeSection)?.label || 'Settings'}</h1>
            <div className="set-empty-state">
              <Settings size={40} className="set-empty-icon" />
              <p>This section is coming soon.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className={`dash-page ${sidebarOpen ? '' : 'dash-page--collapsed'}`}>

      {/* Global Sidebar (far left) */}
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
          <button onClick={() => navigate('/dashboard')} className="dash-nav-item" style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}>
            <LayoutDashboard size={18} />
            {sidebarOpen && <span>Dashboard</span>}
          </button>
          <button onClick={() => navigate('/dashboard')} className="dash-nav-item" style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}>
            <CheckSquare size={18} />
            {sidebarOpen && <span>Tasks</span>}
          </button>
          <button onClick={() => navigate('/dashboard')} className="dash-nav-item" style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}>
            <Users size={18} />
            {sidebarOpen && <span>Team</span>}
          </button>
          <button onClick={() => navigate('/dashboard')} className="dash-nav-item" style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}>
            <BarChart2 size={18} />
            {sidebarOpen && <span>Reports</span>}
          </button>
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

      {/* Main layout area */}
      <div className="dash-main">
        {/* Global Topbar */}
        <header className="dash-topbar">
          <div className="dash-topbar-left">
            <h2 className="dash-page-title">Settings</h2>
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
                    <button className="dash-dropdown-item" onClick={() => { setDropdownOpen(false); setActiveSection('profile'); }} role="menuitem" type="button">
                      <Settings size={15} />
                      <span>Settings</span>
                    </button>
                    <button className="dash-dropdown-item" onClick={() => { setDropdownOpen(false); setActiveSection('notifications'); }} role="menuitem" type="button">
                      <Bell size={15} />
                      <span>Notifications</span>
                    </button>
                    <button className="dash-dropdown-item" onClick={() => { setDropdownOpen(false); setActiveSection('themes'); }} role="menuitem" type="button">
                      <Palette size={15} />
                      <span>Themes</span>
                    </button>
                    <button className="dash-dropdown-item" onClick={() => { setDropdownOpen(false); setActiveSection('shortcuts'); }} role="menuitem" type="button">
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
                    
                    <button className="dash-dropdown-item" onClick={() => { setDropdownOpen(false); setActiveSection('trash'); }} role="menuitem" type="button">
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

        {/* Settings split sub-layout */}
        <div className="set-body-wrapper">
          {/* Secondary settings navigation */}
          <aside className="set-sidebar">
            <div className="set-sidebar-header">
              <button className="set-back-btn" onClick={() => navigate('/dashboard')} id="btn-back-dashboard" type="button">
                <ChevronRight size={14} style={{ transform: 'rotate(180deg)' }} />
                <span>All settings</span>
              </button>
            </div>

            <div className="set-sidebar-nav">
              {leftSections.map(group => (
                <div className="set-nav-group" key={group.group}>
                  <span className="set-nav-group-label">{group.group}</span>
                  {group.items.map(item => (
                    <button
                      key={item.id}
                      className={`set-nav-item ${activeSection === item.id ? 'set-nav-item--active' : ''}`}
                      onClick={() => setActiveSection(item.id)}
                      id={`set-nav-${item.id}`}
                      type="button"
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              ))}

              <div className="set-nav-group set-nav-group--bottom">
                <button className="set-nav-item set-nav-item--danger" onClick={handleSignOut} id="btn-logout-settings" type="button">
                  <LogOut size={15} />
                  <span>Log out</span>
                </button>
              </div>
            </div>
          </aside>

          {/* Settings main content panel */}
          <main className="set-main">
            {renderContent()}

            {/* Save footer */}
            {['profile', 'notifications'].includes(activeSection) && (
              <div className="set-footer">
                {saveMsg && (
                  <span className={`set-save-msg ${saveMsg.startsWith('Error') ? 'set-save-msg--error' : ''}`}>
                    {saveMsg}
                  </span>
                )}
                <button className="set-save-btn" onClick={handleSave} disabled={saving} id="btn-save-settings" type="button">
                  {saving ? <Loader2 size={15} className="set-spinner-sm" /> : <Save size={15} />}
                  <span>{saving ? 'Saving...' : 'Save changes'}</span>
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
