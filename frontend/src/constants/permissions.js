/**
 * Named permission identifiers — matches backend seed.js exactly.
 * Use these constants instead of raw strings.
 */
export const PERMISSIONS = {
  // Platform Admin
  MANAGE_USERS: 'MANAGE_USERS',
  MANAGE_ORGANIZATIONS: 'MANAGE_ORGANIZATIONS',
  VIEW_AUDIT_LOGS: 'VIEW_AUDIT_LOGS',

  // Operational Manager
  CREATE_TRIP: 'CREATE_TRIP',
  UPDATE_TRIP: 'UPDATE_TRIP',
  DELETE_TRIP: 'DELETE_TRIP',
  VIEW_TRIPS: 'VIEW_TRIPS',
  MANAGE_BUS: 'MANAGE_BUS',
  VIEW_BOOKINGS: 'VIEW_BOOKINGS',
  MANAGE_BOOKINGS: 'MANAGE_BOOKINGS',

  // Passenger
  BOOK_TICKET: 'BOOK_TICKET',
  CANCEL_TICKET: 'CANCEL_TICKET',
  VIEW_TICKETS: 'VIEW_TICKETS',

  // Ticket Verifier
  VERIFY_TICKET: 'VERIFY_TICKET',
};

export const PERMISSION_LIST = Object.values(PERMISSIONS);

export default PERMISSIONS;
