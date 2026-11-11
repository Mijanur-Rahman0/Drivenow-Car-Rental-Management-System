import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { session } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => (session.token ? session.user : null));

  // the API client fires this when the server answers 401 (expired / invalid token)
  useEffect(() => {
    const onUnauthorized = () => setUser(null);
    window.addEventListener('dn:unauthorized', onUnauthorized);
    return () => window.removeEventListener('dn:unauthorized', onUnauthorized);
  }, []);

  const signIn = useCallback((token, userData) => {
    session.save(token, userData);
    setUser(userData);
  }, []);

  const updateUser = useCallback((userData) => {
    session.saveUser(userData);
    setUser(userData);
  }, []);

  const signOut = useCallback(async () => {
    try { await api.logout(); } catch { /* ignore */ }
    session.clear();
    setUser(null);
  }, []);

  const value = useMemo(() => ({
    user,
    isLoggedIn: !!user,
    isAdmin: !!user?.is_superuser,
    signIn, signOut, updateUser,
  }), [user, signIn, signOut, updateUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
