import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Settings, Bell, Palette, Keyboard, HelpCircle,
  Users, Shield, FileText, Trash2, LogOut,
  CheckSquare, Briefcase, Clock,
  Video, AlarmClock, LayoutDashboard, Bot, Smile, Globe,
  User, Lock, Camera, ChevronLeft, ChevronRight, Save,
  Mail, Eye, EyeOff, Loader2, Pin, Sparkles, ChevronDown, BellOff,
  BarChart2, Download, RotateCcw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authApi, trashApi, workspacesApi } from '../services/api';
import Sidebar from '../components/Sidebar';

const renderAvatar = (targetUser, className = 'dash-avatar') => {
  const displayName = targetUser?.name || targetUser?.email?.split('@')[0] || 'User';
  const letter = displayName.charAt(0).toUpperCase();
  const avatarValue = targetUser?.avatar;

  if (avatarValue && (avatarValue.startsWith('data:image/') || avatarValue.startsWith('http://') || avatarValue.startsWith('https://') || avatarValue.startsWith('/'))) {
    return (
      <div 
        className={className} 
        style={{ 
          background: `url(${avatarValue}) center/cover no-repeat`,
          color: 'transparent'
        }}
      >
        {letter}
      </div>
    );
  }

  const bgStyle = avatarValue ? { background: avatarValue } : {};
  return (
    <div className={className} style={bgStyle}>
      {letter}
    </div>
  );
};

