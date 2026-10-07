export interface VerifierUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  roles: string[];
  organizationName?: string;
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

export const MOCK_VERIFIER_USER: VerifierUser = {
  id: 'verifier-samuel-001',
  firstName: 'Samuel',
  lastName: 'Tesfaye',
  email: 'verifier@example.com',
  phone: '+251 922 889 900',
  roles: ['TICKET_VERIFIER'],
  organizationName: 'Ethio Bus Express - Terminal 1',
};

export const MOCK_ACTIVE_TRIP: ActiveTripInfo = {
  id: 'trip-active-001',
  origin: 'Addis Ababa',
  destination: 'Bahir Dar',
  route: 'Addis Ababa → Bahir Dar',
  departureTime: '06:00 AM',
  busPlate: 'ET-1234',
  busModel: 'Toyota Coaster Deluxe',
  status: 'IN_PROGRESS',
  totalSeats: 49,
  verifiedCount: 37,
  remainingCount: 12,
};

// Initial mock recent scans list
let recentScansStore: RecentScanRecord[] = [
  {
    id: 'scan-1',
    ticketNumber: 'TKT-000123',
    passengerName: 'Abebe Kebede',
    seatNumber: 12,
    status: 'VALID',
    scannedAt: '06:12 AM',
    route: 'Addis Ababa → Bahir Dar',
  },
  {
    id: 'scan-2',
    ticketNumber: 'TKT-000124',
    passengerName: 'Hana Ali',
    seatNumber: 14,
    status: 'VALID',
    scannedAt: '06:13 AM',
    route: 'Addis Ababa → Bahir Dar',
  },
  {
    id: 'scan-3',
    ticketNumber: 'TKT-000125',
    passengerName: 'Kaleb Worku',
    seatNumber: 18,
    status: 'ALREADY_USED',
    scannedAt: '06:14 AM',
    route: 'Addis Ababa → Bahir Dar',
  },
];

// In-memory stats
let scanStats = {
  total: 37,
  valid: 35,
  rejected: 2,
};

export const getMockScanStats = () => ({ ...scanStats });
export const getMockRecentScans = () => [...recentScansStore];
export const getMockActiveTrip = () => ({ ...MOCK_ACTIVE_TRIP });

/**
 * Mock verification engine evaluating QR tokens
 */
export const verifyMockToken = (qrToken: string, tripId?: string): VerificationResultData => {
  const token = (qrToken || '').trim().toUpperCase();
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

  scanStats.total += 1;

  // 1. ALREADY USED Case
  if (token.includes('USED') || token === 'TKT-000125' || token === 'TKT-USED-202') {
    scanStats.rejected += 1;
    const result: VerificationResultData = {
      status: 'ALREADY_USED',
      allowed: false,
      ticketNumber: token || 'TKT-000125',
      passengerName: 'Kaleb Worku',
      previousVerificationTime: '05:58 AM',
      verifiedAt: timeStr,
      message: 'TICKET ALREADY USED',
      details: 'This boarding pass was already scanned and checked in earlier.',
    };
    recentScansStore.unshift({
      id: 'scan-' + Date.now(),
      ticketNumber: result.ticketNumber!,
      passengerName: result.passengerName!,
      seatNumber: 18,
      status: 'ALREADY_USED',
      scannedAt: timeStr,
      route: MOCK_ACTIVE_TRIP.route,
    });
    return result;
  }

  // 2. CANCELLED Case
  if (token.includes('CANCEL') || token === 'TKT-CANCEL-303') {
    scanStats.rejected += 1;
    const result: VerificationResultData = {
      status: 'CANCELLED',
      allowed: false,
      ticketNumber: token || 'TKT-000999',
      passengerName: 'Dawit Bekele',
      verifiedAt: timeStr,
      message: 'TICKET CANCELLED',
      details: 'This booking was cancelled or refunded and is no longer valid.',
    };
    recentScansStore.unshift({
      id: 'scan-' + Date.now(),
      ticketNumber: result.ticketNumber!,
      passengerName: result.passengerName!,
      seatNumber: 22,
      status: 'CANCELLED',
      scannedAt: timeStr,
      route: MOCK_ACTIVE_TRIP.route,
    });
    return result;
  }

  // 3. WRONG TRIP Case
  if (token.includes('WRONG') || token === 'TKT-WRONG-404') {
    scanStats.rejected += 1;
    const result: VerificationResultData = {
      status: 'WRONG_TRIP',
      allowed: false,
      ticketNumber: token || 'TKT-000777',
      passengerName: 'Meron Haile',
      ticketTrip: 'Addis Ababa → Gondar',
      currentTrip: MOCK_ACTIVE_TRIP.route,
      verifiedAt: timeStr,
      message: 'WRONG TRIP',
      details: 'This passenger holds a ticket for Addis Ababa → Gondar.',
    };
    recentScansStore.unshift({
      id: 'scan-' + Date.now(),
      ticketNumber: result.ticketNumber!,
      passengerName: result.passengerName!,
      seatNumber: 9,
      status: 'WRONG_TRIP',
      scannedAt: timeStr,
      route: 'Addis Ababa → Gondar',
    });
    return result;
  }

  // 4. INVALID Case
  if (token.includes('INVALID') || token === 'BAD_TOKEN' || token.length < 4) {
    scanStats.rejected += 1;
    const result: VerificationResultData = {
      status: 'INVALID',
      allowed: false,
      ticketNumber: token || 'UNKNOWN',
      verifiedAt: timeStr,
      message: 'INVALID TICKET',
      details: 'QR signature could not be authenticated by the server.',
    };
    recentScansStore.unshift({
      id: 'scan-' + Date.now(),
      ticketNumber: token || 'INVALID',
      passengerName: 'Unknown Passenger',
      seatNumber: '-',
      status: 'INVALID',
      scannedAt: timeStr,
      route: MOCK_ACTIVE_TRIP.route,
    });
    return result;
  }

  // 5. VALID Case (Default for valid tokens)
  scanStats.valid += 1;
  MOCK_ACTIVE_TRIP.verifiedCount += 1;
  MOCK_ACTIVE_TRIP.remainingCount = Math.max(0, MOCK_ACTIVE_TRIP.totalSeats - MOCK_ACTIVE_TRIP.verifiedCount);

  const seatNum = Math.floor(Math.random() * 40) + 1;
  const result: VerificationResultData = {
    status: 'VALID',
    allowed: true,
    passengerName: token.includes('HANA') ? 'Hana Ali' : 'Abebe Kebede',
    ticketNumber: token.startsWith('TKT-') ? token : `TKT-${Math.floor(100000 + Math.random() * 900000)}`,
    route: MOCK_ACTIVE_TRIP.route,
    seatNumber: seatNum,
    verifiedAt: timeStr,
    message: 'TICKET VALID — BOARDING ALLOWED',
    details: 'Passenger is verified and cleared for boarding.',
  };

  recentScansStore.unshift({
    id: 'scan-' + Date.now(),
    ticketNumber: result.ticketNumber!,
    passengerName: result.passengerName!,
    seatNumber: seatNum,
    status: 'VALID',
    scannedAt: timeStr,
    route: MOCK_ACTIVE_TRIP.route,
  });

  return result;
};
