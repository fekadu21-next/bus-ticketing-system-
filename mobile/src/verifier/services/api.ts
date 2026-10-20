import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import {
  MOCK_VERIFIER_USER,
  getMockActiveTrip,
  getMockRecentScans,
  getMockScanStats,
  verifyMockToken,
  type VerifierUser,
  type ActiveTripInfo,
  type VerificationResultData,
  type RecentScanRecord,
} from '@/data/mockVerifierData';

const API_PORT = 5000;
const API_PATH = '/api/v1';

function resolveApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');
  if (fromEnv) return fromEnv;

  if (Platform.OS === 'android' && !Device.isDevice) {
    return `http://10.0.2.2:${API_PORT}${API_PATH}`;
  }

  return `http://localhost:${API_PORT}${API_PATH}`;
}

interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
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
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(url, { ...options, headers, signal: controller.signal });
      clearTimeout(timer);

      const json = await res.json();
      if (!res.ok) {
        return { success: false, error: json.message || `Request failed (${res.status})` };
      }

      return {
        success: true,
        data: (json.data as T) ?? (json as T),
        message: json.message,
      };
    } catch {
      return { success: false, error: 'NETWORK_UNAVAILABLE' };
    }
  }

  async login(email: string, password: string): Promise<ApiResponse<{ user: VerifierUser; accessToken: string }>> {
    // 1. Try real backend
    const res = await this.request<{ user: VerifierUser; accessToken: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (res.success && res.data?.user) {
      return res;
    }

    // 2. Mock Fallback
    console.log('[TicketVerifier API] Using Mock Verifier login fallback');
    return {
      success: true,
      message: 'Signed in with Mock Verifier Mode',
      data: {
        accessToken: 'mock-verifier-jwt-' + Date.now(),
        user: {
          ...MOCK_VERIFIER_USER,
          email: email || MOCK_VERIFIER_USER.email,
        },
      },
    };
  }

  async logout(): Promise<ApiResponse> {
    await this.request('/auth/logout', { method: 'POST' });
    return { success: true };
  }

  async getActiveTrip(): Promise<ApiResponse<{ trip: ActiveTripInfo }>> {
    const res = await this.request<{ trip: ActiveTripInfo }>('/ticket-verifications/active-trip');
    if (res.success && res.data?.trip) {
      return res;
    }

    return {
      success: true,
      data: { trip: getMockActiveTrip() },
    };
  }

  async verifyTicket(qrToken: string, tripId?: string): Promise<ApiResponse<{ result: VerificationResultData }>> {
    const res = await this.request<{ result: VerificationResultData }>('/ticket-verifications/scan', {
      method: 'POST',
      body: JSON.stringify({ qrToken, tripId }),
    });

    if (res.success && res.data?.result) {
      return res;
    }

    // Process via mock verification engine
    const mockResult = verifyMockToken(qrToken, tripId);
    return {
      success: true,
      data: { result: mockResult },
    };
  }

  async getRecentScans(): Promise<ApiResponse<{ scans: RecentScanRecord[] }>> {
    const res = await this.request<{ scans: RecentScanRecord[] }>('/ticket-verifications/recent');
    if (res.success && res.data?.scans) {
      return res;
    }

    return {
      success: true,
      data: { scans: getMockRecentScans() },
    };
  }

  async getScanStats(): Promise<ApiResponse<{ total: number; valid: number; rejected: number }>> {
    const res = await this.request<{ total: number; valid: number; rejected: number }>('/ticket-verifications/stats');
    if (res.success && res.data) {
      return res;
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
