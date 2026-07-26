import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { useAppTheme } from '@/components/app-theme-provider';
import { ThemedView } from '@/components/themed-view';
import { PasswordField } from '@/components/password-field';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { registerUser } from '../services/authService';

export default function RegisterScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    if (!name.trim()) {
      setErrorMessage('Name is required');
      return false;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email.trim())) {
      setErrorMessage('Email must be valid');
      return false;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters');
      return false;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords must match');
      return false;
    }

    setErrorMessage('');
    return true;
  };

  const handleRegister = async () => {
    if (!validate()) {
      return;
    }

    setIsLoading(true);

    try {
      await registerUser(email, password, name);
      router.replace('/dashboard' as never);
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <SafeAreaView style={styles.safeArea}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets
            showsVerticalScrollIndicator={false}>
            <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText type="subtitle">Create Account</ThemedText>
          <ThemedText themeColor="textSecondary">
            Start building smarter money habits with secure, simple expense tracking.
          </ThemedText>

          {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

          <TextInput style={styles.input} placeholder="Name" value={name} onChangeText={setName} />
          <TextInput
            style={styles.input}
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <PasswordField
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            autoComplete="new-password"
          />
          <PasswordField
            placeholder="Confirm password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          <Pressable style={[styles.primaryButton, { backgroundColor: theme.primary }]} onPress={handleRegister} disabled={isLoading}>
            {isLoading ? <ActivityIndicator color="#fff" /> : <ThemedText type="smallBold" style={styles.buttonText}>Register</ThemedText>}
          </Pressable>

          <Link href="/login" style={styles.link}>Already have an account? Login</Link>
            </ThemedView>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.three,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingVertical: Spacing.four },
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  input: {
    borderWidth: 1,
    borderColor: '#FFC107',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  primaryButton: {
    backgroundColor: '#0F9D58',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: 999,
    alignItems: 'center',
    marginTop: Spacing.one,
  },
  buttonText: {
    color: '#ffffff',
  },
  error: {
    color: '#D32F2F',
    fontSize: 13,
  },
  link: {
    color: '#F57C00',
    textAlign: 'center',
    marginTop: Spacing.one,
  },
});
