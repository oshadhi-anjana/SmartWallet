import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PasswordField } from '@/components/password-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { loginUser, loginWithGoogleIdToken, requestPasswordReset } from '@/services/authService';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const googleConfigured = Boolean(process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID);

  async function handleLogin() {
    if (!email.trim() || !password) {
      setErrorMessage('Enter your email and password.');
      return;
    }
    setErrorMessage('');
    setIsLoading(true);
    try {
      await loginUser(email, password);
      router.replace('/dashboard' as never);
    } catch {
      setErrorMessage('Email or password is incorrect.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleForgotPassword() {
    setErrorMessage('');
    try {
      await requestPasswordReset(email);
      Alert.alert(
        'Check your inbox',
        `If ${email.trim()} has a password account, Firebase has sent a reset link. Check your spam folder too.`
      );
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to send the reset email.');
    }
  }

  async function handleGoogleLogin() {
    if (!googleConfigured) {
      setErrorMessage('The Google Web client ID is missing from .env.');
      return;
    }
    setErrorMessage('');
    setIsGoogleLoading(true);
    try {
      const {
        GoogleSignin,
        isSuccessResponse,
      } = await import('@react-native-google-signin/google-signin');

      GoogleSignin.configure({
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
        iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
        offlineAccess: false,
      });
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      // Clear the previous native Google session so the account chooser is
      // shown every time instead of silently reusing the last account.
      await GoogleSignin.signOut().catch(() => null);
      const response = await GoogleSignin.signIn();

      if (!isSuccessResponse(response)) return;
      const idToken = response.data.idToken;
      if (!idToken) throw new Error('Google did not return an identity token.');

      await loginWithGoogleIdToken(idToken);
      router.replace('/dashboard' as never);
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      setErrorMessage(
        message.includes('RNGoogleSignin')
          ? 'Google login requires a development build. It is not available in Expo Go.'
          : 'Google sign-in failed. Check the Android SHA-1 in Firebase and rebuild the app.'
      );
    } finally {
      setIsGoogleLoading(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Pressable style={styles.back} onPress={() => router.back()} accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={23} color="#163D2C" />
        </Pressable>

        <View style={styles.form}>
          <ThemedText type="subtitle" style={styles.heading}>Welcome Back</ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.subheading}>Sign in to continue</ThemedText>

          {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

          <ThemedText style={styles.label}>Email</ThemedText>
          <TextInput
            style={styles.input}
            placeholder="example@email.com"
            placeholderTextColor="#8B918E"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
          />
          <ThemedText style={styles.label}>Password</ThemedText>
          <PasswordField placeholder="Password" value={password} onChangeText={setPassword} autoComplete="current-password" />

          <Pressable onPress={handleForgotPassword} hitSlop={8}>
            <ThemedText style={styles.forgot}>Forgot Password?</ThemedText>
          </Pressable>

          <Pressable style={styles.loginButton} onPress={handleLogin} disabled={isLoading}>
            {isLoading ? <ActivityIndicator color="#FFFFFF" /> : <ThemedText type="smallBold" style={styles.loginText}>Login</ThemedText>}
          </Pressable>

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <ThemedText themeColor="textSecondary" style={styles.dividerText}>or continue with</ThemedText>
            <View style={styles.divider} />
          </View>

          <Pressable style={styles.googleButton} disabled={isGoogleLoading} onPress={handleGoogleLogin}>
            {isGoogleLoading ? <ActivityIndicator color="#0F9D58" /> : <><GoogleMark /><ThemedText type="smallBold">Continue with Google</ThemedText></>}
          </Pressable>
        </View>

        <View style={styles.signupRow}>
          <ThemedText themeColor="textSecondary" style={styles.signupText}>Don&apos;t have an account?</ThemedText>
          <Link href="/register" style={styles.signupLink}> Sign Up</Link>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

function GoogleMark() {
  return <Ionicons name="logo-google" size={21} color="#4285F4" />;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: Spacing.four, maxWidth: MaxContentWidth, alignSelf: 'center', width: '100%' },
  back: { width: 44, height: 44, alignItems: 'flex-start', justifyContent: 'center', marginTop: 4 },
  form: { marginTop: 22 },
  heading: { textAlign: 'center', fontSize: 25, lineHeight: 33, color: '#123D2B' },
  subheading: { textAlign: 'center', fontSize: 13, marginBottom: 30 },
  label: { fontSize: 12, lineHeight: 18, marginBottom: 5, marginTop: 10, color: '#4B5550' },
  input: { borderWidth: 1, borderColor: '#DEDCD5', borderRadius: 10, paddingHorizontal: 12, minHeight: 47, backgroundColor: '#FFFFFF', color: '#212121' },
  forgot: { color: '#0F9D58', fontSize: 12, lineHeight: 18, fontWeight: '700', marginTop: 10 },
  loginButton: { backgroundColor: '#0F9D58', minHeight: 49, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginTop: 22, shadowColor: '#0F9D58', shadowOpacity: 0.18, shadowRadius: 8, elevation: 3 },
  loginText: { color: '#FFFFFF' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 24 },
  divider: { flex: 1, height: 1, backgroundColor: '#E6E2D9' }, dividerText: { fontSize: 12 },
  googleButton: { minHeight: 49, borderRadius: 10, borderWidth: 1, borderColor: '#DEDCD5', backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 11 },
  error: { color: '#D32F2F', backgroundColor: '#FFF0F0', borderRadius: 9, padding: 9, textAlign: 'center', fontSize: 12, marginBottom: 4 },
  signupRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 'auto', marginBottom: 36 },
  signupText: { fontSize: 12 }, signupLink: { color: '#0F9D58', fontWeight: '700', fontSize: 12 },
});
