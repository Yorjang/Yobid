import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Shield, BarChart2, Loader2, Search,
  ChevronDown, ChevronLeft, ChevronRight,
  LayoutDashboard, CheckSquare, Settings,
  LogOut, Bell, MoreVertical, UserCheck,
  UserX, AlertTriangle, RefreshCw, Crown,
  TrendingUp, Activity, Database,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usersApi } from '../services/api';
import Sidebar from '../components/Sidebar';

const ROLE_META = {
  ADMIN:           { label: 'Admin',           color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   border: '#ef444433' },
  PROJECT_MANAGER: { label: 'Project Manager', color: '#7c3aed', bg: 'rgba(124,58,237,0.1)', border: '#7c3aed33' },
  MEMBER:          { label: 'Member',           color: '#06b6d4', bg: 'rgba(6,182,212,0.1)',  border: '#06b6d433' },
  GUEST:           { label: 'Guest',            color: '#9ca3af', bg: 'rgba(156,163,175,0.1)',border: '#9ca3af33' },
};

const ROLES = ['GUEST', 'MEMBER', 'PROJECT_MANAGER', 'ADMIN'];

export default function AdminPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers]       = useState([]);
  const [stats, setStats]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [actionUserId, setActionUserId] = useState(null); // user whose dropdown is open
  const [saving, setSaving]     = useState(null); // userId being updated
  const [toast, setToast]       = useState('');

  const [sidebarOpen, setSidebarOpen] = useState(() =>
    JSON.parse(localStorage.getItem('sidebarOpen') ?? 'true'),
  );
  const toggleSidebar = () => setSidebarOpen(p => { const v = !p; localStorage.setItem('sidebarOpen', v); return v; });

  const dropdownRef = useRef(null);

  /* ── Load data ───────────────────────────────────────────────── */
  const load = async () => {
    setLoading(true);
    try {
      const [usersData, statsData] = await Promise.all([
        usersApi.list({ search: search || undefined, role: roleFilter || undefined }),
        usersApi.stats(),
      ]);
      setUsers(usersData);
      setStats(statsData);
    } catch {
      /* silently fail — could show error */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [search, roleFilter]);

  /* ── Close action dropdown on outside click ─────────────────── */
  useEffect(() => {
    const h = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setActionUserId(null);
      }
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  /* ── Actions ──────────────────────────────────────────────────── */
  const handleChangeRole = async (targetId, role) => {
    setSaving(targetId);
    setActionUserId(null);
    try {
      await usersApi.changeRole(targetId, role);
      showToast('Role updated successfully');
      load();
    } catch (err) {
      showToast(`Error: ${err.message}`);
    } finally {
      setSaving(null);
    }
  };

  const handleToggleActive = async (u) => {
    setSaving(u.id);
    setActionUserId(null);
    try {
      if (u.isActive) {
        await usersApi.deactivate(u.id);
        showToast('User deactivated');
      } else {
        await usersApi.activate(u.id);
        showToast('User activated');
      }
      load();
    } catch (err) {
      showToast(`Error: ${err.message}`);
    } finally {
      setSaving(null);
    }
  };

  /* ── Render ────────────────────────────────────────────────────── */
  const userDisplayName = user?.name || user?.email?.split('@')[0] || 'Admin';
  const avatarLetter    = userDisplayName.charAt(0).toUpperCase();

  const statCards = stats
    ? [
        { icon: <Users size={20} />,    label: 'Total Users',    value: stats.totalUsers,    color: '#7c3aed', bg: 'rgba(124,58,237,0.08)' },
        { icon: <UserCheck size={20} />,label: 'Active Users',   value: stats.activeUsers,   color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
        { icon: <UserX size={20} />,    label: 'Inactive Users', value: stats.inactiveUsers, color: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
        { icon: <TrendingUp size={20} />,label: 'Roles',         value: stats.byRole?.length ?? '—', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
      ]
    : [];

  return (
    <div className={`dash-page ${sidebarOpen ? '' : 'dash-page--collapsed'}`}>

      {/* ── Sidebar ── */}
      <Sidebar sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

      {/* ── Main ── */}
      <div className="dash-main">
        {/* Topbar */}
        <header className="dash-topbar">
          <div className="dash-topbar-left">
            <h2 className="dash-page-title">Admin Panel</h2>
          </div>
          <div className="dash-topbar-right">
            <button className="dash-icon-btn" aria-label="Notifications"><Bell size={18} /></button>
            <button className="dash-user-pill" onClick={() => navigate('/settings')}>
              <div className="dash-avatar">{avatarLetter}</div>
              <span className="dash-user-name">{userDisplayName}</span>
            </button>
            <button className="dash-icon-btn" onClick={() => { logout(); navigate('/login'); }} aria-label="Sign out" title="Sign out">
              <LogOut size={16} />
            </button>
          </div>
        </header>

        <div className="dash-body">

          {/* Stats row */}
          <div className="dash-stats-grid" style={{ marginBottom: 24 }}>
            {loading && !stats
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="dash-stat-card" style={{ opacity: 0.4 }}>
                    <div className="dash-stat-icon" style={{ color: '#94a3b8', background: 'rgba(148,163,184,0.08)' }}>
                      <Activity size={20} />
                    </div>
                    <div className="dash-stat-info">
                      <span className="dash-stat-label">Loading…</span>
                      <span className="dash-stat-value">—</span>
                    </div>
                  </div>
                ))
              : statCards.map((s, i) => (
                  <div key={i} className="dash-stat-card">
                    <div className="dash-stat-icon" style={{ color: s.color, background: s.bg }}>{s.icon}</div>
                    <div className="dash-stat-info">
                      <span className="dash-stat-label">{s.label}</span>
                      <span className="dash-stat-value">{s.value}</span>
                    </div>
                  </div>
                ))}
          </div>

          {/* Role distribution */}
          {stats?.byRole?.length > 0 && (
            <div className="dash-profile-card" style={{ marginBottom: 24 }}>
              <div className="dash-profile-card-header">
                <h3 className="dash-section-title">Role Distribution</h3>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>Total: {stats.totalUsers}</span>
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', padding: '4px 0' }}>
                {stats.byRole.map(r => {
                  const m = ROLE_META[r.role] ?? ROLE_META.MEMBER;
                  const pct = Math.round((r.count / stats.totalUsers) * 100);
                  return (
                    <div key={r.role} style={{
                      flex: '1 1 160px', padding: '12px 16px',
                      borderRadius: 12, background: m.bg,
                      border: `1px solid ${m.border}`,
                      display: 'flex', flexDirection: 'column', gap: 4,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: m.color }}>{m.label}</span>
                        <Crown size={13} style={{ color: m.color }} />
                      </div>
                      <span style={{ fontSize: 22, fontWeight: 700, color: m.color }}>{r.count}</span>
                      <div style={{ height: 4, borderRadius: 2, background: 'rgba(0,0,0,0.05)' }}>
                        <div style={{ width: `${pct}%`, height: '100%', borderRadius: 2, background: m.color }} />
                      </div>
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>{pct}% of total</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* User management table */}
          <div className="dash-profile-card">
            <div className="dash-profile-card-header" style={{ flexWrap: 'wrap', gap: 12 }}>
              <h3 className="dash-section-title">User Management</h3>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                {/* Search */}
                <div style={{ position: 'relative' }}>
                  <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }} />
                  <input
                    type="text"
                    placeholder="Search users…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{
                      padding: '7px 10px 7px 32px', borderRadius: 8,
                      border: '1px solid rgba(99,102,241,0.2)',
                      background: 'rgba(15,15,25,0.6)', color: '#e2e8f0',
                      fontSize: 13, outline: 'none', width: 180,
                    }}
                  />
                </div>
                {/* Role filter */}
                <div style={{ position: 'relative' }}>
                  <select
                    value={roleFilter}
                    onChange={e => setRoleFilter(e.target.value)}
                    style={{
                      padding: '7px 28px 7px 10px', borderRadius: 8, appearance: 'none',
                      border: '1px solid rgba(99,102,241,0.2)',
                      background: 'rgba(15,15,25,0.6)', color: '#e2e8f0',
                      fontSize: 13, outline: 'none', cursor: 'pointer',
                    }}
                  >
                    <option value="">All Roles</option>
                    {ROLES.map(r => <option key={r} value={r}>{ROLE_META[r].label}</option>)}
                  </select>
                  <ChevronDown size={12} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }} />
                </div>
                {/* Refresh */}
                <button onClick={load} style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid rgba(99,102,241,0.2)', background: 'rgba(15,15,25,0.6)', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <RefreshCw size={13} />
                </button>
              </div>
            </div>

            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                <Loader2 size={28} className="dash-spinner" />
              </div>
            ) : users.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#64748b', fontSize: 14 }}>
                No users found.
              </div>
            ) : (
              <div style={{ overflowX: 'auto', marginTop: 8 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
                      {['User', 'Role', 'Status', 'Provider', 'Joined', 'Actions'].map(h => (
                        <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => {
                      const m = ROLE_META[u.role] ?? ROLE_META.MEMBER;
                      const isCurrentUser = u.id === user?.id;
                      return (
                        <tr key={u.id} style={{ borderBottom: '1px solid rgba(99,102,241,0.06)', opacity: u.isActive ? 1 : 0.5 }}>
                          {/* User */}
                          <td style={{ padding: '12px 12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{
                                width: 32, height: 32, borderRadius: '50%',
                                background: `linear-gradient(135deg, ${m.color}88, ${m.color})`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#fff', fontWeight: 700, fontSize: 13, flexShrink: 0,
                              }}>
                                {(u.name || u.email).charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, color: '#e2e8f0', lineHeight: 1.2 }}>
                                  {u.name || '—'} {isCurrentUser && <span style={{ fontSize: 10, color: '#7c3aed', background: 'rgba(124,58,237,0.1)', padding: '1px 5px', borderRadius: 4 }}>you</span>}
                                </div>
                                <div style={{ color: '#64748b', fontSize: 12 }}>{u.email}</div>
                              </div>
                            </div>
                          </td>
                          {/* Role */}
                          <td style={{ padding: '12px 12px' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600, color: m.color, background: m.bg, border: `1px solid ${m.border}` }}>
                              <Shield size={10} />{m.label}
                            </span>
                          </td>
                          {/* Status */}
                          <td style={{ padding: '12px 12px' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: u.isActive ? '#10b981' : '#ef4444', fontWeight: 500 }}>
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: u.isActive ? '#10b981' : '#ef4444', display: 'inline-block' }} />
                              {u.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          {/* Provider */}
                          <td style={{ padding: '12px 12px', color: '#94a3b8', fontSize: 12 }}>
                            {u.provider === 'google' ? '🔵 Google' : u.provider === 'github' ? '⚫ GitHub' : '🔑 Local'}
                          </td>
                          {/* Joined */}
                          <td style={{ padding: '12px 12px', color: '#64748b', fontSize: 12, whiteSpace: 'nowrap' }}>
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                          {/* Actions */}
                          <td style={{ padding: '12px 12px', position: 'relative' }} ref={actionUserId === u.id ? dropdownRef : null}>
                            {saving === u.id ? (
                              <Loader2 size={16} className="dash-spinner" />
                            ) : (
                              <>
                                <button
                                  onClick={() => setActionUserId(actionUserId === u.id ? null : u.id)}
                                  style={{ padding: '4px 6px', borderRadius: 6, border: '1px solid rgba(99,102,241,0.2)', background: 'rgba(15,15,25,0.6)', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                  aria-label="Actions"
                                >
                                  <MoreVertical size={14} />
                                </button>
                                {actionUserId === u.id && (
                                  <div style={{
                                    position: 'absolute', right: 0, top: '110%', zIndex: 50, minWidth: 200,
                                    background: 'rgba(13,13,22,0.98)', border: '1px solid rgba(99,102,241,0.2)',
                                    borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.4)', padding: 6,
                                  }}>
                                    <div style={{ padding: '4px 10px 6px', fontSize: 10, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Change Role</div>
                                    {ROLES.filter(r => r !== u.role).map(r => (
                                      <button key={r} onClick={() => handleChangeRole(u.id, r)}
                                        style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 10px', borderRadius: 6, border: 'none', background: 'none', color: ROLE_META[r].color, cursor: 'pointer', fontSize: 13, textAlign: 'left' }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                      >
                                        <Crown size={12} /> Set as {ROLE_META[r].label}
                                      </button>
                                    ))}
                                    <div style={{ height: 1, background: 'rgba(99,102,241,0.1)', margin: '4px 0' }} />
                                    {!isCurrentUser && (
                                      <button onClick={() => handleToggleActive(u)}
                                        style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 10px', borderRadius: 6, border: 'none', background: 'none', color: u.isActive ? '#ef4444' : '#10b981', cursor: 'pointer', fontSize: 13 }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                      >
                                        {u.isActive ? <><UserX size={12} /> Deactivate</> : <><UserCheck size={12} /> Activate</>}
                                      </button>
                                    )}
                                    {isCurrentUser && (
                                      <div style={{ padding: '6px 10px', fontSize: 11, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <AlertTriangle size={11} /> Cannot modify your own account
                                      </div>
                                    )}
                                  </div>
                                )}
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast notification */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          background: 'rgba(13,13,22,0.95)', border: '1px solid rgba(99,102,241,0.3)',
          borderRadius: 10, padding: '12px 18px', color: '#e2e8f0', fontSize: 13,
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <CheckSquare size={15} style={{ color: '#10b981' }} />
          {toast}
        </div>
      )}
    </div>
  );
}
