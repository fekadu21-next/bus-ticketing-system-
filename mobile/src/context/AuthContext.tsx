import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { apiService, normalizeUser, type AuthUser } from '@/services/api';
import { storage } from '@/utils/storage';

interface AuthContextType {
  user: AuthUser | null;
  accessToken: string | null;
  loading: boolean;
  error: string | null;
  clearError: () => void;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    password: string;
    confirmPassword: string;
  }) => Promise<{
    success: boolean;
    error?: string;
    message?: string;
    data?: { user?: AuthUser; accessToken?: string };
        errors?: { message: string }[];
  }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const TOKEN_KEY = 'accessToken';
const USER_KEY = 'authUser';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const persistSession = async (token: string | null, nextUser: AuthUser | null) => {
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
        const [token, cachedUserRaw] = await Promise.all([
          storage.getItem(TOKEN_KEY),
          storage.getItem(USER_KEY),
        ]);

        if (!token) {
          return;
        }

        apiService.setToken(token);
        setAccessToken(token);

        if (cachedUserRaw) {
          try {
            setUser(normalizeUser(JSON.parse(cachedUserRaw) as AuthUser & Record<string, unknown>));
          } catch {
            await storage.removeItem(USER_KEY);
          }
        }

        const result = await apiService.getMe();
        if (result.success && result.data?.user) {
          setUser(result.data.user);
          await storage.setItem(USER_KEY, JSON.stringify(result.data.user));
          return;
        }

        const unauthorized = result.error?.toLowerCase().includes('unauthorized') ||
          result.error?.includes('(401)');
        if (unauthorized) {
          await persistSession(null, null);
        }
      } catch (authError) {
        console.error('[AuthProvider] Auth check failed:', authError);
      } finally {
        setLoading(false);
      }
    };

    void checkAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      const result = await apiService.login(email.trim(), password);
      if (result.success && result.data?.accessToken && result.data.user) {
        await persistSession(result.data.accessToken, result.data.user);
        return { success: true };
      }
      const nextError = result.error || 'Login failed';
      setError(nextError);
      return { success: false, error: nextError };
    } catch {
      const nextError = 'Login failed';
      setError(nextError);
      return { success: false, error: nextError };
    }
  }, []);

  const register = useCallback(async (data: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    password: string;
    confirmPassword: string;
  }) => {
    setError(null);
    try {
      const result = await apiService.register(data);
      if (result.success) {
        if (result.data?.accessToken && result.data.user) {
          await persistSession(result.data.accessToken, result.data.user);
        }
        return { success: true, message: result.message, data: result.data };
      }
      const nextError = result.error || 'Registration failed';
      setError(nextError);
      return { success: false, error: nextError, errors: result.errors };
    } catch {
      const nextError = 'Registration failed';
      setError(nextError);
      return { success: false, error: nextError };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiService.logout();
    } catch (logoutError) {
      console.error('[AuthProvider] Logout error:', logoutError);
    } finally {
      await persistSession(null, null);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo(
    () => ({
      user,
      accessToken,
      login,
      register,
      logout,
      loading,
      error,
      clearError,
    }),
    [user, accessToken, login, register, logout, loading, error, clearError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
