export const Colors = {
  primary: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
  },
  secondary: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    200: '#BBF7D0',
    300: '#86EFAC',
    400: '#4ADE80',
    500: '#22C55E',
    600: '#16A34A',
    700: '#15803D',
    800: '#166534',
    900: '#14532D',
  },
  accent: {
    50: '#FFF7ED',
    100: '#FFEDD5',
    200: '#FED7AA',
    300: '#FDBA74',
    400: '#FB923C',
    500: '#F97316',
    600: '#EA580C',
    700: '#C2410C',
    800: '#9A3412',
    900: '#7C2D12',
  },
  neutral: {
    0: '#FFFFFF',
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
    950: '#020617',
  },
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
};

export const Gradients = {
  primary: ['#3B82F6', '#2563EB', '#1D4ED8'] as const,
  secondary: ['#22C55E', '#16A34A', '#15803D'] as const,
  accent: ['#F97316', '#EA580C', '#C2410C'] as const,
  dark: ['#1E293B', '#0F172A', '#020617'] as const,
  hero: ['#1E40AF', '#3B82F6', '#60A5FA'] as const,
};

export const Typography = {
  h1: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    lineHeight: 40,
  },
  h2: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    lineHeight: 32,
  },
  h3: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    lineHeight: 28,
  },
  h4: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    lineHeight: 24,
  },
  body: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    lineHeight: 16,
  },
  button: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    lineHeight: 24,
  },
  buttonSmall: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    lineHeight: 20,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};
