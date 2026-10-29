const AUTH_SESSION_KEY = 'ticketing.auth.session';
const AUTH_USER_ID_KEY = 'ticketing.auth.userId';
const AUTH_ORIGINAL_USER_ID_KEY = 'ticketing.auth.originalUserId';

export const isJwtExpired = (token, skewMs = 15_000) => {
  if (!token || typeof token !== 'string') return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (!payload?.exp) return true;
    return payload.exp * 1000 <= Date.now() + skewMs;
  } catch {
    return true;
  }
};

export const loadAuthSession = () => {
  try {
    let raw = sessionStorage.getItem(AUTH_SESSION_KEY);
    if (!raw) {
      raw = localStorage.getItem(AUTH_SESSION_KEY);
    }
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.accessToken || !parsed?.user) {
      clearAuthSession();
      return null;
    }
    if (isJwtExpired(parsed.accessToken)) {
      clearAuthSession();
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

export const saveAuthSession = (accessToken, user, isExplicitLogin = false) => {
  if (!accessToken || !user) return;
  try {
    const serialized = JSON.stringify({ accessToken, user });
    sessionStorage.setItem(AUTH_SESSION_KEY, serialized);
    sessionStorage.setItem(AUTH_USER_ID_KEY, String(user.id));
    localStorage.setItem(AUTH_SESSION_KEY, serialized);
    localStorage.setItem(AUTH_USER_ID_KEY, String(user.id));

    // Reset or set original user ID on explicit login or initial session creation
    if (isExplicitLogin || !sessionStorage.getItem(AUTH_ORIGINAL_USER_ID_KEY)) {
      sessionStorage.setItem(AUTH_ORIGINAL_USER_ID_KEY, String(user.id));
      localStorage.setItem(AUTH_ORIGINAL_USER_ID_KEY, String(user.id));
    }
  } catch {
    // Ignore quota / private-mode failures
  }
};

export const clearAuthSession = () => {
  try {
    sessionStorage.removeItem(AUTH_SESSION_KEY);
    sessionStorage.removeItem(AUTH_USER_ID_KEY);
    sessionStorage.removeItem(AUTH_ORIGINAL_USER_ID_KEY);
    localStorage.removeItem(AUTH_SESSION_KEY);
    localStorage.removeItem(AUTH_USER_ID_KEY);
    localStorage.removeItem(AUTH_ORIGINAL_USER_ID_KEY);
  } catch {
    // ignore
  }
};

export const checkSessionMismatch = (currentUser) => {
  try {
    const originalUserId = sessionStorage.getItem(AUTH_ORIGINAL_USER_ID_KEY) || localStorage.getItem(AUTH_ORIGINAL_USER_ID_KEY);
    const currentUserId = sessionStorage.getItem(AUTH_USER_ID_KEY) || localStorage.getItem(AUTH_USER_ID_KEY);
    
    // Check if the current user ID differs from the original logged-in user ID
    if (originalUserId && currentUser?.id && String(originalUserId) !== String(currentUser.id)) {
      console.warn('Session user ID mismatch detected - original user:', originalUserId, 'current user:', currentUser.id);
      return true;
    }
    
    // Also check if the stored current user ID differs from the new user
    if (currentUserId && currentUser?.id && String(currentUserId) !== String(currentUser.id)) {
      console.warn('Stored user ID mismatch detected - stored:', currentUserId, 'new:', currentUser.id);
      return true;
    }
    
    return false;
  } catch {
    return false;
  }
};
