/**
 * Shared type definitions for the Bus Ticketing Mobile App
 * These are real API types — not mock data
 */

export interface VerifierUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  roles: string[];
  organizationName?: string;
  organizationId?: string;
}

export interface ActiveTripInfo {
  id: string;
  origin: string;
  destination: string;
  route: string;
  departureTime: string;
  busPlate: string;
  busModel: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';
  totalSeats: number;
  verifiedCount: number;
  remainingCount: number;
}

export type VerificationStatus =
  | 'VALID'
  | 'ALREADY_USED'
  | 'INVALID'
  | 'CANCELLED'
  | 'WRONG_TRIP';

export interface VerificationResultData {
  status: VerificationStatus;
  allowed: boolean;
  passengerName?: string;
  ticketNumber?: string;
  route?: string;
  seatNumber?: number | string;
  verifiedAt: string;
  message: string;
  details?: string;
  previousVerificationTime?: string;
  ticketTrip?: string;
  currentTrip?: string;
}

export interface RecentScanRecord {
  id: string;
  ticketNumber: string;
  passengerName: string;
  seatNumber: number | string;
  status: VerificationStatus;
  scannedAt: string;
  route: string;
}

export interface PassengerTrip {
  id: string;
  origin: string;
  destination: string;
  route: string;
  departureTime: string;
  departureDate: string;
  arrivalTime?: string;
  duration?: string;
  operatorName: string;
  operatorId?: string;
  orgType?: string;
  period?: 'morning' | 'afternoon' | 'evening';
  rating?: number;
  reviews?: number;
  badge?: string;
  logoBg?: string;
  logoText?: string;
  busPlate: string;
  busType: string;
  price: number;
  availableSeats: number;
  totalSeats: number;
  status: string;
  terminal?: string;
  amenities?: string[];
}

export interface SeatInfo {
  id: string;
  seatNumber: number;
  isBooked: boolean;
  status: 'AVAILABLE' | 'OCCUPIED' | 'SELECTED';
  price?: number;
}

export interface PassengerBooking {
  id: string;
  bookingNumber?: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  totalAmount: number;
  createdAt: string;
  passengerName?: string;
  phone?: string;
  seatNumber: number;
  trip: {
    id: string;
    origin: string;
    destination: string;
    departureTime: string;
    departureDate?: string;
    arrivalTime?: string;
    operatorName: string;
    busPlate?: string;
    busType?: string;
    terminal?: string;
  };
  ticket?: {
    id: string;
    ticketNumber: string;
    status: string;
    qrToken?: string;
  };
}

export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  roles: string[];
  avatarUrl?: string;
  isEmailVerified: boolean;
  organizationName?: string;
  organizationId?: string;
}

export interface DriverTrip {
  id: string;
  origin: string;
  destination: string;
  route: string;
  distanceKm?: number;
  estimatedDurationHours?: number;
  departureTime: string;
  arrivalTime?: string;
  status: 'SCHEDULED' | 'PUBLISHED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  fare: number;
  bus: {
    id?: string;
    plateNumber: string;
    model?: string;
    capacity?: number;
  };
  totalSeats?: number;
  bookedSeats?: number;
  availableSeats?: number;
  seatsCount?: number;
  bookingsCount?: number;
}
