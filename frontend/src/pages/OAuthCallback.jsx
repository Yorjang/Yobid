import { useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

/**
 * OAuthCallback — intermediate page that receives the JWT token from the
 * backend OAuth redirect (/oauth/callback?token=<jwt>) and stores it in
 * localStorage before navigating to the dashboard.
 */
export default function OAuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = useMemo(() => new URLSearchParams(location.search).get('token'), [location.search]);
  const status = token ? 'success' : 'error';
  const message = token ? '' : 'Authentication failed. No token received.';

  useEffect(() => {
    if (token) {
      localStorage.setItem('access_token', token);
      const timeoutId = setTimeout(() => navigate('/dashboard', { replace: true }), 1200);
      return () => clearTimeout(timeoutId);
    } else {
      const timeoutId = setTimeout(() => navigate('/login', { replace: true }), 3000);
      return () => clearTimeout(timeoutId);
    }
  }, [token, navigate]);

  return (
    <div className="oauth-callback-page">
      <div className="oauth-callback-card">
        {status === 'loading' && (
          <>
            <div className="oauth-spinner-wrap">
              <Loader2 className="oauth-spinner" size={40} />
            </div>
            <h2 className="oauth-title">Signing you in...</h2>
            <p className="oauth-subtitle">Please wait while we complete authentication.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="oauth-icon-wrap oauth-icon-wrap--success">
              <CheckCircle2 size={40} />
            </div>
            <h2 className="oauth-title">Login successful!</h2>
            <p className="oauth-subtitle">Redirecting to your dashboard...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="oauth-icon-wrap oauth-icon-wrap--error">
              <XCircle size={40} />
            </div>
            <h2 className="oauth-title">Authentication failed</h2>
            <p className="oauth-subtitle">{message || 'Redirecting back to login...'}</p>
          </>
        )}
      </div>
    </div>
  );
}
