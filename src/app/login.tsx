import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PasswordField } from '@/components/password-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { loginUser } from '../services/authService';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogin() {
    setErrorMessage('');
    setIsLoading(true);
    try {
      await loginUser(email, password);
      router.replace('/dashboard' as never);
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Pressable style={styles.back} onPress={() => router.back()} accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={22} color="#212121" />
        </Pressable>
        <ThemedView type="backgroundElement" style={styles.card}>
          <View style={styles.logoMark}><Ionicons name="wallet" size={34} color="#FFFFFF" /></View>
          <ThemedText type="subtitle" style={styles.heading}>Welcome Back</ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.subheading}>Sign in to continue</ThemedText>

          {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
          <ThemedText type="smallBold">Email</ThemedText>
          <TextInput
            style={styles.input}
            placeholder="example@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
          />
          <ThemedText type="smallBold">Password</ThemedText>
          <PasswordField placeholder="Password" value={password} onChangeText={setPassword} autoComplete="current-password" />
          <ThemedText style={styles.forgot}>Forgot password?</ThemedText>

          <Pressable style={styles.primaryButton} onPress={handleLogin} disabled={isLoading}>
            {isLoading ? <ActivityIndicator color="#FFFFFF" /> : <ThemedText type="smallBold" style={styles.buttonText}>Login</ThemedText>}
          </Pressable>
          <View style={styles.signupRow}>
            <ThemedText themeColor="textSecondary" style={styles.signupText}>Don&apos;t have an account?</ThemedText>
            <Link href="/register" style={styles.link}> Sign up</Link>
          </View>
        </ThemedView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: Spacing.four, maxWidth: MaxContentWidth, alignSelf: 'center', width: '100%', justifyContent: 'center' },
  back: { position: 'absolute', top: 18, left: 24, width: 42, height: 42, borderRadius: 14, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  card: { borderRadius: 26, padding: Spacing.four, gap: 10, borderWidth: 1, borderColor: '#ECE9DF', shadowColor: '#123D2B', shadowOpacity: 0.08, shadowRadius: 14, elevation: 4 },
  logoMark: { width: 66, height: 66, borderRadius: 22, backgroundColor: '#0F9D58', alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  heading: { textAlign: 'center', fontSize: 27, lineHeight: 34 },
  subheading: { textAlign: 'center', marginBottom: 10 },
  input: { borderWidth: 1, borderColor: '#E2DED2', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11, backgroundColor: '#FFFFFF', color: '#212121' },
  forgot: { color: '#0F9D58', fontSize: 12, alignSelf: 'flex-end' },
  primaryButton: { backgroundColor: '#0F9D58', minHeight: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  buttonText: { color: '#FFFFFF' },
  error: { color: '#D32F2F', fontSize: 13, textAlign: 'center' },
  signupRow: { flexDirection: 'row', alignSelf: 'center', marginTop: 14 },
  signupText: { fontSize: 13 },
  link: { color: '#0F9D58', fontWeight: '700' },
});
