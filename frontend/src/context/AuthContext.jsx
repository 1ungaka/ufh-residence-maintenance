/**
 * Holds the logged-in user for the whole app.
 * On page load the stored token is checked against /auth/me, so an expired
 * token simply logs the person out instead of showing a broken screen.
 */
import { createContext, useContext, useEffect, useState } from 'react';
import { api, tokenStore } from '../api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tokenStore.get()) {
      setLoading(false);
      return;
    }
    api
      .me()
      .then((data) => setUser(data.user))
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false));
  }, []);

  // Any 401 from the API means the session is over; drop the user immediately.
  useEffect(() => {
    const handleExpired = () => setUser(null);
    window.addEventListener('ufh:session-expired', handleExpired);
    return () => window.removeEventListener('ufh:session-expired', handleExpired);
  }, []);

  const login = async (email, password) => {
    const data = await api.login(email, password);
    tokenStore.set(data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (payload) => {
    const data = await api.register(payload);
    tokenStore.set(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    tokenStore.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
