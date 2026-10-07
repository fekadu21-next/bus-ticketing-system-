import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { apiService, type VerifierUser, MOCK_VERIFIER_USER } from '@/services/api';
import { storage } from '@/utils/storage';

interface AuthContextType {
  user: VerifierUser | null;
  accessToken: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const TOKEN_KEY = 'verifier_accessToken';
const USER_KEY = 'verifier_authUser';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<VerifierUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const persistSession = async (token: string | null, nextUser: VerifierUser | null) => {
    apiService.setToken(token);
    setAccessToken(token);
    setUser(nextUser);

    if (token) {
      await storage.setItem(TOKEN_KEY, token);
    } else {
      await storage.removeItem(TOKEN_KEY);
    }

    if (nextUser) {
      await storage.setItem(USER_KEY, JSON.stringify(nextUser));
    } else {
      await storage.removeItem(USER_KEY);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const [token, cachedUser] = await Promise.all([
          storage.getItem(TOKEN_KEY),
          storage.getItem(USER_KEY),
        ]);

        if (token && cachedUser) {
          apiService.setToken(token);
          setAccessToken(token);
          setUser(JSON.parse(cachedUser));
        }
      } catch (err) {
        console.error('[AuthProvider] Auth check failed:', err);
      } finally {
        setLoading(false);
      }
    };

    void checkAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      const res = await apiService.login(email.trim(), password);
      if (res.success && res.data?.user && res.data?.accessToken) {
        await persistSession(res.data.accessToken, res.data.user);
        return { success: true };
      }
      const msg = res.error || 'Login failed';
      setError(msg);
      return { success: false, error: msg };
    } catch {
      const msg = 'Login failed';
      setError(msg);
      return { success: false, error: msg };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiService.logout();
    } finally {
      await persistSession(null, null);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo(
    () => ({
      user,
      accessToken,
      loading,
      error,
      login,
      logout,
      clearError,
    }),
    [user, accessToken, loading, error, login, logout, clearError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
