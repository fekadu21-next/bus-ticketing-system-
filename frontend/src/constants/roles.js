/**
 * System role identifiers.
 * Use these constants instead of raw strings to avoid typos.
 */
export const ROLES = {
  PLATFORM_ADMIN: 'PLATFORM_ADMIN',
  OPERATIONAL_MANAGER: 'OPERATIONAL_MANAGER',
  TICKET_VERIFIER: 'TICKET_VERIFIER',
  PASSENGER: 'PASSENGER',
};

/** Ordered list for display purposes */
export const ROLE_LIST = Object.values(ROLES);

export default ROLES;
