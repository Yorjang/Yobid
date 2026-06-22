import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import OAuthCallback from './pages/OAuthCallback';
import Settings from './pages/Settings';
import AdminPage from './pages/AdminPage';
import WorkspacesPage from './pages/WorkspacesPage';
import WorkspaceDetailPage from './pages/WorkspaceDetailPage';
import { Loader2 } from 'lucide-react';

/** Redirect already-logged-in users away from auth pages */
function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="dash-loading-screen">
        <div className="dash-loading-card">
          <div className="dash-loading-icon">
            <Loader2 size={32} className="dash-spinner" />
          </div>
          <p className="dash-loading-text">Loading…</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
}

function App() {
  return (
    <Router>
      <div className="app-container">
        <Routes>
          {/* ── Public pages (redirect to /dashboard if already logged in) ── */}
          <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

          {/* ── OAuth callback ── */}
          <Route path="/oauth/callback" element={<OAuthCallback />} />

          {/* ── Protected: All authenticated users ── */}
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/settings"  element={<PrivateRoute><Settings /></PrivateRoute>} />

          {/* ── Protected: MEMBER + PM + ADMIN (anyone authenticated) ── */}
          <Route path="/workspaces"     element={<PrivateRoute><WorkspacesPage /></PrivateRoute>} />
          <Route path="/workspaces/:id" element={<PrivateRoute><WorkspaceDetailPage /></PrivateRoute>} />

          {/* ── Protected: ADMIN only ── */}
          <Route
            path="/admin"
            element={
              <PrivateRoute allowedRoles={['ADMIN']}>
                <AdminPage />
              </PrivateRoute>
            }
          />

          {/* ── Fallback ── */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
