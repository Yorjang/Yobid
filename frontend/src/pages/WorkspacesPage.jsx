import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Database, Plus, ChevronLeft, ChevronRight, Loader2,
  Settings, Shield, LayoutDashboard, CheckSquare,
  LogOut, Bell, Pencil, Trash2, Users, FolderOpen,
  X, Save, Globe, Lock, ArrowRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { workspacesApi } from '../services/api';
import Sidebar from '../components/Sidebar';

const CAN_CREATE = ['ADMIN', 'PROJECT_MANAGER'];

export default function WorkspacesPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);  // create/edit modal
  const [editTarget, setEditTarget] = useState(null);   // null = create, obj = edit
  const [formName, setFormName]     = useState('');
  const [formDesc, setFormDesc]     = useState('');
  const [saving, setSaving]         = useState(false);
  const [deleting, setDeleting]     = useState(null);
  const [toast, setToast]           = useState('');

  const [sidebarOpen, setSidebarOpen] = useState(() =>
    JSON.parse(localStorage.getItem('sidebarOpen') ?? 'true'),
  );
  const toggleSidebar = () => setSidebarOpen(p => { const v = !p; localStorage.setItem('sidebarOpen', v); return v; });

  const canCreate = CAN_CREATE.includes(user?.role);
  const isAdmin   = user?.role === 'ADMIN';

  const load = async () => {
    setLoading(true);
    try {
      const data = await workspacesApi.list();
      setWorkspaces(data);
    } catch { /* silently */ }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  /* ── Open create / edit modal ─────────────────────────────────── */
  const openCreate = () => {
    setEditTarget(null);
    setFormName('');
    setFormDesc('');
    setShowModal(true);
  };

  const openEdit = (ws) => {
    setEditTarget(ws);
    setFormName(ws.name);
    setFormDesc(ws.description || '');
    setShowModal(true);
  };

  /* ── Save ─────────────────────────────────────────────────────── */
  const handleSave = async (e) => {
    e.preventDefault();
    if (!formName.trim()) return;
    setSaving(true);
    try {
      if (editTarget) {
        await workspacesApi.update(editTarget.id, { name: formName.trim(), description: formDesc.trim() });
        showToast('Workspace updated');
      } else {
        await workspacesApi.create({ name: formName.trim(), description: formDesc.trim() });
        showToast('Workspace created');
      }
      setShowModal(false);
      load();
    } catch (err) {
      showToast(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  /* ── Delete ───────────────────────────────────────────────────── */
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this workspace? All projects inside will be lost.')) return;
    setDeleting(id);
    try {
      await workspacesApi.remove(id);
      showToast('Workspace deleted');
      load();
    } catch (err) {
      showToast(`Error: ${err.message}`);
    } finally {
      setDeleting(null);
    }
  };

  /* ── Render ─────────────────────────────────────────────────────── */
  const userDisplayName = user?.name || user?.email?.split('@')[0] || 'User';
  const avatarLetter    = userDisplayName.charAt(0).toUpperCase();

  return (
    <div className={`dash-page ${sidebarOpen ? '' : 'dash-page--collapsed'}`}>

      {/* ── Sidebar ── */}
      <Sidebar sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

      {/* ── Main ── */}
      <div className="dash-main">
        <header className="dash-topbar">
          <div className="dash-topbar-left">
            <h2 className="dash-page-title">Workspaces</h2>
          </div>
          <div className="dash-topbar-right">
            <button className="dash-icon-btn" aria-label="Notifications"><Bell size={18} /></button>
            {canCreate && (
              <button
                onClick={openCreate}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, background: 'linear-gradient(135deg, #7c3aed, #a855f7)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                <Plus size={15} /> New Workspace
              </button>
            )}
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
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
              <Loader2 size={32} className="dash-spinner" />
            </div>
          ) : workspaces.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 60, gap: 16 }}>
              <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(124,58,237,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Database size={28} style={{ color: '#7c3aed' }} />
              </div>
              <h3 style={{ margin: 0, color: '#e2e8f0', fontWeight: 600 }}>No workspaces yet</h3>
              <p style={{ margin: 0, color: '#64748b', fontSize: 14 }}>
                {canCreate ? 'Create your first workspace to get started.' : 'You haven\'t been added to any workspace yet.'}
              </p>
              {canCreate && (
                <button onClick={openCreate}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 8, background: 'linear-gradient(135deg, #7c3aed, #a855f7)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  <Plus size={15} /> Create Workspace
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {workspaces.map(ws => {
                const isOwner = ws.ownerId === user?.id || isAdmin;
                const memberCount = ws._count?.members ?? ws.members?.length ?? 0;
                const projectCount = ws._count?.projects ?? ws.projects?.length ?? 0;

                return (
                  <div key={ws.id} style={{
                    borderRadius: 14, border: '1px solid rgba(99,102,241,0.15)',
                    background: 'rgba(15,15,25,0.7)', padding: 20,
                    display: 'flex', flexDirection: 'column', gap: 12,
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    cursor: 'pointer',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(124,58,237,0.4)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(124,58,237,0.1)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.15)'; e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #7c3aed88, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Globe size={18} style={{ color: '#fff' }} />
                        </div>
                        <div>
                          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#e2e8f0', lineHeight: 1.2 }}>{ws.name}</h3>
                          {ws.description && (
                            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b', lineHeight: 1.3 }}>{ws.description}</p>
                          )}
                        </div>
                      </div>
                      {isOwner && (
                        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                          <button onClick={(e) => { e.stopPropagation(); openEdit(ws); }}
                            style={{ padding: '4px 6px', borderRadius: 6, border: '1px solid rgba(99,102,241,0.2)', background: 'rgba(15,15,25,0.6)', color: '#94a3b8', cursor: 'pointer' }}>
                            <Pencil size={12} />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); handleDelete(ws.id); }}
                            style={{ padding: '4px 6px', borderRadius: 6, border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.05)', color: '#ef4444', cursor: 'pointer' }}
                            disabled={deleting === ws.id}
                          >
                            {deleting === ws.id ? <Loader2 size={12} className="dash-spinner" /> : <Trash2 size={12} />}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Stats row */}
                    <div style={{ display: 'flex', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#94a3b8' }}>
                        <Users size={13} style={{ color: '#7c3aed' }} />
                        {memberCount} member{memberCount !== 1 ? 's' : ''}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#94a3b8' }}>
                        <FolderOpen size={13} style={{ color: '#06b6d4' }} />
                        {projectCount} project{projectCount !== 1 ? 's' : ''}
                      </div>
                    </div>

                    {/* Owner badge */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: '#64748b' }}>
                        {ws.ownerId === user?.id ? (
                          <span style={{ color: '#10b981', fontWeight: 600 }}>👑 Owner</span>
                        ) : (
                          <span>Member</span>
                        )}
                      </span>
                      <button
                        onClick={() => navigate(`/workspaces/${ws.id}`)}
                        style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 6, background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', color: '#a855f7', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                      >
                        Open <ArrowRight size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Create / Edit Modal ── */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'rgba(13,13,22,0.98)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, color: '#e2e8f0', fontWeight: 700, fontSize: 16 }}>
                {editTarget ? 'Edit Workspace' : 'New Workspace'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ padding: 4, borderRadius: 6, border: 'none', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>Workspace Name *</label>
                <div style={{ position: 'relative' }}>
                  <Database size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                  <input
                    type="text"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    placeholder="My Awesome Team"
                    required
                    style={{ width: '100%', padding: '9px 10px 9px 32px', borderRadius: 8, border: '1px solid rgba(99,102,241,0.25)', background: 'rgba(15,15,25,0.8)', color: '#e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>Description</label>
                <textarea
                  value={formDesc}
                  onChange={e => setFormDesc(e.target.value)}
                  placeholder="What is this workspace for?"
                  rows={3}
                  style={{ width: '100%', padding: '9px 10px', borderRadius: 8, border: '1px solid rgba(99,102,241,0.25)', background: 'rgba(15,15,25,0.8)', color: '#e2e8f0', fontSize: 14, outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
                <button type="button" onClick={() => setShowModal(false)}
                  style={{ padding: '9px 16px', borderRadius: 8, border: '1px solid rgba(99,102,241,0.2)', background: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 13 }}>
                  Cancel
                </button>
                <button type="submit" disabled={saving || !formName.trim()}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 8, background: 'linear-gradient(135deg, #7c3aed, #a855f7)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                  {saving ? <Loader2 size={14} className="dash-spinner" /> : <Save size={14} />}
                  {editTarget ? 'Save Changes' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, background: 'rgba(13,13,22,0.95)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 10, padding: '12px 18px', color: '#e2e8f0', fontSize: 13, boxShadow: '0 8px 32px rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckSquare size={15} style={{ color: '#10b981' }} />
          {toast}
        </div>
      )}
    </div>
  );
}

