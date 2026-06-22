import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/**
 * OAuthCallback — receives the JWT token from the backend OAuth redirect
 * (/oauth/callback?token=<jwt>), fetches the full user profile via AuthContext,
 * then navigates to the dashboard.
 */
export default function OAuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithToken } = useAuth();

  const token = useMemo(
    () => new URLSearchParams(location.search).get('token'),
    [location.search],
  );

  const [status, setStatus] = useState(token ? 'loading' : 'error');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMsg('Authentication failed. No token received.');
      const id = setTimeout(() => navigate('/login', { replace: true }), 3000);
      return () => clearTimeout(id);
    }

    loginWithToken(token)
      .then(() => {
        setStatus('success');
        const id = setTimeout(() => navigate('/dashboard', { replace: true }), 1200);
        return () => clearTimeout(id);
      })
      .catch((err) => {
        setStatus('error');
        setErrorMsg(err.message || 'Authentication failed.');
        const id = setTimeout(() => navigate('/login', { replace: true }), 3000);
        return () => clearTimeout(id);
      });
  }, [token, loginWithToken, navigate]);

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
            <p className="oauth-subtitle">{errorMsg || 'Redirecting back to login...'}</p>
          </>
        )}
      </div>
    </div>
  );
}
