// Mobile OWUI — Theme matching Open WebUI aesthetics

export const Colors = {
  // Backgrounds
  bg: '#0f0f0f',
  bgSecondary: '#1a1a1a',
  bgTertiary: '#222222',
  bgCard: '#1e1e1e',
  bgInput: '#2a2a2a',
  bgHover: '#2e2e2e',

  // Surface / sidebar
  surface: '#171717',
  surfaceSecondary: '#1f1f1f',

  // Borders
  border: '#2e2e2e',
  borderLight: '#3a3a3a',

  // Text
  textPrimary: '#ececec',
  textSecondary: '#9a9a9a',
  textMuted: '#666666',
  textInverse: '#0f0f0f',

  // Accent (Open WebUI uses a clean white/gray accent)
  accent: '#ffffff',
  accentDim: '#d0d0d0',

  // User message bubble
  userBubble: '#2563eb',
  userBubbleText: '#ffffff',

  // Assistant message — transparent / no bubble
  assistantText: '#ececec',

  // Status
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',

  // Model badge
  modelBadge: '#2a2a2a',
  modelBadgeText: '#9a9a9a',
};

export const Typography = {
  // Font families (use system fonts, matching OWUI's clean sans approach)
  fontMono: 'Courier New',
  fontSans: 'System',

  // Sizes
  xs: 11,
  sm: 13,
  base: 15,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,

  // Weights
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
};

export const Radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
};
