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

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const token = useMemo(() => searchParams.get('token'), [searchParams]);
  const otpRequired = useMemo(() => searchParams.get('otpRequired') === 'true', [searchParams]);
  const email = useMemo(() => searchParams.get('email') || '', [searchParams]);

  const [status, setStatus] = useState(() => {
    if (token) return 'loading';
    if (otpRequired) return 'otp';
    return 'error';
  });
  const [errorMsg, setErrorMsg] = useState('');

  // OTP Local States
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendMessage, setResendMessage] = useState('');

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  useEffect(() => {
    if (otpRequired) {
      // Focus first input automatically when OTP mode loads
      const firstInput = document.getElementById('otp-input-0');
      if (firstInput) firstInput.focus();
      return;
    }

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
  }, [token, otpRequired, loginWithToken, navigate]);

  const handleOtpChange = (index, value) => {
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...otpCode];
    newCode[index] = value;
    setOtpCode(newCode);
    setOtpError('');

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      if (prevInput) {
        prevInput.focus();
        const newCode = [...otpCode];
        newCode[index - 1] = '';
        setOtpCode(newCode);
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      setOtpCode(digits);
      setOtpError('');
      const lastInput = document.getElementById('otp-input-5');
      if (lastInput) lastInput.focus();
    }
  };

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    const codeStr = otpCode.join('');
    if (codeStr.length < 6) {
      setOtpError('Please enter all 6 digits.');
      return;
    }

    setIsVerifying(true);
    setOtpError('');

    try {
      const response = await fetch('http://localhost:3000/auth/google/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: codeStr }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Verification failed. Please check the code.');
      }

      const data = await response.json();
      await loginWithToken(data.access_token);
      setStatus('success');
      setTimeout(() => navigate('/dashboard', { replace: true }), 1200);
    } catch (err) {
      setOtpError(err.message);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    
    setResendMessage('');
    setOtpError('');
    
    try {
      const response = await fetch('http://localhost:3000/auth/google/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to resend code.');
      }

      setResendMessage('A new code has been sent to your email.');
      setResendCooldown(60);
      setOtpCode(['', '', '', '', '', '']);
      const firstInput = document.getElementById('otp-input-0');
      if (firstInput) firstInput.focus();
    } catch (err) {
      setOtpError(err.message);
    }
  };

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

        {status === 'otp' && (
          <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <h2 className="oauth-title" style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b', marginBottom: '8px' }}>
              Verify Your Email
            </h2>
            <p className="oauth-subtitle" style={{ fontSize: '0.875rem', color: '#64748b', textAlign: 'center', marginBottom: '24px', maxWidth: '340px', lineHeight: '1.5' }}>
              We sent a 6-digit verification code to <strong style={{ color: '#7c3aed' }}>{email}</strong>. Please enter it below to complete sign-in.
            </p>

            {/* 6-digit box inputs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              {otpCode.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-input-${index}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  style={{
                    width: '45px',
                    height: '50px',
                    fontSize: '1.25rem',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    border: '2px solid #cbd5e1',
                    borderRadius: '8px',
                    outline: 'none',
                    backgroundColor: '#fff',
                    color: '#0f172a',
                    transition: 'all 0.15s ease-in-out',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#7c3aed';
                    e.target.style.boxShadow = '0 0 0 3px rgba(124, 58, 237, 0.15)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#cbd5e1';
                    e.target.style.boxShadow = 'none';
                  }}
                  required
                />
              ))}
            </div>

            {otpError && (
              <p style={{ color: '#ef4444', fontSize: '0.8rem', fontWeight: 600, marginBottom: '16px', textAlign: 'center' }}>
                ⚠️ {otpError}
              </p>
            )}

            {resendMessage && (
              <p style={{ color: '#10b981', fontSize: '0.8rem', fontWeight: 600, marginBottom: '16px', textAlign: 'center' }}>
                ✅ {resendMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={isVerifying}
              style={{
                width: '100%',
                padding: '0.875rem',
                backgroundColor: '#7c3aed',
                border: 'none',
                color: '#fff',
                fontWeight: 600,
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'background 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginBottom: '16px',
              }}
            >
              {isVerifying ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Verifying...
                </>
              ) : (
                'Verify & Log In'
              )}
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '0.8rem' }}>
              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0}
                style={{
                  background: 'none',
                  border: 'none',
                  color: resendCooldown > 0 ? '#94a3b8' : '#7c3aed',
                  fontWeight: 600,
                  cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                }}
              >
                {resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : 'Resend Code'}
              </button>

              <button
                type="button"
                onClick={() => navigate('/login')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Back to Login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
