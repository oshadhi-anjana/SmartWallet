import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { initializeDatabase } from '../database/database';
import { useSync } from '../hooks/useSync';

SplashScreen.preventAutoHideAsync().catch(() => {
  // Prevent errors during development reloads.
});

function SyncBridge() {
  useSync();
  return null;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    initializeDatabase().catch((error) => {
      console.error('Database initialization failed:', error);
    });
  }, []);

  return (
    <ThemeProvider
      value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}
    >
      <SyncBridge />

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
          options={{ title: 'Login' }}
        />

        <Stack.Screen
          name="register"
          options={{ title: 'Create Account' }}
        />

        <Stack.Screen
          name="dashboard"
          options={{ title: 'SmartWallet' }}
        />

        <Stack.Screen
          name="add-transaction"
          options={{ title: 'Add Transaction' }}
        />
      </Stack>

      <AnimatedSplashOverlay />
    </ThemeProvider>
  );
}