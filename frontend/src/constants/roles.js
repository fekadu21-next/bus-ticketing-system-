/**
 * System role identifiers matching the backend DB & constants.
 */
export const ROLES = {
  ADMIN: 'ADMIN',
  BOOKING_COORDINATOR: 'BOOKING_COORDINATOR',
  TICKET_VERIFIER: 'TICKET_VERIFIER',
  PASSENGER: 'PASSENGER',

  // Backward compatibility aliases if referenced
  PLATFORM_ADMIN: 'ADMIN',
  OPERATIONAL_MANAGER: 'BOOKING_COORDINATOR',
};

/** Ordered list for display purposes */
export const ROLE_LIST = [
  ROLES.ADMIN,
  ROLES.BOOKING_COORDINATOR,
  ROLES.TICKET_VERIFIER,
  ROLES.PASSENGER,
];

export default ROLES;
