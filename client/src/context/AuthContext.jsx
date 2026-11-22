import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('ah_token')) {
      setReady(true);
      return;
    }
    api('auth.php?action=me')
      .then((d) => setUser(d.user))
      .catch(() => localStorage.removeItem('ah_token'))
      .finally(() => setReady(true));
  }, []);

  const saveSession = (d) => {
    localStorage.setItem('ah_token', d.token);
    setUser(d.user);
    return d.user;
  };

  const login = async (email, password) => saveSession(await api('auth.php?action=login', { method: 'POST', body: { email, password } }));
  const register = async (form) => saveSession(await api('auth.php?action=register', { method: 'POST', body: form }));
  const updateProfile = async (form) => {
    const d = await api('auth.php?action=update', { method: 'POST', body: form });
    setUser(d.user);
  };
  // re-fetch the user (e.g. after the wallet balance changes)
  const refreshUser = async () => {
    try {
      const d = await api('auth.php?action=me');
      setUser(d.user);
    } catch { /* ignore */ }
  };
  const logout = async () => {
    try { await api('auth.php?action=logout', { method: 'POST' }); } catch { /* ignore */ }
    localStorage.removeItem('ah_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, ready, login, register, logout, updateProfile, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