export default function SettingsPage() {
  const { user, logout, updateUser } = useAuth();
  const [profile, setProfile] = useState(user);
  const [loading] = useState(false);
  const [fullName, setFullName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [avatarVal, setAvatarVal] = useState(user?.avatar || '');
  const fileInputRef = useRef(null);

  // States for Avatar crop/resize modal
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState('');
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // URL and navigation hooks
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeSection = searchParams.get('tab') || 'profile';

  // Trash bin state
  const [trashItems, setTrashItems] = useState([]);
  const [loadingTrash, setLoadingTrash] = useState(false);
  const [trashError, setTrashError] = useState(null);
  const [trashSuccessMsg, setTrashSuccessMsg] = useState('');

  // Workspace Settings states
  const [workspacesList, setWorkspacesList] = useState([]);
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const [wsName, setWsName] = useState('');
  const [wsSlug, setWsSlug] = useState('');
  const [customBranding, setCustomBranding] = useState(false);
  const [personalLayout, setPersonalLayout] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#10b981');
  const [savingWs, setSavingWs] = useState(false);
  const [wsSaveMsg, setWsSaveMsg] = useState('');

  const fetchWorkspaces = async () => {
    try {
      const data = await workspacesApi.list();
      const activeWs = data.filter(w => !w.isDeleted);
      setWorkspacesList(activeWs);
      if (activeWs.length > 0) {
        const savedWsId = localStorage.getItem('yobid_active_workspace_id');
        const ws = activeWs.find(w => w.id === Number(savedWsId)) || activeWs[0];
        setActiveWorkspace(ws);
        setWsName(ws.name);
        setWsSlug(ws.slug);
      }
    } catch (err) {
      console.error('Error loading workspaces:', err);
    }
  };

  const handleSaveWorkspace = async () => {
    if (!activeWorkspace) return;
    setSavingWs(true);
    setWsSaveMsg('');
    try {
      const updated = await workspacesApi.update(activeWorkspace.id, {
        name: wsName,
        slug: wsSlug
      });
      setWorkspacesList(prev => prev.map(w => w.id === updated.id ? updated : w));
      setActiveWorkspace(updated);
      setWsSaveMsg('Workspace settings saved successfully!');
    } catch (err) {
      setWsSaveMsg(`Error: ${err.message}`);
    } finally {
      setSavingWs(false);
      setTimeout(() => setWsSaveMsg(''), 4000);
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!activeWorkspace) return;
    if (!window.confirm('WARNING: Are you sure you want to delete this workspace forever? All projects and tasks inside will be lost.')) {
      return;
    }
    try {
      await workspacesApi.remove(activeWorkspace.id);
      alert('Workspace soft-deleted successfully.');
      localStorage.removeItem('yobid_active_workspace_id');
      navigate('/workspaces');
    } catch (err) {
      alert(`Error deleting workspace: ${err.message}`);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const fetchTrash = async () => {
    setLoadingTrash(true);
    setTrashError(null);
    try {
      const data = await trashApi.list();
      setTrashItems(data || []);
    } catch (err) {
      setTrashError(err.message);
    } finally {
      setLoadingTrash(false);
    }
  };

  const handleRestore = async (type, id) => {
    try {
      setTrashSuccessMsg('');
      setTrashError(null);
      await trashApi.restore(type, id);
      setTrashSuccessMsg(`Restored ${type} successfully!`);
      fetchTrash();
    } catch (err) {
      setTrashError(err.message);
    }
  };

  const handlePermanentDelete = async (type, id) => {
    if (!window.confirm(`Are you sure you want to permanently delete this ${type}? This action cannot be undone.`)) {
      return;
    }
    try {
      setTrashSuccessMsg('');
      setTrashError(null);
      await trashApi.permanentDelete(type, id);
      setTrashSuccessMsg(`Permanently deleted ${type} successfully!`);
      fetchTrash();
    } catch (err) {
      setTrashError(err.message);
    }
  };

  useEffect(() => {
    if (activeSection === 'trash') {
      fetchTrash();
    }
  }, [activeSection]);
  
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

  // Sync local form state when user changes
  useEffect(() => {
    if (user) {
      setProfile(user);
      setFullName(user.name || '');
      setEmail(user.email || '');
      setAvatarVal(user.avatar || '');
    }
  }, [user]);

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

  const handleAvatarFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File is too large. Max size is 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setCropImageSrc(reader.result);
        setZoom(1.0);
        setPanX(0);
        setPanY(0);
        setShowCropModal(true);
      };
      reader.readAsDataURL(file);
    }
  };

  // Mouse / Touch handlers for image dragging (Panning) in crop modal
  const handleDragStart = (clientX, clientY) => {
    setIsDragging(true);
    setDragStart({ x: clientX - panX, y: clientY - panY });
  };

  const handleDragMove = (clientX, clientY) => {
    if (!isDragging) return;
    setPanX(clientX - dragStart.x);
    setPanY(clientY - dragStart.y);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    handleDragStart(e.clientX, e.clientY);
  };

  const handleMouseMove = (e) => {
    handleDragMove(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    handleDragEnd();
  };

  // Touch support for mobile devices
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      handleDragStart(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 1) {
      handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchEnd = () => {
    handleDragEnd();
  };

  const handleApplyCrop = () => {
    const img = new Image();
    img.src = cropImageSrc;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 160;
      canvas.height = 160;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clear with white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 160, 160);

      // Determine dimensions to draw under cover mode
      const iw = img.naturalWidth;
      const ih = img.naturalHeight;
      const aspect = iw / ih;

      let dw, dh;
      if (aspect > 1) {
        dh = 160;
        dw = 160 * aspect;
      } else {
        dw = 160;
        dh = 160 / aspect;
      }

      // Center the image initially
      const cx = (160 - dw) / 2;
      const cy = (160 - dh) / 2;

      // Apply zoom & pan relative to center
      ctx.translate(160 / 2, 160 / 2);
      ctx.translate(panX, panY);
      ctx.scale(zoom, zoom);
      ctx.translate(-160 / 2, -160 / 2);

      ctx.drawImage(img, cx, cy, dw, dh);

      const croppedBase64 = canvas.toDataURL('image/jpeg', 0.95);
      setAvatarVal(croppedBase64);
      setShowCropModal(false);
      
      // Clear file input so same file can be selected again
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg('');
    try {
      const payload = { name: fullName, email, avatar: avatarVal };
      if (newPassword) payload.password = newPassword;

      const updated = await authApi.updateProfile(payload);
      updateUser(updated);
      setProfile(updated);
      setNewPassword('');
      setSaveMsg('Changes saved!');
    } catch (err) {
      setSaveMsg(`Error: ${err.message}`);
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(''), 4000);
    }
  };

  const handleSignOut = () => {
    logout();
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
                  <div className="set-avatar-row" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '0.5rem' }}>
                    <div 
                      className="set-avatar-circle"
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        background: (avatarVal && (avatarVal.startsWith('data:image/') || avatarVal.startsWith('http://') || avatarVal.startsWith('https://') || avatarVal.startsWith('/'))) 
                          ? `url(${avatarVal}) center/cover no-repeat` 
                          : (avatarVal || undefined),
                        color: (avatarVal && (avatarVal.startsWith('data:image/') || avatarVal.startsWith('http://') || avatarVal.startsWith('https://') || avatarVal.startsWith('/'))) ? 'transparent' : '#fff'
                      }}
                    >
                      {!(avatarVal && (avatarVal.startsWith('data:image/') || avatarVal.startsWith('http://') || avatarVal.startsWith('https://') || avatarVal.startsWith('/'))) && avatarLetter}
                      <div className="set-avatar-overlay">
                        <Camera size={16} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <div className="set-avatar-name" style={{ fontWeight: 600, fontSize: '1rem', color: '#111827' }}>{userDisplayName}</div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          type="button" 
                          onClick={() => fileInputRef.current?.click()}
                          style={{ padding: '0.35rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#fff', color: '#374151', fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer' }}
                        >
                          Upload Photo
                        </button>
                        {avatarVal && (
                          <button 
                            type="button" 
                            onClick={() => setAvatarVal('')}
                            style={{ padding: '0.35rem 0.75rem', border: '1px solid #fca5a5', borderRadius: '6px', background: '#fff', color: '#ef4444', fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer' }}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <input 
                    type="file" 
                    id="avatar-file-input"
                    ref={fileInputRef} 
                    accept="image/*" 
                    style={{ display: 'none' }} 
                    onChange={handleAvatarFileChange} 
                  />
                  
                  {/* Color Palette Choices */}
                  <div style={{ marginTop: '0.25rem', marginBottom: '1.25rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '0.4rem' }}>Or choose an avatar color:</span>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                      {[
                        '#4b5563', '#6366f1', '#3b82f6', '#ec4899', '#a855f7', '#f97316', '#10b981', '#ef4444',
                        'linear-gradient(135deg, #7c3aed, #a855f7)', 
                        'linear-gradient(135deg, #ef4444, #f97316)', 
                        'linear-gradient(135deg, #06b6d4, #3b82f6)',
                        'linear-gradient(135deg, #10b981, #059669)'
                      ].map(color => (
                        <button
                          key={color}
                          onClick={() => setAvatarVal(color)}
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: color,
                            border: avatarVal === color ? '2px solid #111827' : '1px solid #e2e8f0',
                            boxShadow: avatarVal === color ? '0 0 0 2px #cbd5e1' : 'none',
                            cursor: 'pointer',
                            padding: 0
                          }}
                          type="button"
                        />
                      ))}
                    </div>
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

      case 'trash':
        return (
          <div className="set-content-inner" style={{ maxWidth: '100%' }}>
            <div className="trash-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div>
                <h1 className="set-content-title" style={{ marginBottom: '0.5rem' }}>Trash</h1>
                <p className="set-section-desc">View, restore, or permanently delete items you have soft-deleted.</p>
              </div>
              <button 
                onClick={fetchTrash} 
                disabled={loadingTrash}
                className="dash-icon-btn" 
                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                type="button"
              >
                {loadingTrash ? <Loader2 size={16} className="dash-spinner" /> : <RotateCcw size={16} />}
                <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#374151' }}>Refresh</span>
              </button>
            </div>

            {trashError && (
              <div className="set-save-msg set-save-msg--error" style={{ marginBottom: '1.5rem', display: 'block', padding: '0.75rem 1rem', borderRadius: '8px', background: '#fef2f2', border: '1px solid #fee2e2', color: '#dc2626', fontSize: '0.85rem' }}>
                {trashError}
              </div>
            )}

            {trashSuccessMsg && (
              <div className="set-save-msg" style={{ marginBottom: '1.5rem', display: 'block', padding: '0.75rem 1rem', borderRadius: '8px', background: '#f0fdf4', border: '1px solid #dcfce7', color: '#16a34a', fontSize: '0.85rem' }}>
                {trashSuccessMsg}
              </div>
            )}

            {loadingTrash ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 0', gap: '1rem' }}>
                <Loader2 size={36} className="dash-spinner" style={{ color: '#7c3aed' }} />
                <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>Loading deleted items...</p>
              </div>
            ) : trashItems.length === 0 ? (
              <div className="set-empty-state" style={{ padding: '5rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', background: '#fafbfe', borderRadius: '12px', border: '1.5px dashed #e5e7eb' }}>
                <div style={{ padding: '1rem', background: '#f5f3ff', borderRadius: '50%', color: '#7c3aed' }}>
                  <Trash2 size={40} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1f2937', marginBottom: '0.25rem' }}>Your Trash is empty</h3>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Items you delete will show up here for you to restore or delete permanently.</p>
                </div>
              </div>
            ) : (
              <div style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ background: '#f9fafb', borderBottom: '1.5px solid #e5e7eb' }}>
                      <th style={{ padding: '1rem 1.25rem', fontWeight: 600, color: '#4b5563' }}>Type</th>
                      <th style={{ padding: '1rem 1.25rem', fontWeight: 600, color: '#4b5563' }}>Name</th>
                      <th style={{ padding: '1rem 1.25rem', fontWeight: 600, color: '#4b5563' }}>Location</th>
                      <th style={{ padding: '1rem 1.25rem', fontWeight: 600, color: '#4b5563' }}>Deleted At</th>
                      <th style={{ padding: '1rem 1.25rem', fontWeight: 600, color: '#4b5563', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trashItems.map((item, idx) => {
                      let badgeBg = '#f3f4f6';
                      let badgeColor = '#374151';
                      if (item.type === 'workspace') {
                        badgeBg = '#f5f3ff';
                        badgeColor = '#7c3aed';
                      } else if (item.type === 'project') {
                        badgeBg = '#eff6ff';
                        badgeColor = '#2563eb';
                      } else if (item.type === 'task') {
                        badgeBg = '#fff1f2';
                        badgeColor = '#e11d48';
                      }

                      return (
                        <tr key={`${item.type}-${item.id}`} style={{ borderBottom: idx === trashItems.length - 1 ? 'none' : '1px solid #f3f4f6', transition: 'background-color 0.15s' }}>
                          <td style={{ padding: '1rem 1.25rem' }}>
                            <span style={{ 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              padding: '0.25rem 0.625rem', 
                              borderRadius: '9999px', 
                              fontSize: '0.75rem', 
                              fontWeight: 600, 
                              textTransform: 'capitalize',
                              background: badgeBg,
                              color: badgeColor
                            }}>
                              {item.type}
                            </span>
                          </td>
                          <td style={{ padding: '1rem 1.25rem', fontWeight: 500, color: '#111827' }}>
                            {item.name}
                          </td>
                          <td style={{ padding: '1rem 1.25rem', color: '#6b7280', fontSize: '0.8rem' }}>
                            {item.type === 'task' ? (
                              <span>{item.workspaceName} &gt; {item.projectName}</span>
                            ) : item.type === 'project' ? (
                              <span>{item.workspaceName}</span>
                            ) : (
                              <span style={{ fontStyle: 'italic', color: '#9ca3af' }}>N/A</span>
                            )}
                          </td>
                          <td style={{ padding: '1rem 1.25rem', color: '#4b5563' }}>
                            {item.deletedAt ? new Date(item.deletedAt).toLocaleString() : 'Unknown'}
                          </td>
                          <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                              <button 
                                onClick={() => handleRestore(item.type, item.id)}
                                style={{ 
                                  display: 'inline-flex', 
                                  alignItems: 'center', 
                                  gap: '4px',
                                  padding: '0.375rem 0.75rem', 
                                  borderRadius: '6px', 
                                  border: '1px solid #7c3aed', 
                                  background: 'rgba(124,58,237,0.04)', 
                                  color: '#7c3aed', 
                                  fontSize: '0.8rem',
                                  fontWeight: 500,
                                  cursor: 'pointer',
                                  transition: 'all 0.15s'
                                }}
                                type="button"
                              >
                                <RotateCcw size={12} />
                                Restore
                              </button>
                              <button 
                                onClick={() => handlePermanentDelete(item.type, item.id)}
                                style={{ 
                                  display: 'inline-flex', 
                                  alignItems: 'center', 
                                  gap: '4px',
                                  padding: '0.375rem 0.75rem', 
                                  borderRadius: '6px', 
                                  border: '1px solid #dc2626', 
                                  background: 'rgba(220,38,38,0.04)', 
                                  color: '#dc2626', 
                                  fontSize: '0.8rem',
                                  fontWeight: 500,
                                  cursor: 'pointer',
                                  transition: 'all 0.15s'
                                }}
                                type="button"
                              >
                                <Trash2 size={12} />
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      case 'general':
        return (
          <div className="set-content-inner">
            <h1 className="set-content-title">Workspace Settings</h1>

            {wsSaveMsg && (
              <div 
                className="set-save-msg" 
                style={{ 
                  marginBottom: '1.5rem', 
                  display: 'block', 
                  padding: '0.75rem 1rem', 
                  borderRadius: '8px', 
                  background: wsSaveMsg.startsWith('Error') ? '#fef2f2' : '#f0fdf4', 
                  border: wsSaveMsg.startsWith('Error') ? '1px solid #fee2e2' : '1px solid #dcfce7', 
                  color: wsSaveMsg.startsWith('Error') ? '#dc2626' : '#16a34a', 
                  fontSize: '0.85rem' 
                }}
              >
                {wsSaveMsg}
              </div>
            )}

            {/* General Settings Card */}
            <section className="set-section" style={{ display: 'flex', flexDirection: 'column', gap: '0px', padding: '0', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9', textAlign: 'left' }}>
                <h3 className="set-section-heading" style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1f2937', margin: 0 }}>General</h3>
              </div>

              {/* Avatar Field */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontWeight: 600, color: '#374151' }}>Avatar</span>
                <div style={{
                  width: '32px', height: '32px',
                  backgroundColor: selectedColor || '#10b981', color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: '8px', fontWeight: 'bold', fontSize: '14px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}>
                  {wsName ? wsName.charAt(0).toUpperCase() : 'W'}
                </div>
              </div>

              {/* Name Field */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontWeight: 600, color: '#374151' }}>Name</span>
                <input 
                  type="text" 
                  className="set-input" 
                  style={{ width: '260px', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  value={wsName}
                  onChange={(e) => setWsName(e.target.value)}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '1rem 1.5rem', background: '#f8fafc' }}>
                <button
                  type="button"
                  onClick={handleSaveWorkspace}
                  disabled={savingWs}
                  className="cu-btn cu-btn--primary"
                  style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem', borderRadius: '8px', border: 'none', backgroundColor: '#7c3aed', color: '#fff', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {savingWs ? <Loader2 size={14} className="dash-spinner" /> : <Save size={14} />}
                  Save General Settings
                </button>
              </div>
            </section>

            {/* Custom branding Card */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2.5rem', marginBottom: '1rem', textAlign: 'left' }}>
              <h3 className="set-section-heading" style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1f2937', margin: 0 }}>Custom branding</h3>
              <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem', backgroundColor: '#e0e7ff', color: '#4f46e5', borderRadius: '4px', fontWeight: 600 }}>Enterprise</span>
            </div>

            <section className="set-section" style={{ display: 'flex', flexDirection: 'column', gap: '0px', padding: '0', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
              {/* Enable custom branding Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontWeight: 600, color: '#374151' }}>Enable custom branding</span>
                <button 
                  onClick={() => setCustomBranding(!customBranding)}
                  className={`set-toggle ${customBranding ? 'set-toggle--on' : ''}`}
                  type="button"
                >
                  <span className="set-toggle-knob" />
                </button>
              </div>

              {/* Branding details container, conditionally disabled */}
              <div style={{
                opacity: customBranding ? 1 : 0.5,
                pointerEvents: customBranding ? 'auto' : 'none',
                transition: 'all 0.2s ease-in-out'
              }}>
                {/* Round Logo File Input Mock */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9', textAlign: 'left' }}>
                  <div style={{ maxWidth: '75%' }}>
                    <span style={{ fontWeight: 600, color: '#374151', display: 'block', marginBottom: '0.25rem' }}>Round logo</span>
                    <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>We recommend a 72 x 72 px PNG file. This logo is used in-app as your Workspace avatar.</span>
                  </div>
                  <button disabled={!customBranding} type="button" style={{ padding: '0.35rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#f8fafc', color: '#6b7280', fontSize: '0.8rem', cursor: customBranding ? 'pointer' : 'default' }}>Add</button>
                </div>

                {/* Rectangle Logo File Input Mock */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9', textAlign: 'left' }}>
                  <div style={{ maxWidth: '75%' }}>
                    <span style={{ fontWeight: 600, color: '#374151', display: 'block', marginBottom: '0.25rem' }}>Rectangle logo</span>
                    <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>We recommend a 232 x 48 px PNG file. This logo appears on emails, your login screen, and public links.</span>
                  </div>
                  <button disabled={!customBranding} type="button" style={{ padding: '0.35rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#f8fafc', color: '#6b7280', fontSize: '0.8rem', cursor: customBranding ? 'pointer' : 'default' }}>Add</button>
                </div>

                {/* Social Media Graphic File Input Mock */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9', textAlign: 'left' }}>
                  <div style={{ maxWidth: '75%' }}>
                    <span style={{ fontWeight: 600, color: '#374151', display: 'block', marginBottom: '0.25rem' }}>Social media graphic</span>
                    <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>We recommend a 500 x 260 px PNG file. This graphic serves as the preview image when ClickUp links are shared.</span>
                  </div>
                  <button disabled={!customBranding} type="button" style={{ padding: '0.35rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#f8fafc', color: '#6b7280', fontSize: '0.8rem', cursor: customBranding ? 'pointer' : 'default' }}>Add</button>
                </div>

                {/* Color scheme Swatches */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem' }}>
                  <span style={{ fontWeight: 600, color: '#374151' }}>Color scheme</span>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {['#4b5563', '#6366f1', '#3b82f6', '#ec4899', '#a855f7', '#3b82f6', '#f97316', '#a1a1aa', '#10b981'].map(color => (
                      <button
                        key={color}
                        disabled={!customBranding}
                        onClick={() => setSelectedColor(color)}
                        style={{
                          width: '20px', height: '20px',
                          borderRadius: '50%',
                          backgroundColor: color,
                          border: selectedColor === color ? '2px solid #111827' : '1px solid #e2e8f0',
                          boxShadow: selectedColor === color ? '0 0 0 2px #cbd5e1' : 'none',
                          cursor: customBranding ? 'pointer' : 'default',
                          padding: 0
                        }}
                        type="button"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Custom URL Card */}
            <div style={{ marginTop: '2rem', border: '1px solid #e5e7eb', borderRadius: '12px', background: '#fff', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem' }}>
                <span style={{ fontWeight: 600, color: '#374151' }}>Custom URL</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input 
                    type="text" 
                    className="set-input"
                    style={{ width: '140px', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', textAlign: 'right' }}
                    value={wsSlug}
                    onChange={(e) => setWsSlug(e.target.value)}
                  />
                  <span style={{ color: '#6b7280', fontSize: '0.9rem', fontWeight: 500 }}>.yobid.com</span>
                </div>
              </div>
            </div>

            {/* Personal Layout Card */}
            <div style={{ marginTop: '2rem', textAlign: 'left' }}>
              <h3 className="set-section-heading" style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1f2937', marginBottom: '1rem' }}>Personal Layout</h3>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', border: '1px solid #e5e7eb', borderRadius: '12px', background: '#fff' }}>
                <div style={{ maxWidth: '80%' }}>
                  <span style={{ fontWeight: 600, color: '#374151', display: 'block', marginBottom: '0.25rem' }}>Personal Workspace Layout</span>
                  <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>Work by yourself? Turn this on to maximize your efficiency by removing features designed for team collaboration.</span>
                </div>
                <button 
                  onClick={() => setPersonalLayout(!personalLayout)}
                  className={`set-toggle ${personalLayout ? 'set-toggle--on' : ''}`}
                  type="button"
                >
                  <span className="set-toggle-knob" />
                </button>
              </div>
            </div>

            {/* Danger Zone Card */}
            <div style={{ marginTop: '2.5rem', textAlign: 'left' }}>
              <h3 className="set-section-heading" style={{ fontSize: '1.1rem', fontWeight: 700, color: '#dc2626', marginBottom: '1rem' }}>Danger zone</h3>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem', border: '1px solid #fecaca', borderRadius: '12px', background: '#fff5f5' }}>
                <div style={{ textAlign: 'left' }}>
                  <span style={{ fontWeight: 700, color: '#991b1b', display: 'block', marginBottom: '0.25rem' }}>Delete this Workspace forever</span>
                  <span style={{ fontSize: '0.8rem', color: '#b91c1c' }}>Once deleted, all data, projects, and tasks inside this workspace cannot be recovered.</span>
                </div>
                <button 
                  onClick={handleDeleteWorkspace}
                  style={{ border: 'none', backgroundColor: '#dc2626', color: '#fff', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', transition: 'background-color 0.15s' }}
                  type="button"
                >
                  Delete Workspace
                </button>
              </div>
            </div>
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
      <Sidebar sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

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
                {renderAvatar(user, 'dash-avatar')}
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
                    {renderAvatar(user, 'dash-dropdown-avatar')}
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
        {/* Avatar Crop & Zoom Modal */}
        {showCropModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1.5rem',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            <div style={{
              background: '#ffffff',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '380px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              border: '1px solid #e2e8f0',
              textAlign: 'center'
            }}>
              {/* Modal Header */}
              <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>Adjust profile picture</h3>
                <button 
                  type="button" 
                  onClick={() => setShowCropModal(false)}
                  style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '1.25rem', padding: '0.25rem', lineHeight: 1 }}
                >
                  &times;
                </button>
              </div>

              {/* Modal Body */}
              <div style={{ padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Drag the image to center it and use the slider to zoom.</span>
                
                {/* Crop Box Container */}
                <div 
                  style={{
                    width: '160px',
                    height: '160px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    position: 'relative',
                    cursor: 'move',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    border: '3px solid #6366f1',
                    background: '#f8fafc'
                  }}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
                  <img 
                    src={cropImageSrc}
                    alt="Avatar preview"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
                      transformOrigin: 'center center',
                      userSelect: 'none',
                      pointerEvents: 'none'
                    }}
                  />
                </div>

                {/* Zoom Controls */}
                <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '0 0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>1x</span>
                  <input 
                    type="range"
                    min="1"
                    max="3"
                    step="0.01"
                    value={zoom}
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    style={{
                      flex: 1,
                      height: '5px',
                      borderRadius: '5px',
                      background: '#e2e8f0',
                      outline: 'none',
                      accentColor: '#6366f1',
                      cursor: 'pointer'
                    }}
                  />
                  <span style={{ fontSize: '0.8rem', color: '#6366f1', fontWeight: 600 }}>3x</span>
                </div>
              </div>

              {/* Modal Footer */}
              <div style={{ padding: '1rem 1.5rem', background: '#f8fafc', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button 
                  type="button"
                  onClick={() => setShowCropModal(false)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#475569',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={handleApplyCrop}
                  style={{
                    padding: '0.5rem 1.25rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(124, 58, 237, 0.2)'
                  }}
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
