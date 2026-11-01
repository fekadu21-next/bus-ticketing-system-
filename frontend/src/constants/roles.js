/**
 * System role identifiers matching the backend DB & constants.
 */
export const ROLES = Object.freeze({
  ADMIN: 'ADMIN',
  BOOKING_COORDINATOR: 'BOOKING_COORDINATOR',
  OPERATIONAL_MANAGER: 'OPERATIONAL_MANAGER',
  PASSENGER: 'PASSENGER',
  TICKET_VERIFIER: 'TICKET_VERIFIER',
  DRIVER: 'DRIVER',

  // Backward compatibility & convenient aliases
  PLATFORM_ADMIN: 'ADMIN',
  OPERATOR: 'BOOKING_COORDINATOR',
  MANAGER: 'BOOKING_COORDINATOR',
  VERIFIER: 'TICKET_VERIFIER',
});

/** Ordered list for display purposes */
export const ROLE_LIST = [
  ROLES.ADMIN,
  ROLES.BOOKING_COORDINATOR,
  ROLES.OPERATIONAL_MANAGER,
  ROLES.DRIVER,
  ROLES.TICKET_VERIFIER,
  ROLES.PASSENGER,
];

export default ROLES;
