/**
 * Design system tokens mirroring the web frontend (frontend/src/App.css & styles/theme.css)
 */

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#0f172a',
    background: '#f8fafc',
    backgroundElement: '#ffffff',
    backgroundSelected: '#eff6ff',
    textSecondary: '#64748b',
  },
  dark: {
    text: '#f8fafc',
    background: '#090e1a',
    backgroundElement: '#0f172a',
    backgroundSelected: '#1e293b',
    textSecondary: '#94a3b8',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Theme = {
  colors: {
    // Primary Brand (Matching Web CSS --primary: #2563eb)
    primary: '#2563eb',
    primaryHover: '#1d4ed8',
    primaryLight: '#eff6ff',
    primaryBorder: '#bfdbfe',
    primaryShadow: 'rgba(37, 99, 235, 0.15)',

    // Surfaces & Backgrounds
    bgMain: '#f8fafc',
    bgCard: '#ffffff',
    bgCardDark: '#0f172a',
    bgDark: '#090e1a',
    bgSurfaceHover: '#f1f5f9',

    // Borders & Dividers
    border: '#e2e8f0',
    borderLight: '#f1f5f9',
    borderDark: '#cbd5e1',
    borderFocus: '#3b82f6',

    // Typography
    textMain: '#0f172a',
    textMuted: '#64748b',
    textSubtle: '#94a3b8',
    textWhite: '#ffffff',

    // Status Feedback
    success: '#059669',
    successLight: '#ecfdf5',
    successBorder: '#bbf7d0',
    successDark: '#047857',

    danger: '#dc2626',
    dangerLight: '#fee2e2',
    dangerBorder: '#fecaca',
    dangerDark: '#b91c1c',

    warning: '#f59e0b',
    warningLight: '#fef3c7',
    warningBorder: '#fde68a',
    warningDark: '#b45309',

    info: '#0ea5e9',
    infoLight: '#e0f2fe',
    infoBorder: '#bae6fd',
    infoDark: '#0369a1',
  },
  radius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    full: 9999,
  },
  shadow: {
    card: {
      shadowColor: '#0f172a',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 12,
      elevation: 2,
    },
    hover: {
      shadowColor: '#2563eb',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 4,
    },
  },
  brand: {
    name: 'BusTicket',
    tagline: 'Smart Journey',
    taglineAm: 'ብልህ ጉዞ',
    description: "Ethiopia's Premier Intercity Bus Ticketing Platform",
  },
} as const;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
