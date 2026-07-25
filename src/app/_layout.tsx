import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { initializeDatabase } from '../database/database';
import { useSync } from '../hooks/useSync';

SplashScreen.preventAutoHideAsync();

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
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <SyncBridge />
      <AnimatedSplashOverlay />
      <Stack
        screenOptions={{
          headerTitleAlign: 'center',
        }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ title: 'Login' }} />
        <Stack.Screen name="register" options={{ title: 'Create Account' }} />
        <Stack.Screen name="dashboard" options={{ title: 'SmartWallet' }} />
        <Stack.Screen name="transactions" options={{ title: 'Transactions' }} />
        <Stack.Screen name="budget" options={{ title: 'Budget' }} />
        <Stack.Screen name="savings" options={{ title: 'Savings' }} />
        <Stack.Screen name="analytics" options={{ title: 'Analytics' }} />
        <Stack.Screen name="add-transaction" options={{ title: 'Add Transaction' }} />
        <Stack.Screen name="camera" options={{ title: 'Camera' }} />
      </Stack>
    </ThemeProvider>
  );
}
