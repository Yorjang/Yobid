import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Database, Shield, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ sidebarOpen, toggleSidebar }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isAdmin = user?.role === 'ADMIN';
  const path = location.pathname;

  return (
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
        <button
          onClick={() => navigate('/dashboard')}
          className={`dash-nav-item ${path === '/dashboard' ? 'dash-nav-item--active' : ''}`}
          style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}
        >
          <LayoutDashboard size={18} />
          {sidebarOpen && <span>Dashboard</span>}
        </button>
        <button
          onClick={() => navigate('/workspaces')}
          className={`dash-nav-item ${path.startsWith('/workspaces') ? 'dash-nav-item--active' : ''}`}
          style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}
        >
          <Database size={18} />
          {sidebarOpen && <span>Workspaces</span>}
        </button>
        {isAdmin && (
          <button
            onClick={() => navigate('/admin')}
            className={`dash-nav-item ${path === '/admin' ? 'dash-nav-item--active' : ''}`}
            style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}
          >
            <Shield size={18} />
            {sidebarOpen && <span>Admin Panel</span>}
          </button>
        )}
        <button
          onClick={() => navigate('/settings')}
          className={`dash-nav-item ${path.startsWith('/settings') ? 'dash-nav-item--active' : ''}`}
          style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}
        >
          <Settings size={18} />
          {sidebarOpen && <span>Settings</span>}
        </button>
      </nav>

      <button className="dash-sidebar-toggle" onClick={toggleSidebar} aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}>
        {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>
    </aside>
  );
}
