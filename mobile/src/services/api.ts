import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

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
  const roles = Array.isArray(user.roles) ? (user.roles as string[]) : [];

  return {
    id: String(user.id ?? ''),
    firstName,
    lastName,
    email: String(user.email ?? ''),
    phone: user.phone ? String(user.phone) : undefined,
    roles,
    avatarUrl: user.avatarUrl ? String(user.avatarUrl) : undefined,
    isEmailVerified: Boolean(user.isEmailVerified ?? user.emailVerified),
  };
}

function isNetworkFailure(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message === 'Network request failed' ||
    message.includes('timed out') ||
    message.includes('Failed to fetch') ||
    message.includes('Network Error')
  );
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 15000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(
        `Request timed out reaching ${url}. Keep the phone on the same Wi-Fi as your computer and start the backend on port ${API_PORT}.`
      );
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
            error: response.ok
              ? 'Invalid server response'
              : `Request failed (${response.status}). Check EXPO_PUBLIC_API_URL and that the API is on port ${API_PORT}.`,
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
      const message = error instanceof Error ? error.message : 'Network error';
      return {
        success: false,
        error: isNetworkFailure(error)
          ? `Cannot reach the API at ${baseUrl}. Use the same Wi-Fi as this computer, start the backend on port ${API_PORT}, then reload the app.`
          : message,
      };
    }
  }

  async login(email: string, password: string): Promise<ApiResponse<AuthResponse>> {
    const result = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (result.success && result.data?.user) {
      result.data.user = normalizeUser(result.data.user as AuthUser & Record<string, unknown>);
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
    }

    return result;
  }

  async logout(): Promise<ApiResponse> {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  async forgotPassword(email: string): Promise<ApiResponse> {
    return this.request('/auth/forgot-password', {
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

  async verifyEmail(token: string): Promise<ApiResponse> {
    return this.request('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  async resendVerification(email: string): Promise<ApiResponse> {
    return this.request('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async getMe(): Promise<ApiResponse<{ user: AuthUser }>> {
    const result = await this.request<{ user: AuthUser }>('/auth/me');
    if (result.success && result.data?.user) {
      result.data.user = normalizeUser(result.data.user as AuthUser & Record<string, unknown>);
    }
    return result;
  }

  async changePassword(
    currentPassword: string,
    newPassword: string,
    confirmPassword: string
  ): Promise<ApiResponse> {
    return this.request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
    });
  }
}

export const apiService = new ApiService();
export default apiService;
