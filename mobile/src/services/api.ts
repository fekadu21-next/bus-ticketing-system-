import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import {
  MOCK_DRIVER_USER,
  getMockTrips,
  getMockTripById,
  startMockTrip,
  completeMockTrip,
} from '@/data/mockDriverData';
import {
  MOCK_VERIFIER_USER,
  getMockActiveTrip,
  getMockRecentScans,
  getMockScanStats,
  verifyMockToken,
  type ActiveTripInfo,
  type VerificationResultData,
  type RecentScanRecord,
  type VerificationStatus,
} from '@/data/mockVerifierData';

const API_PORT = 5000;
const API_PATH = '/api/v1';
const TUNNEL_HOST_HINTS = ['exp.host', 'exp.direct', 'expo.dev', 'ngrok', 'tunnel'];

function stripPort(host: string): string {
  if (host.startsWith('[')) {
    return host.slice(1, host.indexOf(']')) || host;
  }
  return host.split(':')[0] ?? host;
}

function extractHost(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const value = raw.replace(/^[a-z]+:\/\//i, '').split('/')[0] ?? '';
  const host = stripPort(value).trim();
  if (!host) return null;
  const lower = host.toLowerCase();
  if (TUNNEL_HOST_HINTS.some((hint) => lower.includes(hint))) {
    return null;
  }
  return host;
}

function getDevHost(): string | null {
  const expoGo = Constants.expoGoConfig as { debuggerHost?: string } | null;
  const manifest = Constants.manifest2 as
    | { extra?: { expoGo?: { debuggerHost?: string } } }
    | null;

  const candidates = [
    Constants.expoConfig?.hostUri,
    expoGo?.debuggerHost,
    manifest?.extra?.expoGo?.debuggerHost,
    Constants.linkingUri,
    Constants.experienceUrl,
  ];

  for (const raw of candidates) {
    const host = extractHost(raw);
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return host;
    }
  }
  return null;
}

function isUsableFromThisDevice(url: string): boolean {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname;
    if (Platform.OS === 'web') return true;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') return true;
    if (Platform.OS === 'android') return !Device.isDevice;
    return false;
  } catch {
    return false;
  }
}

export function resolveApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');
  if (fromEnv && isUsableFromThisDevice(fromEnv)) {
    return fromEnv;
  }

  const lanHost = getDevHost();
  if (lanHost) {
    return `http://${lanHost}:${API_PORT}${API_PATH}`;
  }

  if (Platform.OS === 'android' && !Device.isDevice) {
    return `http://10.0.2.2:${API_PORT}${API_PATH}`;
  }

  return `http://localhost:${API_PORT}${API_PATH}`;
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

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: { message: string }[];
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

export function normalizeUser(user: Partial<AuthUser> & Record<string, unknown>): AuthUser {
  const firstName = String(user.firstName ?? user.first_name ?? '');
  const lastName = String(user.lastName ?? user.last_name ?? '');
  const rawRoles = Array.isArray(user.roles) ? (user.roles as string[]) : [];

  const roles = rawRoles.length > 0 ? rawRoles : ['DRIVER'];

  // Organization context - backend sends 'orgContexts' array (from authenticate middleware)
  let orgName: string | undefined;
  let orgId: string | undefined;

  // Try backend format: orgContexts (from JWT middleware)
  const orgContexts = Array.isArray(user.orgContexts) ? user.orgContexts : [];
  // Also try legacy format: organizationContext
  const legacyContexts = Array.isArray(user.organizationContext) ? user.organizationContext : [];
  const contexts = orgContexts.length > 0 ? orgContexts : legacyContexts;

  if (contexts.length > 0) {
    const ctx = contexts[0] as { organizationName?: string; organizationId?: string; name?: string };
    orgName = ctx.organizationName || ctx.name;
    orgId = ctx.organizationId;
  }

  return {
    id: String(user.id ?? 'user-staff-id'),
    firstName: firstName || 'Staff',
    lastName: lastName || 'User',
    email: String(user.email ?? 'staff@busticket.com'),
    phone: user.phone ? String(user.phone) : undefined,
    roles,
    avatarUrl: user.avatarUrl ? String(user.avatarUrl) : undefined,
    isEmailVerified: Boolean(user.isEmailVerified ?? user.emailVerified ?? true),
    organizationName: orgName || (user.organizationName ? String(user.organizationName) : undefined),
    organizationId: orgId || (user.organizationId ? String(user.organizationId) : undefined),
  };
}

