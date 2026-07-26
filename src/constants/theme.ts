/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#212121',
    background: '#F7F8FA',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#FFC107',
    textSecondary: '#212121',
  },
  dark: {
    text: '#212121',
    background: '#F7F8FA',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#FFC107',
    textSecondary: '#212121',
  },
} as const;

export const AppThemes = {
  'asia-light': {
    text: '#212121',
    background: '#F7F8FA',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#FFC107',
    textSecondary: '#68756F',
    primary: '#0F9D58',
    secondary: '#F57C00',
    border: '#ECE9DF',
    isDark: false,
  },
  'asia-dark': {
    text: '#F4FFF8',
    background: '#071B12',
    backgroundElement: '#10291E',
    backgroundSelected: '#FFC107',
    textSecondary: '#B8C9C0',
    primary: '#27C978',
    secondary: '#FF9A3C',
    border: '#294438',
    isDark: true,
  },
  'europe-light': {
    text: '#172033',
    background: '#F4F7FB',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#60A5FA',
    textSecondary: '#667085',
    primary: '#2563EB',
    secondary: '#0EA5E9',
    border: '#DFE6F0',
    isDark: false,
  },
  'europe-dark': {
    text: '#F8FAFC',
    background: '#0F172A',
    backgroundElement: '#1E293B',
    backgroundSelected: '#60A5FA',
    textSecondary: '#CBD5E1',
    primary: '#60A5FA',
    secondary: '#38BDF8',
    border: '#334155',
    isDark: true,
  },
} as const;

export type AppThemeName = keyof typeof AppThemes;

export const Palette = {
  primary: '#0F9D58',
  secondary: '#F57C00',
  accent: '#FFC107',
  background: '#F7F8FA',
  surface: '#FFFFFF',
  text: '#212121',
  success: '#2E7D32',
  error: '#D32F2F',
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
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
