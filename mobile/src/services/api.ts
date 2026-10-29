import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import type {
  ActiveTripInfo,
  VerificationResultData,
  RecentScanRecord,
  VerificationStatus,
  PassengerTrip,
  SeatInfo,
  PassengerBooking,
} from '@/types';

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
  if (Platform.OS === 'web') {
    return `http://localhost:${API_PORT}${API_PATH}`;
  }

  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');
  if (fromEnv && isUsableFromThisDevice(fromEnv)) {
    return fromEnv;
  }

  const lanHost = getDevHost();
  if (lanHost) {
    return `http://${lanHost}:${API_PORT}${API_PATH}`;
  }

  const lanFromEnv = process.env.EXPO_PUBLIC_LAN_API_URL?.replace(/\/$/, '');
  if (lanFromEnv && Device.isDevice) {
    return lanFromEnv;
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

export interface DriverProblemReport {
  id: string;
  trip_id?: string;
  type: string;
  description: string;
  status: 'REPORTED' | 'IN_REVIEW' | 'RESOLVED' | 'DISMISSED';
  notes?: string;
  created_at: string;
  trips?: {
    id: string;
    routes?: { origin?: string; destination?: string };
    buses?: { plate_number?: string; model?: string };
  };
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
  problemReports?: DriverProblemReport[];
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

  // Organization context - backend sends 'orgContexts' array (from authenticate middleware)
  let orgName: string | undefined;
  let orgId: string | undefined;

  // Try backend format: orgContexts (from JWT middleware)
  const orgContexts = Array.isArray(user.orgContexts) ? user.orgContexts : [];
  // Also try legacy format: organizationContext
  const legacyContexts = Array.isArray(user.organizationContext) ? user.organizationContext : [];
  const contexts = orgContexts.length > 0 ? orgContexts : legacyContexts;

  if (contexts.length > 0) {
    // Prefer the context matching the user's primary staff role
    const staffCtx = (contexts as { role?: string; organizationName?: string; organizationId?: string; name?: string }[]).find(
      (c) => c.role === 'DRIVER' || c.role === 'TICKET_VERIFIER'
    ) || contexts[0] as { organizationName?: string; organizationId?: string; name?: string };
    orgName = staffCtx.organizationName || staffCtx.name;
    orgId = staffCtx.organizationId;
  }

  return {
    id: String(user.id ?? ''),
    firstName: firstName || '',
    lastName: lastName || '',
    email: String(user.email ?? ''),
    phone: user.phone ? String(user.phone) : undefined,
    roles: rawRoles,
    avatarUrl: user.avatarUrl ? String(user.avatarUrl) : undefined,
    isEmailVerified: Boolean(user.isEmailVerified ?? user.emailVerified ?? false),
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
    problemReports: Array.isArray(raw.problemReports)
      ? (raw.problemReports as DriverProblemReport[])
      : Array.isArray(raw.trip_problem_reports)
      ? (raw.trip_problem_reports as DriverProblemReport[])
      : undefined,
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
    const result = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim(), password }),
    });

    if (result.success && result.data?.user) {
      const normalized = normalizeUser(result.data.user as AuthUser & Record<string, unknown>);
      result.data.user = normalized;
      return result;
    }

    return result;
  }

  async register(data: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    password: string;
    confirmPassword: string;
  }): Promise<ApiResponse<{ user: AuthUser; accessToken?: string }>> {
    return this.request<{ user: AuthUser; accessToken?: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async changePassword(
    currentPassword: string,
    newPassword: string,
    confirmPassword?: string
  ): Promise<ApiResponse> {
    return this.request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword, confirmPassword: confirmPassword || newPassword }),
    });
  }

  async forgotPassword(email: string): Promise<ApiResponse> {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resendVerification(email: string): Promise<ApiResponse> {
    return this.request('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(
    token: string,
    newPassword: string,
    confirmPassword: string
  ): Promise<ApiResponse> {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword, confirmPassword }),
    });
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

    // Fallback by computing dashboard from real driver trips endpoint
    const tripsRes = await this.getDriverTrips();
    if (tripsRes.success && tripsRes.data) {
      const trips = tripsRes.data.trips || [];
      const active = trips.find((t) => t.status === 'IN_PROGRESS') || null;
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

    return {
      success: false,
      error: result.error || tripsRes.error || 'Failed to load driver dashboard',
    };
  }

  async getDriverTripById(tripId: string): Promise<ApiResponse<{ trip: DriverTrip }>> {
    let result = await this.request<{ trip: Record<string, unknown> }>(`/driver/trips/${encodeURIComponent(tripId)}`);
    if (!result.success) {
      result = await this.request<{ trip: Record<string, unknown> }>(`/drivers/me/trips/${encodeURIComponent(tripId)}`);
    }

    if (result.success && result.data) {
      const tripData = result.data.trip || (result.data as unknown as Record<string, unknown>);
      if (tripData && typeof tripData === 'object' && 'id' in tripData) {
        return {
          success: true,
          data: { trip: mapBackendTripToDriverTrip(tripData as Record<string, unknown>) },
        };
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

    return { success: false, error: result.error || 'Failed to start trip' };
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

    return { success: false, error: result.error || 'Failed to complete trip' };
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

  async getTripProblems(tripId: string): Promise<ApiResponse<{ reports: DriverProblemReport[] }>> {
    return this.request<{ reports: DriverProblemReport[] }>(`/driver/trips/${encodeURIComponent(tripId)}/problems`);
  }

  async getDriverProblems(): Promise<ApiResponse<{ reports: DriverProblemReport[] }>> {
    return this.request<{ reports: DriverProblemReport[] }>('/driver/problems');
  }

  async getDriverProfile(): Promise<ApiResponse<{ driver: unknown; user: unknown }>> {
    return this.request<{ driver: unknown; user: unknown }>('/driver/me');
  }

  // --- Ticket Verifier Methods ---
  async getActiveTrip(): Promise<ApiResponse<{ trip: ActiveTripInfo | null }>> {
    // 1. Fetch real verifier trips endpoint
    const res = await this.request<{ total?: number; page?: number; limit?: number; trips: Record<string, unknown>[] }>('/verifier/trips');
    if (res.success && res.data) {
      const tripsArr = res.data.trips || (Array.isArray(res.data) ? (res.data as unknown as Record<string, unknown>[]) : []);
      if (tripsArr.length > 0) {
        // Find active/in-progress trip, or scheduled/first
        const trip = tripsArr.find((t) => t.status === 'IN_TRANSIT' || t.status === 'IN_PROGRESS') ||
          tripsArr.find((t) => t.status === 'SCHEDULED' || t.status === 'PUBLISHED') ||
          tripsArr[0];

        const routes = (trip.route || trip.routes) as { origin?: string; destination?: string } | undefined;
        const buses = (trip.bus || trip.buses) as { plate_number?: string; plateNumber?: string; model?: string; capacity?: number } | undefined;
        const summary = trip.verificationSummary as { totalTickets?: number; verifiedTickets?: number; unverifiedTickets?: number } | undefined;
        const counts = trip._count as { seats?: number; tickets?: number; bookings?: number } | undefined;

        const origin = String(routes?.origin || trip.origin || 'Addis Ababa');
        const destination = String(routes?.destination || trip.destination || 'Regional Station');
        const totalSeats = Number(buses?.capacity || trip.capacity || trip.total_seats || 50);
        const verifiedCount = Number(summary?.verifiedTickets ?? counts?.tickets ?? trip.verified_count ?? 0);
        const remainingCount = Number(summary?.unverifiedTickets ?? Math.max(0, totalSeats - verifiedCount));

        const rawDep = trip.departureTime || trip.departure_time;
        const departureTime = rawDep
          ? new Date(String(rawDep)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : '06:00 AM';

        const rawStatus = String(trip.status || 'SCHEDULED');
        const status = rawStatus === 'IN_TRANSIT' ? 'IN_PROGRESS' : (rawStatus as ActiveTripInfo['status']);

        const activeTripInfo: ActiveTripInfo = {
          id: String(trip.id),
          origin,
          destination,
          route: `${origin} → ${destination}`,
          departureTime,
          busPlate: buses?.plate_number || buses?.plateNumber || String(trip.bus_plate || 'ET-3-BUS'),
          busModel: buses?.model || String(trip.bus_model || 'Standard Coach'),
          status: status || 'IN_PROGRESS',
          totalSeats,
          verifiedCount,
          remainingCount,
        };

        return { success: true, data: { trip: activeTripInfo } };
      }
      return { success: true, data: { trip: null } };
    }

    return { success: false, error: res.error || 'Failed to load active trip' };
  }

  async getVerifierTrips(): Promise<ApiResponse<{ trips: ActiveTripInfo[] }>> {
    const res = await this.request<{ total?: number; page?: number; limit?: number; trips: Record<string, unknown>[] }>('/verifier/trips');
    if (res.success && res.data) {
      const tripsArr = res.data.trips || (Array.isArray(res.data) ? (res.data as unknown as Record<string, unknown>[]) : []);
      const mapped = tripsArr.map((trip) => {
        const routes = (trip.route || trip.routes) as { origin?: string; destination?: string } | undefined;
        const buses = (trip.bus || trip.buses) as { plate_number?: string; plateNumber?: string; model?: string; capacity?: number } | undefined;
        const summary = trip.verificationSummary as { totalTickets?: number; verifiedTickets?: number; unverifiedTickets?: number } | undefined;
        const counts = trip._count as { seats?: number; tickets?: number; bookings?: number } | undefined;

        const origin = String(routes?.origin || trip.origin || 'Addis Ababa');
        const destination = String(routes?.destination || trip.destination || 'Station');
        const totalSeats = Number(buses?.capacity || trip.capacity || 50);
        const verifiedCount = Number(summary?.verifiedTickets ?? counts?.tickets ?? 0);
        const remainingCount = Number(summary?.unverifiedTickets ?? Math.max(0, totalSeats - verifiedCount));
        const rawDep = trip.departureTime || trip.departure_time;
        const departureTime = rawDep
          ? new Date(String(rawDep)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : '06:00 AM';
        const rawStatus = String(trip.status || 'SCHEDULED');
        const status = rawStatus === 'IN_TRANSIT' ? 'IN_PROGRESS' : (rawStatus as ActiveTripInfo['status']);

        return {
          id: String(trip.id),
          origin,
          destination,
          route: `${origin} → ${destination}`,
          departureTime,
          busPlate: buses?.plate_number || buses?.plateNumber || 'ETH-BUS',
          busModel: buses?.model || 'Standard Coach',
          status,
          totalSeats,
          verifiedCount,
          remainingCount,
        };
      });

      return { success: true, data: { trips: mapped } };
    }

    return { success: false, error: res.error || 'Failed to load trips' };
  }

  async getTripManifest(tripId: string): Promise<ApiResponse<{
    trip: Record<string, unknown>;
    passengerManifest: {
      ticketId: string;
      ticketNumber: string;
      seatNumber: number;
      status: string;
      passengerName: string;
      phone?: string;
      verifiedAt?: string;
    }[];
  }>> {
    return this.request(`/verifier/trips/${encodeURIComponent(tripId)}`);
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
        ticketNumber?: string;
        ticket_number?: string;
        seatNumber?: number | string;
        seat_number?: number | string;
        seat?: string;
        passenger?: { firstName?: string; lastName?: string; name?: string; first_name?: string; last_name?: string };
      };
      data?: {
        valid?: boolean;
        status?: VerificationStatus;
        message?: string;
        ticket?: Record<string, unknown>;
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

    const payload = res.data?.data || res.data;
    if (payload && (payload.status || typeof payload.valid === 'boolean')) {
      const status = (payload.status || (payload.valid ? 'VALID' : 'INVALID')) as VerificationStatus;
      const allowed = payload.valid ?? (status === 'VALID');
      const ticket = (payload.ticket || (res.data as Record<string, unknown>)?.ticket) as {
        id?: string;
        ticketNumber?: string;
        ticket_number?: string;
        seatNumber?: number | string;
        seat_number?: number | string;
        seat?: string;
        passenger?: { firstName?: string; lastName?: string; name?: string; first_name?: string; last_name?: string };
      } | undefined;

      const passenger = ticket?.passenger;
      const passengerName =
        passenger?.name ||
        [passenger?.firstName || passenger?.first_name, passenger?.lastName || passenger?.last_name]
          .filter(Boolean)
          .join(' ') ||
        'Passenger';

      const seatNumber = ticket?.seat ?? ticket?.seatNumber ?? ticket?.seat_number ?? 1;

      const verificationResult: VerificationResultData = {
        status,
        allowed,
        passengerName: passengerName || 'Passenger',
        ticketNumber: ticket?.ticketNumber || ticket?.ticket_number || qrToken,
        route: 'Verified Passenger Trip',
        seatNumber,
        verifiedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        message: payload.message || res.message || (allowed ? 'TICKET VALID — BOARDING ALLOWED' : 'BOARDING NOT ALLOWED'),
      };

      return {
        success: true,
        data: { result: verificationResult },
      };
    }

    return {
      success: false,
      error: res.error || 'Verification failed: invalid ticket or server error',
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
      data: { scans: [] },
    };
  }

  async getScanStats(): Promise<ApiResponse<{ total: number; valid: number; rejected: number }>> {
    const recent = await this.getRecentScans();
    const scans = recent.data?.scans || [];
    const valid = scans.filter((s) => s.status === 'VALID').length;
    const rejected = scans.length - valid;
    return {
      success: true,
      data: { total: scans.length, valid, rejected },
    };
  }

  // ================= PASSENGER API METHODS =================

  async searchPassengerTrips(params?: {
    origin?: string;
    destination?: string;
    date?: string;
    limit?: number;
    operatorId?: string;
  }): Promise<ApiResponse<{ trips: PassengerTrip[]; total?: number }>> {
    const queryParts: string[] = [];
    if (params?.origin && params.origin !== 'All' && params.origin !== 'All Cities') {
      queryParts.push(`origin=${encodeURIComponent(params.origin)}`);
    }
    if (params?.destination && params.destination !== 'All' && params.destination !== 'All Destinations') {
      queryParts.push(`destination=${encodeURIComponent(params.destination)}`);
    }
    if (params?.date && params.date !== 'today' && params.date !== 'tomorrow' && params.date !== 'weekend' && params.date !== 'all') {
      queryParts.push(`date=${encodeURIComponent(params.date)}`);
    } else if (params?.date === 'tomorrow') {
      const d = new Date(); d.setDate(d.getDate() + 1);
      queryParts.push(`date=${d.toISOString().split('T')[0]}`);
    } else if (params?.date === 'weekend') {
      const d = new Date();
      const day = d.getDay();
      const daysUntilSat = (6 - day + 7) % 7 || 7;
      d.setDate(d.getDate() + daysUntilSat);
      queryParts.push(`date=${d.toISOString().split('T')[0]}`);
    }
    if (params?.limit) queryParts.push(`limit=${params.limit}`);
    if (params?.operatorId) queryParts.push(`operatorId=${encodeURIComponent(params.operatorId)}`);
    const qs = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';

    const res = await this.request<{ trips: Record<string, unknown>[]; total?: number }>(`/passenger/trips${qs}`);
    if (res.success && res.data) {
      const rawTrips = res.data.trips || [];
      const mapped: PassengerTrip[] = rawTrips.map((raw) => {
        const routes = (raw.route || raw.routes) as { origin?: string; destination?: string; distance_km?: number; estimated_duration_hours?: number } | undefined;
        const buses = (raw.bus || raw.buses) as { plate_number?: string; plateNumber?: string; model?: string; capacity?: number } | undefined;
        const operator = (raw.operator || raw.organizations) as { id?: string; name?: string; type?: string } | undefined;
        const origin = String(routes?.origin || raw.origin || 'Addis Ababa');
        const destination = String(routes?.destination || raw.destination || 'Hawassa');
        const totalSeats = Number(buses?.capacity || raw.totalSeats || 50);
        const availableSeats = Number(raw.availableSeats ?? raw.availableSeatsCount ?? Math.max(0, totalSeats - Number(raw.bookedSeatsCount || 0)));
        const rawDep = raw.departureTime || raw.departure_time;
        const depDateObj = rawDep ? new Date(String(rawDep)) : new Date();
        const departureTime = rawDep
          ? depDateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
          : '02:01 AM';
        const rawArr = raw.arrivalTime || raw.arrival_time;
        const arrDateObj = rawArr ? new Date(String(rawArr)) : null;
        const arrivalTime = arrDateObj
          ? arrDateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
          : '03:01 AM';

        const durationHrs = routes?.estimated_duration_hours;
        const duration = durationHrs
          ? `${Math.floor(Number(durationHrs))}h ${Math.round((Number(durationHrs) % 1) * 60)}m`
          : raw.duration ? String(raw.duration) : '5h 30m';
        const departureDate = rawDep ? String(rawDep).split('T')[0] : new Date().toISOString().split('T')[0];

        // Period calculation
        const depHour = depDateObj.getHours();
        let period: 'morning' | 'afternoon' | 'evening' = 'morning';
        if (depHour >= 6 && depHour < 12) period = 'morning';
        else if (depHour >= 12 && depHour < 17) period = 'afternoon';
        else period = 'evening';

        const operatorName = operator?.name || String(raw.operatorName || 'Selam Bus Line');
        const opTypeStr = String(operator?.type || raw.orgType || '');
        const orgType =
          opTypeStr === 'ASSOCIATION' || operatorName.toLowerCase().includes('association') || operatorName.toLowerCase().includes('assoc')
            ? 'Transport Association'
            : 'Private Bus Company';

        const initials = operatorName
          .split(' ')
          .filter(Boolean)
          .slice(0, 2)
          .map((w) => w[0].toUpperCase())
          .join('') || 'SB';

        const fare = Number(raw.fare || raw.price || 850);

        return {
          id: String(raw.id),
          origin,
          destination,
          route: `${origin} → ${destination}`,
          departureTime,
          departureDate,
          arrivalTime,
          duration,
          operatorName,
          operatorId: operator?.id || String(raw.operatorId || ''),
          orgType,
          period,
          logoBg: '#0f766e',
          logoText: initials,
          badge: fare <= 1150 ? 'Best Price' : undefined,
          rating: 4.6,
          reviews: 94,
          busPlate: buses?.plate_number || buses?.plateNumber || String(raw.busPlate || 'ETH-5263'),
          busType: buses?.model || String(raw.busType || 'Standard Coach'),
          price: fare,
          availableSeats,
          totalSeats,
          status: String(raw.status || 'SCHEDULED'),
          terminal: String(raw.terminal || `${origin} Terminal`),
          amenities: ['AC', 'WiFi', 'Reclining Seats', 'TV'],
        };
      });

      return { success: true, data: { trips: mapped, total: res.data.total } };
    }

    return { success: false, error: res.error || 'Failed to load trips' };
  }

  // Get all active bus companies / operators (public endpoint)
  async getCompanies(): Promise<ApiResponse<{ companies: Array<{ id: string; name: string; type: string; tripCount?: number }> }>> {
    const res = await this.request<{ data: { organizations?: Record<string, unknown>[] }; organizations?: Record<string, unknown>[] }>('/organizations/public?isActive=true&limit=50');
    if (res.success && res.data) {
      const raw = res.data.data?.organizations || (res.data as unknown as { organizations?: Record<string, unknown>[] }).organizations || [];
      const companies = (raw as Record<string, unknown>[]).map((org) => {
        const opTypeStr = String(org.type || '');
        const type =
          opTypeStr === 'ASSOCIATION' || String(org.name || '').toLowerCase().includes('association') || String(org.name || '').toLowerCase().includes('assoc')
            ? 'Transport Association'
            : 'Private Bus Company';

        return {
          id: String(org.id),
          name: String(org.name || 'Unknown Operator'),
          type,
          tripCount: Number(org.tripCount || org._count || 0),
        };
      });
      return { success: true, data: { companies } };
    }

    return {
      success: true,
      data: { companies: [] },
    };
  }

  async getPassengerTripDetails(
    tripId: string
  ): Promise<ApiResponse<{ trip: PassengerTrip; seats: SeatInfo[] }>> {
    const res = await this.request<{ trip: Record<string, unknown>; seats?: Record<string, unknown>[] }>(
      `/passenger/trips/${encodeURIComponent(tripId)}`
    );

    if (res.success && res.data?.trip) {
      const raw = res.data.trip;
      const routes = (raw.route || raw.routes) as { origin?: string; destination?: string } | undefined;
      const buses = (raw.bus || raw.buses) as { plate_number?: string; plateNumber?: string; model?: string; capacity?: number } | undefined;
      const operator = (raw.operator || raw.organizations) as { name?: string } | undefined;
      const origin = String(routes?.origin || raw.origin || 'Addis Ababa');
      const destination = String(routes?.destination || raw.destination || 'Destination');
      const totalSeats = Number(buses?.capacity || raw.totalSeats || 50);
      const bookedCount = Number(raw.bookedSeatsCount || 0);

      const trip: PassengerTrip = {
        id: String(raw.id),
        origin,
        destination,
        route: `${origin} → ${destination}`,
        departureTime: raw.departureTime ? new Date(String(raw.departureTime)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '06:00 AM',
        departureDate: raw.departureTime ? String(raw.departureTime).split('T')[0] : new Date().toISOString().split('T')[0],
        arrivalTime: raw.arrivalTime ? new Date(String(raw.arrivalTime)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '02:30 PM',
        duration: raw.duration ? String(raw.duration) : '5h 30m',
        operatorName: operator?.name || String(raw.operatorName || 'Bus Line'),
        busPlate: buses?.plate_number || buses?.plateNumber || 'ETH-BUS',
        busType: buses?.model || 'Standard Coach',
        price: Number(raw.fare || raw.price || 850),
        availableSeats: Math.max(0, totalSeats - bookedCount),
        totalSeats,
        status: String(raw.status || 'SCHEDULED'),
        terminal: String(raw.terminal || `${origin} Main Terminal`),
        amenities: ['AC', 'WiFi', 'USB Charging', 'Reclining Seats'],
      };

      // Generate or map seats (1 to totalSeats)
      const bookedSet = new Set<number>();
      if (Array.isArray(res.data.seats)) {
        res.data.seats.forEach((s) => {
          if (s.is_booked || s.isBooked || s.status === 'BOOKED' || s.status === 'OCCUPIED') {
            bookedSet.add(Number(s.seat_number || s.seatNumber));
          }
        });
      }

      const seats: SeatInfo[] = Array.from({ length: totalSeats }, (_, i) => {
        const seatNum = i + 1;
        const isBooked = bookedSet.has(seatNum);
        return {
          id: `seat-${seatNum}`,
          seatNumber: seatNum,
          isBooked,
          status: isBooked ? 'OCCUPIED' : 'AVAILABLE',
          price: trip.price,
        };
      });

      return { success: true, data: { trip, seats } };
    }

    return {
      success: false,
      error: res.error || 'Failed to load trip details from server',
    };
  }

  // In-memory passenger bookings cache for responsive updates
  private localBookings: PassengerBooking[] = [];

  async createPassengerBooking(data: {
    tripId: string;
    seatNumber: number;
    passengerName?: string;
    phone?: string;
  }): Promise<ApiResponse<{ booking: PassengerBooking }>> {
    const res = await this.request<{ booking: Record<string, unknown> }>('/passenger/bookings', {
      method: 'POST',
      body: JSON.stringify({
        tripId: data.tripId,
        seatNumber: data.seatNumber,
      }),
    });

    if (res.success && res.data?.booking) {
      const b = res.data.booking;
      const t = (b.trips || b.trip) as Record<string, unknown> | undefined;
      const r = (t?.routes || t?.route) as { origin?: string; destination?: string } | undefined;
      const op = (t?.organizations || t?.operator) as { name?: string } | undefined;
      const tk = (Array.isArray(b.tickets) ? b.tickets[0] : b.ticket) as Record<string, unknown> | undefined;

      const origin = String(b.origin || b.from || r?.origin || 'Addis Ababa');
      const destination = String(b.destination || b.to || r?.destination || 'Destination');
      const departureTime = b.departureTime
        ? String(b.departureTime)
        : t?.departure_time
        ? new Date(String(t.departure_time)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : '06:00 AM';

      const createdBooking: PassengerBooking = {
        id: String(b.id),
        bookingNumber: String(b.bookingNumber || b.booking_number || `BKG-${String(b.id).slice(0, 6)}`),
        status: 'CONFIRMED',
        totalAmount: Number(b.totalFare || b.price || b.total_fare || b.total_amount || 0),
        createdAt: String(b.created_at || b.createdAt || new Date().toISOString()),
        passengerName: data.passengerName || String(b.passengerName || 'Passenger'),
        phone: data.phone || String(b.phone || ''),
        seatNumber: data.seatNumber,
        trip: {
          id: data.tripId,
          origin,
          destination,
          departureTime,
          departureDate: String(b.departureDate || b.date || new Date().toISOString().split('T')[0]),
          operatorName: op?.name || String(b.operatorName || b.operator || 'Selam Bus Line'),
          busPlate: String(b.busPlateNumber || b.busPlate || 'ETH-BUS'),
          busType: String(b.busModel || b.busType || 'Standard Coach'),
          terminal: `${origin} Main Terminal`,
        },
        ticket: {
          id: String(tk?.id || `tkt-${b.id}`),
          ticketNumber: String(tk?.ticket_number || tk?.ticketNumber || b.ticketNumber || `TKT-${String(b.id).slice(0, 8).toUpperCase()}`),
          status: 'ACTIVE',
          qrToken: String(tk?.qr_token || tk?.qrToken || tk?.id || `TKT-${b.id}`),
        },
      };

      // Prepend to local bookings so it shows immediately in list
      this.localBookings = [
        createdBooking,
        ...this.localBookings.filter((x) => x.id !== createdBooking.id),
      ];
      return { success: true, data: { booking: createdBooking } };
    }

    return { success: false, error: res.error || 'Failed to create booking on server' };
  }

  async initializePassengerPayment(data: {
    bookingId: string;
    amount: number;
    paymentMethod: string;
    phoneNumber?: string;
  }): Promise<ApiResponse<{ paymentUrl?: string; reference?: string; status: string }>> {
    const res = await this.request<{ paymentUrl?: string; reference?: string; status: string }>(
      '/passenger/payments/initialize',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );

    return res;
  }

  async getPassengerBookings(): Promise<ApiResponse<{ bookings: PassengerBooking[] }>> {
    const res = await this.request<{ bookings: Record<string, unknown>[] }>('/passenger/bookings');

    if (res.success && Array.isArray(res.data?.bookings)) {
      const mapped: PassengerBooking[] = res.data.bookings.map((b) => {
        const t = (b.trip || b.trips) as Record<string, unknown> | undefined;
        const r = (t?.route || t?.routes) as { origin?: string; destination?: string } | undefined;
        const op = (t?.operator || t?.organizations) as { name?: string } | undefined;
        const tk = (Array.isArray(b.tickets) ? b.tickets[0] : b.ticket) as Record<string, unknown> | undefined;

        const origin = String(b.origin || b.from || r?.origin || 'Addis Ababa');
        const destination = String(b.destination || b.to || r?.destination || 'Destination');
        const departureTime = b.departureTime
          ? String(b.departureTime)
          : t?.departure_time
          ? new Date(String(t.departure_time)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : '06:00 AM';

        const rawStat = String(b.rawStatus || b.status || '').toUpperCase();
        let status: PassengerBooking['status'] = 'CONFIRMED';
        if (rawStat === 'CANCELLED' || rawStat === 'CANCELED') {
          status = 'CANCELLED';
        } else if (rawStat === 'COMPLETED' || rawStat === 'TRAVELLED') {
          status = 'COMPLETED';
        } else if (rawStat === 'PENDING') {
          status = 'PENDING';
        } else {
          status = 'CONFIRMED';
        }

        const seatNum = Number(b.seatNumber || b.seat_number || (Array.isArray(b.seats) ? b.seats[0] : 1) || 1);

        return {
          id: String(b.id),
          bookingNumber: String(b.bookingNumber || b.booking_number || `BKG-${String(b.id).slice(0, 6)}`),
          status,
          totalAmount: Number(b.totalFare || b.price || b.amount || b.total_fare || b.total_amount || 0),
          createdAt: String(b.createdAt || b.bookingDate || b.created_at || new Date().toISOString()),
          passengerName: String(b.passengerName || 'Passenger'),
          phone: String(b.phone || b.passengerPhone || ''),
          seatNumber: seatNum,
          trip: {
            id: String(t?.id || b.tripId || ''),
            origin,
            destination,
            departureTime,
            departureDate: String(b.departureDate || b.date || (t?.departure_time ? String(t.departure_time).split('T')[0] : new Date().toISOString().split('T')[0])),
            operatorName: String(b.operatorName || b.operator || op?.name || 'Selam Bus Line'),
            busPlate: String(b.busPlateNumber || b.busPlate || t?.plate_number || 'ETH-BUS'),
            busType: String(b.busModel || b.busType || t?.busType || 'Standard Coach'),
            terminal: `${origin} Main Terminal`,
          },
          ticket: {
            id: String(tk?.id || b.ticketId || `tkt-${b.id}`),
            ticketNumber: String(tk?.ticket_number || tk?.ticketNumber || b.ticketNumber || `TKT-${String(b.id).slice(0, 8).toUpperCase()}`),
            status: String(tk?.status || (status === 'CONFIRMED' ? 'ACTIVE' : status)),
            qrToken: String(tk?.qr_token || tk?.qrToken || b.qrToken || `TKT-${b.id}-${seatNum}`),
          },
        };
      });

      this.localBookings = mapped;
      return { success: true, data: { bookings: mapped } };
    }

    if (res.error) {
      return { success: false, error: res.error };
    }

    return {
      success: true,
      data: { bookings: this.localBookings },
    };
  }

  async cancelPassengerBooking(bookingId: string): Promise<ApiResponse> {
    const res = await this.request(`/passenger/bookings/${encodeURIComponent(bookingId)}/cancel`, {
      method: 'POST',
    });

    if (res.success) {
      this.localBookings = this.localBookings.map((b) =>
        b.id === bookingId ? { ...b, status: 'CANCELLED' as const } : b
      );
      return res;
    }

    return res;
  }
}

export const apiService = new ApiService();
export default apiService;
export type {
  ActiveTripInfo,
  VerificationResultData,
  RecentScanRecord,
  VerificationStatus,
  PassengerTrip,
  SeatInfo,
  PassengerBooking,
};