function isNetworkFailure(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message === 'Network request failed' ||
    message.includes('timed out') ||
    message.includes('Failed to fetch') ||
    message.includes('Network Error') ||
    message.includes('Cannot reach the API')
  );
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 5000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timed out reaching ${url}`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

function mapBackendTripToDriverTrip(raw: Record<string, unknown>): DriverTrip {
  const routes = (raw.routes || raw.route) as Record<string, unknown> | undefined;
  const buses = (raw.buses || raw.bus) as Record<string, unknown> | undefined;
  const counts = raw._count as { seats?: number; bookings?: number } | undefined;

  const origin = String(routes?.origin || raw.origin || 'Addis Ababa');
  const destination = String(routes?.destination || raw.destination || 'Destination');
  const departureTime = String(raw.departure_time || raw.departureTime || new Date().toISOString());
  const arrivalTime = raw.arrival_time || raw.arrivalTime ? String(raw.arrival_time || raw.arrivalTime) : undefined;

  let status = String(raw.status || 'SCHEDULED') as DriverTrip['status'];
  if (status === ('IN_TRANSIT' as string)) {
    status = 'IN_PROGRESS';
  } else if (status === ('DRAFT' as string)) {
    status = 'SCHEDULED';
  }

  const fare = Number(raw.fare || 0);
  const plateNumber = String(buses?.plate_number || buses?.plateNumber || (raw.bus as { plateNumber?: string })?.plateNumber || 'ETH-BUS');
  const model = String(buses?.model || (raw.bus as { model?: string })?.model || 'Standard Coach');
  const capacity = Number(buses?.capacity || (raw.bus as { capacity?: number })?.capacity || 50);

  const bookedSeats = counts?.bookings ?? Number(raw.totalBookings || raw.bookedSeats || 0);
  const totalSeats = Number(raw.totalSeats || capacity);
  const availableSeats = Math.max(0, totalSeats - bookedSeats);

  return {
    id: String(raw.id),
    origin,
    destination,
    route: `${origin} → ${destination}`,
    distanceKm: routes?.distance_km ? Number(routes.distance_km) : undefined,
    estimatedDurationHours: routes?.estimated_duration_hours ? Number(routes.estimated_duration_hours) : undefined,
    departureTime,
    arrivalTime,
    status,
    fare,
    bus: {
      id: buses?.id ? String(buses.id) : undefined,
      plateNumber,
      model,
      capacity,
    },
    totalSeats,
    bookedSeats,
    availableSeats,
    seatsCount: counts?.seats,
    bookingsCount: bookedSeats,
  };
}

class ApiService {
  private token: string | null = null;

  setToken(token: string | null): void {
    this.token = token;
  }

  getToken(): string | null {
    return this.token;
  }

  getBaseUrl(): string {
    return resolveApiBaseUrl();
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const baseUrl = this.getBaseUrl();
    const url = `${baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string> | undefined) ?? {}),
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetchWithTimeout(url, {
        ...options,
        headers,
      });

      const text = await response.text();
      let body: Record<string, unknown> = {};
      if (text) {
        try {
          body = JSON.parse(text) as Record<string, unknown>;
        } catch {
          return {
            success: false,
            error: `Invalid server response (${response.status})`,
          };
        }
      }

      const nested = (body.data as T | undefined) ?? (body as T);
      const message = typeof body.message === 'string' ? body.message : undefined;
      const errors = body.errors as { message: string }[] | undefined;

      if (!response.ok) {
        return {
          success: false,
          error: message || `Request failed (${response.status})`,
          errors,
        };
      }

      return {
        success: true,
        data: nested,
        message,
      };
    } catch (error) {
      return {
        success: false,
        error: isNetworkFailure(error) ? 'NETWORK_UNAVAILABLE' : String(error),
      };
    }
  }

  // --- Authentication ---
  async login(email: string, password: string): Promise<ApiResponse<AuthResponse>> {
    // 1. Authenticate with central backend API
    const result = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim(), password }),
    });

    if (result.success && result.data?.user) {
      const normalized = normalizeUser(result.data.user as AuthUser & Record<string, unknown>);

      // Enforce Staff RBAC: Reject non-staff users (e.g. general passengers)
      const isDriver = normalized.roles.includes('DRIVER');
      const isVerifier = normalized.roles.includes('TICKET_VERIFIER');
      const isAdmin = normalized.roles.includes('ADMIN');

      if (!isDriver && !isVerifier && !isAdmin) {
        return {
          success: false,
          error: 'Access denied: This operational mobile application is restricted to Drivers and Ticket Verifiers only.',
        };
      }

      result.data.user = normalized;
      return result;
    }

    // 2. Offline / Mock Fallback ONLY if backend is truly unreachable (network error)
    if (result.error === 'NETWORK_UNAVAILABLE') {
      const isVerifierCred = email.toLowerCase().includes('verifier');
      if (isVerifierCred) {
        console.log('[ApiService] Backend unreachable — using Mock Verifier for:', email);
        const mockUser: AuthUser = {
          id: MOCK_VERIFIER_USER.id,
          firstName: MOCK_VERIFIER_USER.firstName,
          lastName: MOCK_VERIFIER_USER.lastName,
          email: email || MOCK_VERIFIER_USER.email,
          phone: MOCK_VERIFIER_USER.phone,
          roles: ['TICKET_VERIFIER'],
          isEmailVerified: true,
          organizationName: MOCK_VERIFIER_USER.organizationName,
        };
        return {
          success: true,
          message: 'Signed in with Mock Verifier Mode (Backend Offline)',
          data: {
            accessToken: 'mock-verifier-token-' + Date.now(),
            user: mockUser,
          },
        };
      } else {
        console.log('[ApiService] Backend unreachable — using Mock Driver for:', email);
        const mockUser: AuthUser = {
          ...MOCK_DRIVER_USER,
          email: email || MOCK_DRIVER_USER.email,
          roles: ['DRIVER'],
        };
        return {
          success: true,
          message: 'Signed in with Mock Driver Mode (Backend Offline)',
          data: {
            accessToken: 'mock-driver-token-' + Date.now(),
            user: mockUser,
          },
        };
      }
    }

    // 3. Auth failure (wrong credentials, account inactive, etc.) — return actual error
    return result;
  }

  async logout(): Promise<ApiResponse> {
    await this.request('/auth/logout', { method: 'POST' });
    this.token = null;
    return { success: true };
  }

  async getMe(): Promise<ApiResponse<{ user: AuthUser }>> {
    const result = await this.request<{ user: AuthUser }>('/auth/me');
    if (result.success && result.data?.user) {
      result.data.user = normalizeUser(result.data.user as AuthUser & Record<string, unknown>);
      return result;
    }
    return result;
  }

  // --- Driver Trip Methods ---
  async getDriverTrips(status?: string): Promise<ApiResponse<{ trips: DriverTrip[] }>> {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    // Backend returns { total, page, limit, trips } wrapped in data
    let result = await this.request<{ total?: number; page?: number; limit?: number; trips: Record<string, unknown>[] }>(`/driver/trips${query}`);
    if (!result.success) {
      result = await this.request<{ total?: number; page?: number; limit?: number; trips: Record<string, unknown>[] }>(`/drivers/me/trips${query}`);
    }

    if (result.success && result.data) {
      // Backend wraps trips in { total, page, limit, trips } object
      const tripsArray = result.data.trips || (Array.isArray(result.data) ? (result.data as unknown as Record<string, unknown>[]) : []);
      const mappedTrips = tripsArray.map(mapBackendTripToDriverTrip);
      return {
        success: true,
        data: { trips: mappedTrips },
      };
    }

    // Mock fallback ONLY if backend is unreachable
    if (result.error === 'NETWORK_UNAVAILABLE') {
      return { success: true, data: { trips: getMockTrips(status) } };
    }

    return {
      success: false,
      error: result.error || 'Failed to load trips from server',
    };
  }

  async getDriverDashboard(): Promise<ApiResponse<{
    driver: unknown;
    activeTrip?: DriverTrip | null;
    todayTrips: DriverTrip[];
    upcomingTrips: DriverTrip[];
    stats: { totalAssigned: number; completed: number; inProgress: number };
  }>> {
    const result = await this.request<{
      driver: unknown;
      activeTrip?: Record<string, unknown> | null;
      todayTrips?: Record<string, unknown>[];
      upcomingTrips?: Record<string, unknown>[];
      stats?: { totalAssigned: number; completed: number; inProgress: number };
    }>('/driver/dashboard');

    if (result.success && result.data) {
      // Backend stats uses { completedTrips, totalAssignedTrips } — normalize to mobile format
      const rawStats = result.data.stats as Record<string, unknown> | undefined;
      const normalizedStats = {
        totalAssigned: Number(rawStats?.totalAssignedTrips ?? rawStats?.totalAssigned ?? 0),
        completed: Number(rawStats?.completedTrips ?? rawStats?.completed ?? 0),
        inProgress: Number(rawStats?.inProgress ?? 0),
      };

      return {
        success: true,
        data: {
          driver: result.data.driver,
          activeTrip: result.data.activeTrip ? mapBackendTripToDriverTrip(result.data.activeTrip as Record<string, unknown>) : null,
          todayTrips: (result.data.todayTrips || []).map(mapBackendTripToDriverTrip),
          upcomingTrips: (result.data.upcomingTrips || []).map(mapBackendTripToDriverTrip),
          stats: normalizedStats,
        },
      };
    }

    // Fallback from getDriverTrips (network available but dashboard endpoint fails)
    const tripsRes = await this.getDriverTrips();
    const trips = tripsRes.data?.trips || [];
    const active = trips.find((t) => t.status === 'IN_PROGRESS') || trips[0] || null;
    return {
      success: true,
      data: {
        driver: null,
        activeTrip: active,
        todayTrips: trips,
        upcomingTrips: trips.filter((t) => t.status === 'SCHEDULED' || t.status === 'PUBLISHED'),
        stats: {
          totalAssigned: trips.length,
          completed: trips.filter((t) => t.status === 'COMPLETED').length,
          inProgress: trips.filter((t) => t.status === 'IN_PROGRESS').length,
        },
      },
    };
  }

  async getDriverTripById(tripId: string): Promise<ApiResponse<{ trip: DriverTrip }>> {
    let result = await this.request<{ trip: Record<string, unknown> }>(`/driver/trips/${encodeURIComponent(tripId)}`);
    if (!result.success) {
      result = await this.request<{ trip: Record<string, unknown> }>(`/drivers/me/trips/${encodeURIComponent(tripId)}`);
    }

    if (result.success && result.data) {
      // Backend may return { trip: {...} } or the trip object directly
      const tripData = result.data.trip || (result.data as unknown as Record<string, unknown>);
      if (tripData && typeof tripData === 'object' && 'id' in tripData) {
        return {
          success: true,
          data: { trip: mapBackendTripToDriverTrip(tripData as Record<string, unknown>) },
        };
      }
    }

    // Mock fallback only if network unavailable
    if (result.error === 'NETWORK_UNAVAILABLE') {
      const mockTrip = getMockTripById(tripId) || getMockTrips()[0];
      if (mockTrip) {
        return { success: true, data: { trip: mockTrip } };
      }
    }

    return { success: false, error: result.error || 'Trip not found' };
  }

  async startTrip(tripId: string): Promise<ApiResponse<{ trip: DriverTrip }>> {
    const result = await this.request<{ trip: Record<string, unknown> }>(
      `/driver/trips/${encodeURIComponent(tripId)}/start`,
      { method: 'POST' }
    );

    if (result.success && result.data) {
      const tripData = result.data.trip || (result.data as unknown as Record<string, unknown>);
      if (tripData && typeof tripData === 'object' && 'id' in tripData) {
        return {
          success: true,
          message: result.message || 'Trip started successfully.',
          data: { trip: mapBackendTripToDriverTrip(tripData as Record<string, unknown>) },
        };
      }
    }

    // Real error from backend (not network)
    if (result.error && result.error !== 'NETWORK_UNAVAILABLE') {
      return { success: false, error: result.error };
    }

    // Mock fallback only if offline
    try {
      const updated = startMockTrip(tripId);
      return { success: true, message: 'Trip started (Mock Mode)', data: { trip: updated } };
    } catch {
      return { success: false, error: 'Failed to start trip' };
    }
  }

  async completeTrip(tripId: string): Promise<ApiResponse<{ trip: DriverTrip }>> {
    const result = await this.request<{ trip: Record<string, unknown> }>(
      `/driver/trips/${encodeURIComponent(tripId)}/complete`,
      { method: 'POST' }
    );

    if (result.success && result.data) {
      const tripData = result.data.trip || (result.data as unknown as Record<string, unknown>);
      if (tripData && typeof tripData === 'object' && 'id' in tripData) {
        return {
          success: true,
          message: result.message || 'Trip completed successfully.',
          data: { trip: mapBackendTripToDriverTrip(tripData as Record<string, unknown>) },
        };
      }
    }

    // Real error from backend
    if (result.error && result.error !== 'NETWORK_UNAVAILABLE') {
      return { success: false, error: result.error };
    }

    // Mock fallback only if offline
    try {
      const updated = completeMockTrip(tripId);
      return { success: true, message: 'Trip completed (Mock Mode)', data: { trip: updated } };
    } catch {
      return { success: false, error: 'Failed to complete trip' };
    }
  }

  async reportProblem(
    tripId: string,
    data: { type: string; description: string }
  ): Promise<ApiResponse> {
    return this.request(`/driver/trips/${encodeURIComponent(tripId)}/problems`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // --- Ticket Verifier Methods ---
  async getActiveTrip(): Promise<ApiResponse<{ trip: ActiveTripInfo }>> {
    // 1. Try real verifier trips endpoint
    // Backend returns { total, page, limit, trips } wrapped in data
    const res = await this.request<{ total?: number; page?: number; limit?: number; trips: Record<string, unknown>[] }>('/verifier/trips');
    if (res.success && res.data) {
      const tripsArr = res.data.trips || [];
      if (tripsArr.length > 0) {
        // Find the active/in-progress trip, otherwise use first
        const trip = tripsArr.find((t) => t.status === 'IN_TRANSIT' || t.status === 'IN_PROGRESS') || tripsArr[0];
        const routes = trip.routes as { origin?: string; destination?: string } | undefined;
        const buses = trip.buses as { plate_number?: string; model?: string; capacity?: number } | undefined;
        const counts = trip._count as { seats?: number; tickets?: number; bookings?: number } | undefined;

        const origin = routes?.origin || String(trip.origin || 'Addis Ababa');
        const destination = routes?.destination || String(trip.destination || 'Regional Terminal');
        const totalSeats = Number(buses?.capacity || trip.total_seats || 50);
        const verifiedCount = Number(counts?.tickets || trip.verified_count || 0);

        const activeTripInfo: ActiveTripInfo = {
          id: String(trip.id),
          origin,
          destination,
          route: `${origin} → ${destination}`,
          departureTime: trip.departure_time ? new Date(String(trip.departure_time)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '06:00 AM',
          busPlate: buses?.plate_number || String(trip.bus_plate || 'ET-3-12345'),
          busModel: buses?.model || String(trip.bus_model || 'Scania Touring'),
          status: (trip.status as ActiveTripInfo['status']) || 'IN_PROGRESS',
          totalSeats,
          verifiedCount,
          remainingCount: Math.max(0, totalSeats - verifiedCount),
        };

        return { success: true, data: { trip: activeTripInfo } };
      }
    }

    // Fallback to mock active trip only if network unavailable
    if (res.error === 'NETWORK_UNAVAILABLE') {
      return { success: true, data: { trip: getMockActiveTrip() } };
    }

    // No trips assigned — return mock for empty state
    return { success: true, data: { trip: getMockActiveTrip() } };
  }

  async verifyTicket(
    qrToken: string,
    tripId?: string
  ): Promise<ApiResponse<{ result: VerificationResultData }>> {
    // If no tripId provided, resolve active trip id first
    let targetTripId = tripId;
    if (!targetTripId) {
      const activeRes = await this.getActiveTrip();
      targetTripId = activeRes.data?.trip?.id;
    }

    // 1. Try real backend verify endpoint
    let res = await this.request<{
      valid: boolean;
      status: VerificationStatus;
      message: string;
      ticket?: {
        id: string;
        ticketNumber: string;
        seatNumber: number | string;
        passenger?: { firstName?: string; lastName?: string };
      };
    }>('/verifier/tickets/verify', {
      method: 'POST',
      body: JSON.stringify({ qrToken, tripId: targetTripId }),
    });

    if (!res.success && res.error === 'NETWORK_UNAVAILABLE') {
      // Try alias endpoint
      res = await this.request('/ticket-verifications/scan', {
        method: 'POST',
        body: JSON.stringify({ qrToken, tripId: targetTripId }),
      });
    }

    if (res.data && (res.data.status || typeof res.data.valid === 'boolean')) {
      const status = (res.data.status || (res.data.valid ? 'VALID' : 'INVALID')) as VerificationStatus;
      const allowed = res.data.valid ?? (status === 'VALID');
      const ticket = res.data.ticket;
      const passenger = ticket?.passenger;
      const passengerName = passenger
        ? `${passenger.firstName || ''} ${passenger.lastName || ''}`.trim()
        : 'Abebe Kebede';

      const verificationResult: VerificationResultData = {
        status,
        allowed,
        passengerName: passengerName || 'Passenger',
        ticketNumber: ticket?.ticketNumber || qrToken,
        route: 'Addis Ababa → Destination',
        seatNumber: ticket?.seatNumber ?? 12,
        verifiedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        message: res.data.message || (allowed ? 'TICKET VALID — BOARDING ALLOWED' : 'BOARDING NOT ALLOWED'),
      };

      return {
        success: true,
        data: { result: verificationResult },
      };
    }

    // 2. Fallback to mock verification engine
    const mockResult = verifyMockToken(qrToken, targetTripId);
    return {
      success: true,
      data: { result: mockResult },
    };
  }

  async getRecentScans(): Promise<ApiResponse<{ scans: RecentScanRecord[] }>> {
    let res = await this.request<{
      verifications: {
        id: string;
        result: VerificationStatus;
        created_at: string;
        ticket?: {
          ticket_number: string;
          seat_number: number;
          passenger?: { first_name?: string; last_name?: string };
          trips?: { routes?: { origin?: string; destination?: string } };
        };
      }[];
    }>('/verifier/history');

    if (!res.success) {
      res = await this.request('/ticket-verifications/recent');
    }

    if (res.success && res.data?.verifications) {
      const mappedScans: RecentScanRecord[] = res.data.verifications.map((v) => {
        const passenger = v.ticket?.passenger;
        const passengerName = passenger
          ? `${passenger.first_name || ''} ${passenger.last_name || ''}`.trim()
          : 'Passenger';
        const routes = v.ticket?.trips?.routes;
        const route = routes ? `${routes.origin} → ${routes.destination}` : 'Addis Ababa → Destination';

        return {
          id: String(v.id),
          ticketNumber: v.ticket?.ticket_number || 'TKT-SCAN',
          passengerName: passengerName || 'Verified Passenger',
          seatNumber: v.ticket?.seat_number ?? 12,
          status: v.result,
          scannedAt: new Date(v.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          route,
        };
      });

      return {
        success: true,
        data: { scans: mappedScans },
      };
    }

    return {
      success: true,
      data: { scans: getMockRecentScans() },
    };
  }

  async getScanStats(): Promise<ApiResponse<{ total: number; valid: number; rejected: number }>> {
    const recent = await this.getRecentScans();
    const scans = recent.data?.scans || [];
    if (scans.length > 0) {
      const valid = scans.filter((s) => s.status === 'VALID').length;
      const rejected = scans.length - valid;
      return {
        success: true,
        data: { total: scans.length, valid, rejected },
      };
    }

    return {
      success: true,
      data: getMockScanStats(),
    };
  }
}

export const apiService = new ApiService();
export default apiService;
export * from '@/data/mockVerifierData';
export * from '@/data/mockDriverData';
