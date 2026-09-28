/**
 * Named permission identifiers — matches backend constants exactly.
 * Use these constants instead of raw strings.
 */
export const PERMISSIONS = {
  // User Management
  MANAGE_USERS: 'MANAGE_USERS',
  VIEW_USERS: 'VIEW_USERS',

  // Organization Management
  MANAGE_ORGANIZATIONS: 'MANAGE_ORGANIZATIONS',
  VIEW_ORGANIZATIONS: 'VIEW_ORGANIZATIONS',

  // RBAC Management
  MANAGE_ROLES: 'MANAGE_ROLES',
  VIEW_ROLES: 'VIEW_ROLES',
  VIEW_PERMISSIONS: 'VIEW_PERMISSIONS',

  // Security & Auditing
  VIEW_AUDIT_LOGS: 'VIEW_AUDIT_LOGS',

  // Trip Operations
  CREATE_TRIP: 'CREATE_TRIP',
  UPDATE_TRIP: 'UPDATE_TRIP',
  DELETE_TRIP: 'DELETE_TRIP',
  VIEW_TRIPS: 'VIEW_TRIPS',

  // Bus Operations
  MANAGE_BUS: 'MANAGE_BUS',
  VIEW_BUSES: 'VIEW_BUSES',

  // Booking & Ticketing
  VIEW_BOOKINGS: 'VIEW_BOOKINGS',
  MANAGE_BOOKINGS: 'MANAGE_BOOKINGS',
  BOOK_TICKET: 'BOOK_TICKET',
  CANCEL_TICKET: 'CANCEL_TICKET',
  VIEW_TICKETS: 'VIEW_TICKETS',
  VERIFY_TICKET: 'VERIFY_TICKET',
};

export const PERMISSION_LIST = Object.values(PERMISSIONS);

export default PERMISSIONS;
