import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  loginApi,
  registerApi,
  registerPartnerApi,
  logoutApi,
  refreshApi,
  changePasswordApi,
  getMeApi,
} from '@/api/auth.api';
import { setAccessToken, clearAccessToken, getAccessToken, setAuthFailureHandler } from '@/services/api';
import { ROLES } from '@/constants/roles';
import { loadAuthSession, saveAuthSession, clearAuthSession, checkSessionMismatch } from '@/utils/authStorage';
import { extractUserRoles, isUserAdmin, isUserOperator, isUserPassenger } from '@/utils/userUtils';

const AuthContext = createContext(null);

const readInitialSession = () => {
  const session = loadAuthSession();
  if (session?.accessToken) {
    setAccessToken(session.accessToken);
  }
  return session;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => readInitialSession()?.user ?? null);
  const [accessToken, setTokenState] = useState(() => getAccessToken());
  const [isLoading, setIsLoading] = useState(() => !getAccessToken());
  const [error, setError] = useState(null);
  const userRef = React.useRef(user);
  userRef.current = user;

  /** Sync token to both React state and the Axios in-memory store */
  const updateAccessToken = useCallback((token) => {
    setAccessToken(token);
    setTokenState(token);
    setUser((prev) => {
      if (token && prev) {
        // Only save session if user ID hasn't changed
        const storedUserId = sessionStorage.getItem('ticketing.auth.userId');
        if (!storedUserId || storedUserId === prev.id) {
          saveAuthSession(token, prev);
        } else {
          console.warn('User ID changed during token update, not saving session');
        }
      }
      return prev;
    });
  }, []);

  /** Wipe all auth state on logout or expired session */
  const resetAuthState = useCallback(() => {
    clearAuthSession();
    clearAccessToken();
    setTokenState(null);
    setUser(null);
  }, []);

  /** Helper to get dashboard route dynamically based on user role */
  const getDashboardPath = useCallback((targetUser) => {
    const u = targetUser || user;
    if (isUserAdmin(u)) {
      return '/admin';
    }
    if (isUserOperator(u)) {
      return '/operator';
    }
    return '/my-bookings';
  }, [user]);

  /** Helper to attach locally cached avatar if available */
  const attachCachedAvatar = (userData) => {
    if (!userData) return null;
    try {
      const cached = localStorage.getItem(`user_avatar_${userData.id}`);
      if (cached && !userData.avatarUrl) {
        return { ...userData, avatarUrl: cached };
      }
    } catch {
      // ignore
    }
    return userData;
  };

  /** Update profile avatar in state and persist to local storage (optional to all roles) */
  const updateUserAvatar = useCallback((avatarUrl) => {
    setUser((prev) => {
      if (!prev) return prev;
      try {
        if (avatarUrl) {
          localStorage.setItem(`user_avatar_${prev.id}`, avatarUrl);
        } else {
          localStorage.removeItem(`user_avatar_${prev.id}`);
        }
      } catch (e) {
        console.warn('Could not cache avatar:', e);
      }
      return { ...prev, avatarUrl: avatarUrl || null };
    });
  }, []);

  const applySession = useCallback((token, userData, isExplicitLogin = false) => {
    if (!token || !userData) return false;
    
    // Check for session mismatch before applying unless this is an explicit login
    if (!isExplicitLogin && checkSessionMismatch(userData)) {
      console.warn('Session mismatch detected during background refresh, resetting auth state.');
      resetAuthState();
      return false;
    }
    
    const normalizedUser = {
      ...userData,
      roles: extractUserRoles(userData),
    };
    const nextUser = attachCachedAvatar(normalizedUser);
    setAccessToken(token);
    setTokenState(token);
    setUser(nextUser);
    saveAuthSession(token, nextUser, isExplicitLogin);
    return true;
  }, [resetAuthState]);

  // Session initialization — restore cached session, then try cookie refresh
  const checkAuth = useCallback(async () => {
    const existingToken = getAccessToken();
    if (!existingToken) {
      setIsLoading(true);
    }

    const keepExistingSession = () => {
      const cached = loadAuthSession();
      if (cached?.accessToken && cached?.user) {
        console.log('Keeping existing cached session for user:', cached.user.id, cached.user.email);
        applySession(cached.accessToken, cached.user);
        return true;
      }
      return Boolean(getAccessToken() && userRef.current);
    };

    try {
      const result = await refreshApi();
      const token = result?.data?.accessToken;
      if (result?.success && token) {
        let nextUser = result.data?.user;
        console.log('Refresh API returned user:', nextUser?.id, nextUser?.email);
        
        const needsProfile =
          !nextUser?.id || !Array.isArray(nextUser.roles) || nextUser.roles.length === 0;
        if (needsProfile) {
          try {
            const meResult = await getMeApi();
            if (meResult?.success && meResult.data?.user) {
              nextUser = meResult.data.user;
              console.log('Fetched user from /me:', nextUser?.id, nextUser?.email);
            }
          } catch {
            // Keep the refresh payload if /me is unavailable
          }
        }

        if (nextUser) {
          // Check if the new user matches the original logged-in user
          if (checkSessionMismatch(nextUser)) {
            console.warn('Refresh returned different user, resetting auth state');
            resetAuthState();
          } else {
            applySession(token, nextUser);
          }
        } else if (!keepExistingSession()) {
          resetAuthState();
        }
      } else if (!keepExistingSession()) {
        resetAuthState();
      }
    } catch (err) {
      // If we already have a valid session in memory or storage, do not log the user out
      if (keepExistingSession()) {
        console.log('Preserved existing valid session despite background refresh notice');
      } else {
        resetAuthState();
      }
    } finally {
      setIsLoading(false);
    }
  }, [applySession, resetAuthState]);

  // Proactive token refresh - refreshes token 1 day before expiration
  useEffect(() => {
    if (!accessToken || !user) return;

    let refreshTimeout;

    const scheduleRefresh = () => {
      // Decode JWT to get expiration (without verification for simplicity)
      try {
        const payload = JSON.parse(atob(accessToken.split('.')[1]));
        const exp = payload.exp * 1000; // Convert to milliseconds
        const now = Date.now();
        const timeUntilExpiry = exp - now;

        // Refresh 1 day before expiration (long-lived tokens)
        const refreshTime = Math.max(timeUntilExpiry - 24 * 60 * 60 * 1000, 0);

        if (refreshTime > 0) {
          refreshTimeout = setTimeout(async () => {
            try {
              const result = await refreshApi();
              if (result.success && result.data?.accessToken) {
                updateAccessToken(result.data.accessToken);
                scheduleRefresh(); // Schedule next refresh
              } else {
                // Non-critical: retry in 1 hour without logging out
                console.log('Proactive refresh failed, will retry in 1 hour');
                setTimeout(scheduleRefresh, 60 * 60 * 1000);
              }
            } catch (err) {
              // Cookie refresh can fail after a page reload; keep a still-valid access token
              if (err.response?.status === 401 && loadAuthSession()) {
                return;
              }
              if (err.response?.status === 401) {
                resetAuthState();
              } else {
                // Network/server errors: retry in 1 hour without logging out
                console.log('Proactive refresh error, will retry in 1 hour:', err.message);
                setTimeout(scheduleRefresh, 60 * 60 * 1000);
              }
            }
          }, refreshTime);
        }
      } catch (e) {
        console.log('Could not decode token for proactive refresh');
      }
    };

    scheduleRefresh();

    return () => {
      if (refreshTimeout) clearTimeout(refreshTimeout);
    };
  }, [accessToken, updateAccessToken, resetAuthState]);

  useEffect(() => {
    setAuthFailureHandler(resetAuthState);
    checkAuth();
  }, [checkAuth, resetAuthState]);

  // Public actions
  const login = async (email, password) => {
    setError(null);
    try {
      const response = await loginApi({ email, password });
      if (response.success && response.data) {
        const userWithAvatar = attachCachedAvatar(response.data.user);
        applySession(response.data.accessToken, userWithAvatar, true);
        const redirectPath = getDashboardPath(userWithAvatar);
        return { success: true, user: userWithAvatar, redirectPath };
      }
      throw new Error(response.message || 'Login failed');
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Failed to login';
      setError(message);
      return { success: false, error: message };
    }
  };

  const register = async (userData) => {
    setError(null);
    try {
      const response = await registerApi(userData);
      let userWithAvatar = null;
      if (response.success && response.data?.accessToken) {
        userWithAvatar = attachCachedAvatar(response.data.user);
        applySession(response.data.accessToken, userWithAvatar, true);
      }
      return {
        success: true,
        message: response.message,
        data: response.data,
        user: userWithAvatar || response.data?.user,
        redirectPath: '/profile',
      };
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Registration failed';
      const errors = err.response?.data?.errors || [];
      setError(message);
      return { success: false, error: message, errors };
    }
  };

  const registerPartner = async (partnerData) => {
    setError(null);
    try {
      const response = await registerPartnerApi(partnerData);
      return {
        success: true,
        message: response.message,
        data: response.data,
      };
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Partner registration failed';
      const errors = err.response?.data?.errors || [];
      setError(message);
      return { success: false, error: message, errors };
    }
  };

  const logout = async () => {
    try {
      // 1.5s timeout for API call so UI never hangs if network / backend delays
      await Promise.race([
        logoutApi(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Logout timeout')), 1500))
      ]);
    } catch {
      // Ignore network errors or timeouts on logout — always clear local state
    } finally {
      if (user?.id) {
        try {
          localStorage.removeItem(`user_avatar_${user.id}`);
        } catch {
          // ignore
        }
      }
      resetAuthState();
    }
  };

  const changePassword = async ({ currentPassword, newPassword, confirmPassword }) => {
    try {
      const response = await changePasswordApi({ currentPassword, newPassword, confirmPassword });
      if (response.success && response.data?.accessToken) {
        updateAccessToken(response.data.accessToken);
      }
      return { success: true, message: response.message };
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Failed to change password';
      return { success: false, error: message };
    }
  };

  const clearError = () => setError(null);

  // Role & Permission checking helpers
  const hasRole = (role) => {
    if (!user?.roles) return false;
    if (user.roles.includes(ROLES.ADMIN)) return true;
    return user.roles.includes(role);
  };

  const hasPermission = (permission) => {
    if (!user?.permissions) return false;
    if (user.roles?.includes(ROLES.ADMIN)) return true;
    return user.permissions.includes(permission);
  };

  const isAdmin = () => isUserAdmin(user);

  const isOperator = () => isUserOperator(user);

  const isBookingCoordinator = isOperator;
  const isOperationalManager = isOperator;
  const isTicketVerifier = () => {
    const roles = extractUserRoles(user);
    return roles.includes('TICKET_VERIFIER') || roles.includes(ROLES.TICKET_VERIFIER);
  };

  const isPassenger = () => isUserPassenger(user);

  // Backwards-compatible aliases
  const isPlatformAdmin = isAdmin;

  const value = {
    user,
    accessToken,
    isAuthenticated: Boolean(user && accessToken),
    isLoading,
    error,
    // Actions
    login,
    register,
    registerPartner,
    logout,
    checkAuth,
    changePassword,
    clearError,
    getDashboardPath,
    updateUserAvatar,
    // Authorization helpers
    hasRole,
    hasPermission,
    isAdmin,
    isOperator,
    isBookingCoordinator,
    isTicketVerifier,
    isPassenger,
    isPlatformAdmin,
    isOperationalManager,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
