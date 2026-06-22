import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

/**
 * Wraps a route so only authenticated users can access it.
 * While the auth state is loading (checking token), shows a spinner.
 * Unauthenticated users are redirected to /login with the current path
 * saved so they can be sent back after login.
 *
 * Optional: pass `allowedRoles` to restrict to specific roles.
 * e.g. <PrivateRoute allowedRoles={['ADMIN']}><AdminPanel /></PrivateRoute>
 */
export default function PrivateRoute({ children, allowedRoles }) {
  const { isAuthenticated, loading, role } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="dash-loading-screen">
        <div className="dash-loading-card">
          <div className="dash-loading-icon">
            <Loader2 size={32} className="dash-spinner" />
          </div>
          <p className="dash-loading-text">Checking authentication…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    // Authenticated but wrong role → redirect to dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
