import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('incyra_token'));
  const [isLoading, setIsLoading] = useState(true);

  // Validate session on mount or token change
  useEffect(() => {
    let isMounted = true;
    async function loadUser() {
      const storedToken = localStorage.getItem('incyra_token');
      if (!storedToken) {
        if (isMounted) {
          setUser(null);
          setIsLoading(false);
        }
        return;
      }

      try {
        const userData = await apiService.getMe();
        if (isMounted) {
          setUser(userData);
        }
      } catch (err) {
        console.warn('[AUTH] Failed to fetch current user:', err.message);
        if (isMounted) {
          setUser(null);
          setToken(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadUser();
    return () => {
      isMounted = false;
    };
  }, [token]);

  const login = useCallback(async ({ email, password }) => {
    setIsLoading(true);
    try {
      const data = await apiService.login({ email, password });
      setUser(data.user);
      setToken(data.token);
      return data;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async ({ name, email, password }) => {
    setIsLoading(true);
    try {
      const data = await apiService.register({ name, email, password });
      setUser(data.user);
      setToken(data.token);
      return data;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    apiService.logout();
    setUser(null);
    setToken(null);
  }, []);

  const value = {
    user,
    token,
    isLoading,
    isAuthenticated: Boolean(user && token),
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
