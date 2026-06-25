import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Database, Plus, ChevronLeft, ChevronRight, Loader2,
  Settings, Shield, LayoutDashboard, LogOut, Bell,
  FolderOpen, Users, Pencil, Trash2, X, Save,
  ArrowLeft, BarChart2, CheckSquare, Clock, TrendingUp,
  UserPlus, Mail,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { workspacesApi, projectsApi } from '../services/api';
import Sidebar from '../components/Sidebar';

const STATUS_META = {
  BACKLOG:     { label: 'Backlog',      color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' },
  TODO:        { label: 'To Do',        color: '#f59e0b', bg: 'rgba(245,158,11,0.1)'  },
  IN_PROGRESS: { label: 'In Progress',  color: '#06b6d4', bg: 'rgba(6,182,212,0.1)'   },
  REVIEW:      { label: 'Review',       color: '#a855f7', bg: 'rgba(168,85,247,0.1)'  },
  DONE:        { label: 'Done',         color: '#10b981', bg: 'rgba(16,185,129,0.1)'  },
};

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

export default function WorkspaceDetailPage() {
  const { id }     = useParams();
  const { user, logout } = useAuth();
  const navigate   = useNavigate();

  const [workspace, setWorkspace]     = useState(null);
  const [projects, setProjects]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [activeTab, setActiveTab]     = useState('projects'); // 'projects' | 'members'
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [showMemberModal, setShowMemberModal]   = useState(false);
  const [formName, setFormName]       = useState('');
  const [formDesc, setFormDesc]       = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [saving, setSaving]           = useState(false);
  const [toast, setToast]             = useState('');

  const [sidebarOpen, setSidebarOpen] = useState(() =>
    JSON.parse(localStorage.getItem('sidebarOpen') ?? 'true'),
  );
  const toggleSidebar = () => setSidebarOpen(p => { const v = !p; localStorage.setItem('sidebarOpen', v); return v; });

  const isAdmin   = user?.role === 'ADMIN';
  const isPM      = user?.role === 'PROJECT_MANAGER';
  const canManage = isAdmin || isPM;

  /* ── Load ────────────────────────────────────────────────────── */
  const load = async () => {
    setLoading(true);
    try {
      const [ws, projs] = await Promise.all([
        workspacesApi.get(id),
        projectsApi.list(id),
      ]);
      setWorkspace(ws);
      setProjects(projs);
    } catch { navigate('/workspaces'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  /* ── Projects ─────────────────────────────────────────────────── */
  const openCreateProject = () => { setEditProject(null); setFormName(''); setFormDesc(''); setShowProjectModal(true); };
  const openEditProject   = (p) => { setEditProject(p); setFormName(p.name); setFormDesc(p.description || ''); setShowProjectModal(true); };

  const handleSaveProject = async (e) => {
    e.preventDefault();
    if (!formName.trim()) return;
    setSaving(true);
    try {
      if (editProject) {
        await projectsApi.update(editProject.id, { name: formName.trim(), description: formDesc.trim() });
        showToast('Project updated');
      } else {
        await projectsApi.create({ name: formName.trim(), description: formDesc.trim(), workspaceId: Number(id) });
        showToast('Project created');
      }
      setShowProjectModal(false);
      load();
    } catch (err) {
      showToast(`Error: ${err.message}`);
    } finally { setSaving(false); }
  };

  const handleDeleteProject = async (pid) => {
    if (!window.confirm('Delete this project? All tasks will be lost.')) return;
    try {
      await projectsApi.remove(pid);
      showToast('Project deleted');
      load();
    } catch (err) {
      showToast(`Error: ${err.message}`);
    }
  };

  /* ── Render ──────────────────────────────────────────────────── */
  const userDisplayName = user?.name || user?.email?.split('@')[0] || 'User';
  const avatarLetter    = userDisplayName.charAt(0).toUpperCase();

  if (loading) {
    return (
      <div className="dash-loading-screen">
        <div className="dash-loading-card">
          <Loader2 size={32} className="dash-spinner" />
          <p className="dash-loading-text">Loading workspace…</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`dash-page ${sidebarOpen ? '' : 'dash-page--collapsed'}`}>

      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Main */}
      <div className="dash-main">
        <header className="dash-topbar">
          <div className="dash-topbar-left" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => navigate('/workspaces')} style={{ padding: '5px 8px', borderRadius: 7, border: '1px solid rgba(99,102,241,0.2)', background: 'rgba(15,15,25,0.6)', color: '#94a3b8', cursor: 'pointer', display: 'flex' }}>
              <ArrowLeft size={16} />
            </button>
            <div>
              <h2 className="dash-page-title" style={{ marginBottom: 0 }}>{workspace?.name}</h2>
              {workspace?.description && <span style={{ fontSize: 12, color: '#64748b' }}>{workspace.description}</span>}
            </div>
          </div>
          <div className="dash-topbar-right">
            <button className="dash-icon-btn" aria-label="Notifications"><Bell size={18} /></button>
            <button className="dash-user-pill" onClick={() => navigate('/settings')}>
              {renderAvatar(user, 'dash-avatar')}
              <span className="dash-user-name">{userDisplayName}</span>
            </button>
            <button className="dash-icon-btn" onClick={() => { logout(); navigate('/login'); }} title="Sign out">
              <LogOut size={16} />
            </button>
          </div>
        </header>

        <div className="dash-body">
          {/* Tab bar */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'rgba(15,15,25,0.6)', borderRadius: 10, padding: 4, width: 'fit-content', border: '1px solid rgba(99,102,241,0.15)' }}>
            {[
              { id: 'projects', icon: <FolderOpen size={14} />, label: 'Projects' },
              { id: 'members',  icon: <Users size={14} />,     label: 'Members'  },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
                  borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                  background: activeTab === tab.id ? 'rgba(124,58,237,0.2)' : 'none',
                  color: activeTab === tab.id ? '#a855f7' : '#94a3b8',
                  transition: 'all 0.15s',
                }}>
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* ── Projects tab ── */}
          {activeTab === 'projects' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ margin: 0, color: '#e2e8f0', fontSize: 15, fontWeight: 600 }}>
                  {projects.length} Project{projects.length !== 1 ? 's' : ''}
                </h3>
                {canManage && (
                  <button onClick={openCreateProject}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, background: 'linear-gradient(135deg, #7c3aed, #a855f7)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    <Plus size={14} /> New Project
                  </button>
                )}
              </div>

              {projects.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#64748b', fontSize: 14 }}>
                  No projects yet. {canManage && 'Create one to get started.'}
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
                  {projects.map(p => {
                    const taskCount = p._count?.tasks ?? 0;
                    const memberCount = p._count?.members ?? 0;
                    return (
                      <div key={p.id} style={{
                        borderRadius: 12, border: '1px solid rgba(99,102,241,0.15)',
                        background: 'rgba(15,15,25,0.7)', padding: 18,
                        display: 'flex', flexDirection: 'column', gap: 10,
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 9, background: 'linear-gradient(135deg, #06b6d488, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <FolderOpen size={16} style={{ color: '#fff' }} />
                            </div>
                            <div>
                              <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#e2e8f0', lineHeight: 1.2 }}>{p.name}</h4>
                              {p.description && <p style={{ margin: '2px 0 0', fontSize: 11, color: '#64748b' }}>{p.description}</p>}
                            </div>
                          </div>
                          {canManage && (
                            <div style={{ display: 'flex', gap: 3 }}>
                              <button onClick={() => openEditProject(p)}
                                style={{ padding: '3px 5px', borderRadius: 5, border: '1px solid rgba(99,102,241,0.2)', background: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                                <Pencil size={11} />
                              </button>
                              <button onClick={() => handleDeleteProject(p.id)}
                                style={{ padding: '3px 5px', borderRadius: 5, border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.05)', color: '#ef4444', cursor: 'pointer' }}>
                                <Trash2 size={11} />
                              </button>
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: 10 }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#94a3b8' }}>
                            <CheckSquare size={11} style={{ color: '#06b6d4' }} /> {taskCount} tasks
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#94a3b8' }}>
                            <Users size={11} style={{ color: '#7c3aed' }} /> {memberCount} members
                          </span>
                        </div>

                        <div style={{ height: 1, background: 'rgba(99,102,241,0.08)' }} />
                        <span style={{ fontSize: 11, color: '#64748b' }}>
                          Created {new Date(p.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* ── Members tab ── */}
          {activeTab === 'members' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ margin: 0, color: '#e2e8f0', fontSize: 15, fontWeight: 600 }}>
                  {workspace?.members?.length ?? 0} Member{workspace?.members?.length !== 1 ? 's' : ''}
                </h3>
                {canManage && (
                  <button onClick={() => setShowMemberModal(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, background: 'linear-gradient(135deg, #7c3aed, #a855f7)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    <UserPlus size={14} /> Add Member
                  </button>
                )}
              </div>

              {(!workspace?.members || workspace.members.length === 0) ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#64748b', fontSize: 14 }}>
                  No members yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {workspace.members.map(m => {
                    const u = m.user ?? m;
                    const displayName = u.name || u.email?.split('@')[0] || 'User';
                    return (
                      <div key={m.id ?? u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 10, border: '1px solid rgba(99,102,241,0.12)', background: 'rgba(15,15,25,0.6)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed88, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13 }}>
                            {displayName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{displayName}</div>
                            <div style={{ fontSize: 11, color: '#64748b' }}>{u.email}</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 999, background: 'rgba(6,182,212,0.1)', color: '#06b6d4', fontWeight: 600 }}>
                            {m.role ?? 'MEMBER'}
                          </span>
                          {canManage && u.id !== user?.id && (
                            <button
                              onClick={async () => {
                                if (!window.confirm('Remove member?')) return;
                                try {
                                  await workspacesApi.removeMember(id, u.id);
                                  showToast('Member removed');
                                  load();
                                } catch (err) { showToast(`Error: ${err.message}`); }
                              }}
                              style={{ padding: '3px 6px', borderRadius: 6, border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.05)', color: '#ef4444', cursor: 'pointer' }}>
                              <Trash2 size={11} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Project modal */}
      {showProjectModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'rgba(13,13,22,0.98)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, color: '#e2e8f0', fontWeight: 700, fontSize: 16 }}>{editProject ? 'Edit Project' : 'New Project'}</h3>
              <button onClick={() => setShowProjectModal(false)} style={{ padding: 4, borderRadius: 6, border: 'none', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', cursor: 'pointer' }}><X size={16} /></button>
            </div>
            <form onSubmit={handleSaveProject} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>Project Name *</label>
                <input type="text" value={formName} onChange={e => setFormName(e.target.value)} placeholder="My Project" required
                  style={{ width: '100%', padding: '9px 10px', borderRadius: 8, border: '1px solid rgba(99,102,241,0.25)', background: 'rgba(15,15,25,0.8)', color: '#e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>Description</label>
                <textarea value={formDesc} onChange={e => setFormDesc(e.target.value)} placeholder="What is this project about?" rows={3}
                  style={{ width: '100%', padding: '9px 10px', borderRadius: 8, border: '1px solid rgba(99,102,241,0.25)', background: 'rgba(15,15,25,0.8)', color: '#e2e8f0', fontSize: 14, outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowProjectModal(false)}
                  style={{ padding: '9px 16px', borderRadius: 8, border: '1px solid rgba(99,102,241,0.2)', background: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
                <button type="submit" disabled={saving || !formName.trim()}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 8, background: 'linear-gradient(135deg, #7c3aed, #a855f7)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                  {saving ? <Loader2 size={14} className="dash-spinner" /> : <Save size={14} />}
                  {editProject ? 'Save' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add member modal */}
      {showMemberModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'rgba(13,13,22,0.98)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 380, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, color: '#e2e8f0', fontWeight: 700, fontSize: 16 }}>Add Member</h3>
              <button onClick={() => setShowMemberModal(false)} style={{ padding: 4, borderRadius: 6, border: 'none', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', cursor: 'pointer' }}><X size={16} /></button>
            </div>
            <p style={{ margin: '0 0 16px', fontSize: 12, color: '#64748b' }}>Enter the user ID or email of the member you want to add.</p>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const val = memberEmail.trim();
              if (!val) return;
              setSaving(true);
              try {
                const parsedVal = /^\d+$/.test(val) ? Number(val) : val;
                await workspacesApi.addMember(id, parsedVal, 'MEMBER');
                showToast('Member added');
                setShowMemberModal(false);
                setMemberEmail('');
                load();
              } catch (err) { showToast(`Error: ${err.message}`); }
              finally { setSaving(false); }
            }} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>User ID or Email</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                  <input type="text" value={memberEmail} onChange={e => setMemberEmail(e.target.value)} placeholder="Enter user ID or email" required
                    style={{ width: '100%', padding: '9px 10px 9px 32px', borderRadius: 8, border: '1px solid rgba(99,102,241,0.25)', background: 'rgba(15,15,25,0.8)', color: '#e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowMemberModal(false)}
                  style={{ padding: '9px 16px', borderRadius: 8, border: '1px solid rgba(99,102,241,0.2)', background: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
                <button type="submit" disabled={saving}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 8, background: 'linear-gradient(135deg, #7c3aed, #a855f7)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                  {saving ? <Loader2 size={14} className="dash-spinner" /> : <UserPlus size={14} />}
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, background: 'rgba(13,13,22,0.95)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 10, padding: '12px 18px', color: '#e2e8f0', fontSize: 13, boxShadow: '0 8px 32px rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)' }}>
          {toast}
        </div>
      )}
    </div>
  );
}
