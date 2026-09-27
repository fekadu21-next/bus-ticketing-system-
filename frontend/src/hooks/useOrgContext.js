import { useAuth } from '@/context/AuthContext';

/**
 * Returns the first (primary) organization context for the current user.
 * Useful for operational managers and ticket verifiers.
 *
 * @returns {{ org: object|null, orgId: string|null, orgName: string|null, orgType: string|null, orgRole: string|null }}
 *
 * @example
 * const { orgName, orgId } = useOrgContext();
 */
const useOrgContext = () => {
  const { user } = useAuth();
  const contexts = user?.organizationContext || [];
  const org = contexts[0] || null;

  return {
    org,
    orgId: org?.organizationId || null,
    orgName: org?.organizationName || null,
    orgType: org?.organizationType || null,
    orgRole: org?.role || null,
    allOrgs: contexts,
    hasOrg: contexts.length > 0,
  };
};

export default useOrgContext;
