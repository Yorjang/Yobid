import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

/**
 * AuthProvider wraps the entire app.
 * It loads the stored token on mount, fetches the user profile,
 * and exposes login / logout / updateUser helpers.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);           // full user object from backend
  const [loading, setLoading] = useState(true);     // true while checking token on mount

  // ── Bootstrap: check token on page load ─────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setLoading(false);
      return;
    }

    authApi
      .getProfile()
      .then((profile) => setUser(profile))
      .catch(() => {
        // Token invalid / expired → clear it
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
      })
      .finally(() => setLoading(false));
  }, []);

  // ── Login: store token + set user ───────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const data = await authApi.login(email, password);
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  }, []);

  // ── Login from OAuth token (received via redirect) ───────────────────────
  const loginWithToken = useCallback(async (token) => {
    localStorage.setItem('access_token', token);
    const profile = await authApi.getProfile();
    localStorage.setItem('user', JSON.stringify(profile));
    setUser(profile);
    return profile;
  }, []);

  // ── Logout ───────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  // ── Update local user state after profile edit ───────────────────────────
  const updateUser = useCallback((updated) => {
    setUser(updated);
    localStorage.setItem('user', JSON.stringify(updated));
  }, []);

  const isAuthenticated = Boolean(user);
  const role = user?.role ?? null;

  return (
    <AuthContext.Provider
      value={{ user, loading, isAuthenticated, role, login, loginWithToken, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/** Hook to consume auth context */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
