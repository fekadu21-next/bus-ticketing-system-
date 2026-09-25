/**
 * Helper to format a safe user object with deduped roles and permissions
 */
export const formatSafeUser = (user) => {
  const userRoles = user.user_roles || [];
  const roles = userRoles.map((ur) => ur.roles?.name).filter(Boolean);
  const permissions = [
    ...new Set(
      userRoles.flatMap((ur) =>
        ur.roles?.role_permissions?.map((rp) => rp.permissions?.name).filter(Boolean) || []
      )
    ),
  ];

  const organizationContext = userRoles
    .filter((ur) => ur.organizations)
    .map((ur) => ({
      role: ur.roles?.name,
      organizationId: ur.organization_id,
      organizationName: ur.organizations?.name,
      organizationType: ur.organizations?.type,
    }));

  return {
    id: user.id,
    firstName: user.first_name,
    lastName: user.last_name,
    email: user.email,
    phone: user.phone,
    avatarUrl: user.avatar_url,
    isActive: user.is_active,
    emailVerified: user.email_verified,
    roles,
    permissions,
    organizationContext: organizationContext.length > 0 ? organizationContext : null,
  };
};