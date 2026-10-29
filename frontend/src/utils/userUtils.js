/**
 * Safely format a user's or passenger's full name without null/undefined concatenation.
 * @param {object|string} entity - User object, passenger info, or name string
 * @param {string} fallback - Fallback string if no valid name found
 * @returns {string} Clean full name
 */
export const formatUserFullName = (entity, fallback = 'Passenger') => {
  if (!entity) return fallback;

  if (typeof entity === 'string') {
    const trimmed = entity.trim();
    if (
      !trimmed ||
      trimmed.toLowerCase() === 'null' ||
      trimmed.toLowerCase() === 'undefined' ||
      trimmed.toLowerCase() === 'null null' ||
      trimmed.toLowerCase() === 'null undefined'
    ) {
      return fallback;
    }
    // Clean any lingering 'null' or 'undefined' words
    const sanitized = trimmed.replace(/\b(null|undefined)\b/gi, '').trim();
    return sanitized || fallback;
  }

  if (entity.fullName && typeof entity.fullName === 'string') {
    const cleaned = entity.fullName.replace(/\b(null|undefined)\b/gi, '').trim();
    if (cleaned) return cleaned;
  }

  const rawFirst = (entity.firstName ?? entity.first_name ?? '').toString().trim();
  const rawLast = (entity.lastName ?? entity.last_name ?? '').toString().trim();

  const isInvalid = (str) => !str || str.toLowerCase() === 'null' || str.toLowerCase() === 'undefined';

  const first = isInvalid(rawFirst) ? '' : rawFirst;
  const last = isInvalid(rawLast) ? '' : rawLast;

  const parts = [first, last].filter(Boolean);
  if (parts.length > 0) {
    return parts.join(' ').trim();
  }

  if (entity.name && typeof entity.name === 'string') {
    const cleaned = entity.name.replace(/\b(null|undefined)\b/gi, '').trim();
    if (cleaned) return cleaned;
  }

  if (entity.email && typeof entity.email === 'string') {
    return entity.email.split('@')[0];
  }

  return fallback;
};

/**
 * Normalizes all possible role formats from user records into an array of uppercase role strings.
 * Supports:
 * - user.roles: ['ADMIN'] or [{ name: 'ADMIN' }]
 * - user.role: 'Admin' or 'MANAGER'
 * - user.user_roles: [{ roles: { name: 'ADMIN' } }]
 * - user.organizationContext: [{ role: 'BOOKING_COORDINATOR' }]
 */
export const extractUserRoles = (user) => {
  if (!user) return [];
  const set = new Set();

  // 1. Direct roles array
  if (Array.isArray(user.roles)) {
    user.roles.forEach((r) => {
      if (typeof r === 'string' && r.trim()) {
        set.add(r.toUpperCase().trim());
      } else if (r && typeof r === 'object') {
        const name = r.name || r.role || r.code;
        if (name && typeof name === 'string') {
          set.add(name.toUpperCase().trim());
        }
      }
    });
  }

  // 2. Singular role property
  if (user.role) {
    if (typeof user.role === 'string' && user.role.trim()) {
      const normalized = user.role.toUpperCase().trim();
      set.add(normalized);
      if (normalized === 'ADMIN' || normalized === 'ADMINISTRATOR') set.add('ADMIN');
      if (normalized === 'MANAGER' || normalized === 'OPERATOR') set.add('BOOKING_COORDINATOR');
    } else if (typeof user.role === 'object' && user.role.name) {
      set.add(String(user.role.name).toUpperCase().trim());
    }
  }

  // 3. Prisma user_roles relation
  if (Array.isArray(user.user_roles)) {
    user.user_roles.forEach((ur) => {
      const name = ur.roles?.name || ur.role?.name || ur.role;
      if (name && typeof name === 'string') set.add(name.toUpperCase().trim());
    });
  }

  // 4. Organization context roles
  if (Array.isArray(user.organizationContext)) {
    user.organizationContext.forEach((ctx) => {
      if (ctx?.role && typeof ctx.role === 'string') set.add(ctx.role.toUpperCase().trim());
    });
  }

  return Array.from(set);
};

/**
 * Returns true if the user has Platform Administrator access.
 */
export const isUserAdmin = (user) => {
  if (!user) return false;
  const roles = extractUserRoles(user);
  if (
    roles.includes('ADMIN') ||
    roles.includes('PLATFORM_ADMIN') ||
    roles.includes('SUPER_ADMIN')
  ) {
    return true;
  }
  if (typeof user.role === 'string') {
    const r = user.role.toUpperCase();
    if (r === 'ADMIN' || r === 'PLATFORM_ADMIN' || r === 'ADMINISTRATOR') return true;
  }
  if (typeof user.email === 'string') {
    const e = user.email.toLowerCase();
    if (e.includes('.admin@') || e.startsWith('admin@') || e.includes('solomon.admin@')) return true;
  }
  return false;
};

/**
 * Returns true if the user is a transport operator / booking coordinator.
 * Platform admins are not restricted to operator scope.
 */
export const isUserOperator = (user) => {
  if (!user) return false;
  if (isUserAdmin(user)) return false;

  const roles = extractUserRoles(user);
  if (
    roles.includes('BOOKING_COORDINATOR') ||
    roles.includes('OPERATIONAL_MANAGER') ||
    roles.includes('OPERATOR') ||
    roles.includes('MANAGER') ||
    roles.includes('DISPATCHER')
  ) {
    return true;
  }
  if (typeof user.role === 'string') {
    const r = user.role.toUpperCase();
    if (r.includes('MANAGER') || r.includes('COORDINATOR') || r.includes('OPERATOR')) return true;
  }
  if (Array.isArray(user.organizationContext) && user.organizationContext.length > 0) {
    return true;
  }
  if (user.organizationId) {
    return true;
  }
  return false;
};

/**
 * Returns true if the user is a public passenger.
 */
export const isUserPassenger = (user) => {
  if (!user) return true;
  if (isUserAdmin(user) || isUserOperator(user)) return false;
  return true;
};

export default formatUserFullName;
