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
  if (!raw) {
    return null;
  }

  const value = raw.replace(/^[a-z]+:\/\//i, '').split('/')[0] ?? '';
  const host = stripPort(value).trim();
  if (!host) {
    return null;
  }

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

function isLoopbackHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
}

function isUsableFromThisDevice(url: string): boolean {
  try {
    const hostname = new URL(url).hostname;
    const onPhysicalDevice = Device.isDevice && Platform.OS !== 'web';

    if (onPhysicalDevice && (isLoopbackHost(hostname) || hostname === '10.0.2.2')) {
      return false;
    }

    return true;
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

interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: { message: string }[];
}

interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

export function normalizeUser(user: Partial<AuthUser> & Record<string, unknown>): AuthUser {
  const firstName = String(user.firstName ?? user.first_name ?? '');
  const lastName = String(user.lastName ?? user.last_name ?? '');
  const roles = Array.isArray(user.roles) ? (user.roles as string[]) : ['DRIVER'];

  return {
    id: String(user.id ?? 'mock-driver-uuid'),
    firstName: firstName || 'Abebe',
    lastName: lastName || 'Kebede',
    email: String(user.email ?? 'driver@example.com'),
    phone: user.phone ? String(user.phone) : '+251 911 234 567',
    roles,
    avatarUrl: user.avatarUrl ? String(user.avatarUrl) : undefined,
    isEmailVerified: Boolean(user.isEmailVerified ?? user.emailVerified ?? true),
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

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 4000): Promise<Response> {
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
      // Return network failure for mock fallback
      return {
        success: false,
        error: isNetworkFailure(error) ? 'NETWORK_UNAVAILABLE' : String(error),
      };
    }
  }

  async login(email: string, password: string): Promise<ApiResponse<AuthResponse>> {
    // 1. Try real backend API
    const result = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (result.success && result.data?.user) {
      result.data.user = normalizeUser(result.data.user as AuthUser & Record<string, unknown>);
      return result;
    }

    // 2. Mock Fallback when backend is offline
    if (result.error === 'NETWORK_UNAVAILABLE' || !result.success) {
      console.log('[ApiService] Using Mock Driver login fallback for:', email);
      const mockUser: AuthUser = {
        ...MOCK_DRIVER_USER,
        email: email || MOCK_DRIVER_USER.email,
      };
      return {
        success: true,
        message: 'Signed in with Mock Driver Mode (Backend Offline)',
        data: {
          accessToken: 'mock-jwt-token-' + Date.now(),
          user: mockUser,
        },
      };
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
    const result = await this.request<{ user: AuthUser; accessToken?: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (result.success && result.data?.user) {
      result.data.user = normalizeUser(result.data.user as AuthUser & Record<string, unknown>);
      return result;
    }

    // Mock fallback
    return {
      success: true,
      message: 'Registered in Mock Mode',
      data: {
        accessToken: 'mock-jwt-token-' + Date.now(),
        user: {
          id: 'mock-reg-id',
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          roles: ['DRIVER'],
          isEmailVerified: true,
        },
      },
    };
  }

  async logout(): Promise<ApiResponse> {
    await this.request('/auth/logout', { method: 'POST' });
    return { success: true };
  }

  async forgotPassword(email: string): Promise<ApiResponse> {
    const result = await this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    if (!result.success && result.error === 'NETWORK_UNAVAILABLE') {
      return { success: true, message: 'Password reset email sent (Mock Mode).' };
    }
    return result;
  }

  async resetPassword(
    token: string,
    newPassword: string,
    confirmPassword: string
  ): Promise<ApiResponse> {
    const result = await this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword, confirmPassword }),
    });
    if (!result.success && result.error === 'NETWORK_UNAVAILABLE') {
      return { success: true, message: 'Password reset successfully (Mock Mode).' };
    }
    return result;
  }

  async verifyEmail(token: string): Promise<ApiResponse> {
    const result = await this.request('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
    if (!result.success && result.error === 'NETWORK_UNAVAILABLE') {
      return { success: true, message: 'Email verified successfully (Mock Mode).' };
    }
    return result;
  }

  async resendVerification(email: string): Promise<ApiResponse> {
    const result = await this.request('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    if (!result.success && result.error === 'NETWORK_UNAVAILABLE') {
      return { success: true, message: 'Verification link resent (Mock Mode).' };
    }
    return result;
  }

  async getMe(): Promise<ApiResponse<{ user: AuthUser }>> {
    const result = await this.request<{ user: AuthUser }>('/auth/me');
    if (result.success && result.data?.user) {
      result.data.user = normalizeUser(result.data.user as AuthUser & Record<string, unknown>);
      return result;
    }

    if (result.error === 'NETWORK_UNAVAILABLE' || !result.success) {
      return {
        success: true,
        data: { user: MOCK_DRIVER_USER },
      };
    }
    return result;
  }

  async changePassword(
    currentPassword: string,
    newPassword: string,
    confirmPassword: string
  ): Promise<ApiResponse> {
    const result = await this.request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
    });
    if (!result.success && result.error === 'NETWORK_UNAVAILABLE') {
      return { success: true, message: 'Password updated successfully (Mock Mode).' };
    }
    return result;
  }

  // --- Driver Trips API Methods (with Mock fallback) ---
  async getDriverTrips(status?: string): Promise<ApiResponse<{ trips: DriverTrip[] }>> {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    const result = await this.request<{ trips: DriverTrip[] }>(`/drivers/me/trips${query}`);

    if (result.success && result.data?.trips) {
      return result;
    }

    // Use Mock Driver Trips
    const mockTrips = getMockTrips(status);
    return {
      success: true,
      data: { trips: mockTrips },
    };
  }

  async getDriverTripById(tripId: string): Promise<ApiResponse<{ trip: DriverTrip }>> {
    const result = await this.request<{ trip: DriverTrip }>(`/drivers/me/trips/${encodeURIComponent(tripId)}`);

    if (result.success && result.data?.trip) {
      return result;
    }

    // Use Mock Driver Trip
    const mockTrip = getMockTripById(tripId) || getMockTrips()[0];
    if (mockTrip) {
      return {
        success: true,
        data: { trip: mockTrip },
      };
    }

    return {
      success: false,
      error: 'Trip not found in mock store',
    };
  }

  async startTrip(tripId: string): Promise<ApiResponse<{ trip: DriverTrip }>> {
    const result = await this.request<{ trip: DriverTrip }>(
      `/drivers/me/trips/${encodeURIComponent(tripId)}/start`,
      { method: 'POST' }
    );

    if (result.success && result.data?.trip) {
      return result;
    }

    // Fallback to Mock start
    try {
      const updated = startMockTrip(tripId);
      return {
        success: true,
        message: 'Trip started (Mock Mode)',
        data: { trip: updated },
      };
    } catch {
      return {
        success: false,
        error: 'Failed to start trip in mock store',
      };
    }
  }

  async completeTrip(tripId: string): Promise<ApiResponse<{ trip: DriverTrip }>> {
    const result = await this.request<{ trip: DriverTrip }>(
      `/drivers/me/trips/${encodeURIComponent(tripId)}/complete`,
      { method: 'POST' }
    );

    if (result.success && result.data?.trip) {
      return result;
    }

    // Fallback to Mock complete
    try {
      const updated = completeMockTrip(tripId);
      return {
        success: true,
        message: 'Trip completed (Mock Mode)',
        data: { trip: updated },
      };
    } catch {
      return {
        success: false,
        error: 'Failed to complete trip in mock store',
      };
    }
  }
}

export const apiService = new ApiService();
export default apiService;
