import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { onAuthStateChanged } from 'firebase/auth';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { logoutUser } from '@/services/authService';
import { auth } from '@/services/firebase';
import { useAppTheme } from './app-theme-provider';
import { ThemedText } from './themed-text';

export function BiometricGate() {
  const { theme } = useAppTheme();
  const firstAuthEvent = useRef(true);
  const authenticationRunning = useRef(false);
  const [locked, setLocked] = useState(false);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState('');

  const unlock = useCallback(async () => {
    if (authenticationRunning.current) return;
    authenticationRunning.current = true;
    setChecking(true);
    setMessage('');

    try {
      const [hasHardware, isEnrolled] = await Promise.all([
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.isEnrolledAsync(),
      ]);

      if (!hasHardware || !isEnrolled) {
        setMessage('Set up fingerprint or face recognition in your phone settings to unlock SmartWallet.');
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock SmartWallet',
        promptSubtitle: 'Confirm it’s you to access your wallet',
        promptDescription: 'Your financial information is protected.',
        cancelLabel: 'Cancel',
        fallbackLabel: 'Use device passcode',
        disableDeviceFallback: false,
        biometricsSecurityLevel: 'strong',
      });

      if (result.success) {
        setLocked(false);
        setMessage('');
      } else {
        setMessage(result.error === 'user_cancel'
          ? 'Authentication was cancelled. Tap the button when you’re ready.'
          : 'We couldn’t verify your identity. Please try again.');
      }
    } catch (error) {
      console.error('Biometric authentication failed', error);
      setMessage('Biometric authentication is unavailable right now. Please try again.');
    } finally {
      authenticationRunning.current = false;
      setChecking(false);
    }
  }, []);

  useEffect(() => onAuthStateChanged(auth, (user) => {
    if (firstAuthEvent.current) {
      firstAuthEvent.current = false;
      if (user) {
        setLocked(true);
        unlock().catch(() => undefined);
      }
      return;
    }

    // A sign-in completed while this app process is already open, so do not
    // immediately ask for biometrics after the user just entered credentials.
    if (!user) setLocked(false);
  }), [unlock]);

  async function signOutInstead() {
    await logoutUser();
    setLocked(false);
  }

  return (
    <Modal visible={locked} animationType="fade" onRequestClose={() => undefined}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.icon, { backgroundColor: `${theme.primary}18` }]}>
          <Ionicons name="finger-print-outline" size={46} color={theme.primary} />
        </View>
        <ThemedText type="subtitle" style={styles.title}>SmartWallet is locked</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.description}>
          Use your fingerprint or face recognition to securely continue.
        </ThemedText>
        {message ? (
          <View style={styles.message}>
            <Ionicons name="information-circle-outline" size={19} color="#F57C00" />
            <ThemedText style={styles.messageText}>{message}</ThemedText>
          </View>
        ) : null}
        <Pressable style={[styles.unlockButton, { backgroundColor: theme.primary }]} onPress={unlock} disabled={checking}>
          {checking
            ? <ActivityIndicator color="#FFFFFF" />
            : <><Ionicons name="finger-print-outline" size={22} color="#FFFFFF" /><ThemedText type="smallBold" style={styles.unlockText}>Unlock SmartWallet</ThemedText></>}
        </Pressable>
        <Pressable style={styles.signOutButton} onPress={signOutInstead} disabled={checking}>
          <ThemedText type="smallBold" style={styles.signOutText}>Sign in with another account</ThemedText>
        </Pressable>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 },
  icon: { width: 92, height: 92, borderRadius: 30, backgroundColor: '#E3F4E7', alignItems: 'center', justifyContent: 'center', marginBottom: 22 },
  title: { color: '#123D2B', fontSize: 25, lineHeight: 33, textAlign: 'center' },
  description: { maxWidth: 310, fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 7, marginBottom: 22 },
  message: { width: '100%', maxWidth: 360, backgroundColor: '#FFF5E8', borderRadius: 14, padding: 12, flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 14 },
  messageText: { color: '#80520A', fontSize: 12, lineHeight: 18, flex: 1 },
  unlockButton: { width: '100%', maxWidth: 360, minHeight: 52, borderRadius: 15, backgroundColor: '#0F9D58', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  unlockText: { color: '#FFFFFF' },
  signOutButton: { minHeight: 46, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center', marginTop: 9 },
  signOutText: { color: '#D32F2F' },
});
