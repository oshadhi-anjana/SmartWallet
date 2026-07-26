import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AppThemeProvider, useAppTheme } from '@/components/app-theme-provider';
import { BiometricGate } from '@/components/biometric-gate';
import { auth } from '@/services/firebase';
import { initializeDatabase } from '../database/database';
import { useSync } from '../hooks/useSync';

SplashScreen.preventAutoHideAsync().catch(() => {
  // Prevent errors during development reloads.
});

function SyncBridge() {
  useSync();
  return null;
}

function AuthGuard() {
  const router = useRouter();
  const segments = useSegments();
  const [isReady, setIsReady] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(Boolean(auth.currentUser));

  useEffect(() => onAuthStateChanged(auth, (user) => {
    setIsSignedIn(Boolean(user));
    setIsReady(true);
  }), []);

  useEffect(() => {
    if (!isReady) return;

    const currentRoute = segments[0];
    const publicRoutes = ['index', 'login', 'register'];
    const isPublicRoute = !currentRoute || publicRoutes.includes(currentRoute);

    if (!isSignedIn && !isPublicRoute) {
      router.replace('/login');
    }
  }, [isReady, isSignedIn, router, segments]);

  return null;
}

export default function RootLayout() {
  useEffect(() => {
    initializeDatabase().catch((error) => {
      console.error('Database initialization failed:', error);
    });
  }, []);

  return <AppThemeProvider><AppShell /></AppThemeProvider>;
}

function AppShell() {
  const { theme } = useAppTheme();
  const navigationTheme = {
    ...(theme.isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(theme.isDark ? DarkTheme.colors : DefaultTheme.colors),
      primary: theme.primary,
      background: theme.background,
      card: theme.backgroundElement,
      text: theme.text,
      border: theme.border,
      notification: theme.secondary,
    },
  };

  return (
    <ThemeProvider value={navigationTheme}>
      <SyncBridge />
      <AuthGuard />

      <Stack
        screenOptions={{
          headerTitleAlign: 'center',
        }}
      >
        <Stack.Screen
          name="index"
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="login"
          options={{ title: 'SmartWallet' }}
        />

        <Stack.Screen
          name="register"
          options={{ title: 'SmartWallet' }}
        />

        <Stack.Screen
          name="dashboard"
          options={{ title: 'SmartWallet' }}
        />

        <Stack.Screen
          name="add-transaction"
          options={{ title: 'SmartWallet' }}
        />

        <Stack.Screen
          name="analytics"
          options={{ title: 'SmartWallet' }}
        />
         <Stack.Screen
          name="transactions"
          options={{ title: 'SmartWallet' }}
        />
        <Stack.Screen
          name="budget"
          options={{ title: 'SmartWallet' }}
        />
        <Stack.Screen
          name="savings"
          options={{ title: 'SmartWallet' }}
        />
          <Stack.Screen
          name="profile"
          options={{ title: 'SmartWallet' }}
        />
      </Stack>
      

      <AnimatedSplashOverlay />
      <BiometricGate />
    </ThemeProvider>
  );
}
