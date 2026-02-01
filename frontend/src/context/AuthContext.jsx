import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { apiRequest, clearToken, getToken, setToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    apiRequest('/auth/me')
      .then((data) => {
        setUser(data.user);
      })
      .catch(() => {
        clearToken();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo(
    () => ({
      user,
      setUser,
      loading,
      loginWithToken: (token, userData) => {
        setToken(token);
        setUser(userData);
      },
      logout: () => {
        clearToken();
        setUser(null);
      }
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
