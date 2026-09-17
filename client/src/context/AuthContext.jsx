import { createContext, useCallback, useEffect, useState } from 'react';
import { authApi } from '../api/authApi';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | authenticated | unauthenticated

  const loadUser = useCallback(async () => {
    try {
      const res = await authApi.me();
      setUser(res.data.data.user);
      setStatus('authenticated');
    } catch {
      setUser(null);
      setStatus('unauthenticated');
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = useCallback(async (credentials) => {
    const res = await authApi.login(credentials);
    setUser(res.data.data.user);
    setStatus('authenticated');
    return res.data.data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const res = await authApi.register(payload);
    setUser(res.data.data.user);
    setStatus('authenticated');
    return res.data.data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      setStatus('unauthenticated');
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, status, login, register, logout, refresh: loadUser }}>
      {children}
    </AuthContext.Provider>
  );
}
