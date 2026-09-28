import { useAuth } from '@/context/AuthContext';
import { ROLES } from '@/constants/roles';

/**
 * Returns a boolean indicating whether the current user has the given permission.
 * Platform admins always return true.
 *
 * @param {string} permission - A PERMISSIONS constant value
 * @returns {boolean}
 *
 * @example
 * const canManageUsers = usePermission(PERMISSIONS.MANAGE_USERS);
 */
const usePermission = (permission) => {
  const { user } = useAuth();
  if (!user) return false;
  if (user.roles?.includes(ROLES.PLATFORM_ADMIN)) return true;
  return Boolean(user.permissions?.includes(permission));
};

export default usePermission;
