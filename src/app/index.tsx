import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText type="title">SmartWallet</ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.subtitle}>
            Track expenses, plan budgets, and grow your savings from one calm dashboard.
          </ThemedText>

          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold">What you can do</ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.listItem}>
              • Review your daily spending at a glance
            </ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.listItem}>
              • Add transactions quickly from your phone
            </ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.listItem}>
              • Keep an eye on savings goals and budgets
            </ThemedText>
          </ThemedView>

          <Pressable style={styles.primaryButton} onPress={() => router.push('/login' as never)}>
            <ThemedText type="smallBold" style={styles.buttonText}>
              Continue to login
            </ThemedText>
          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={() => router.push('/dashboard' as never)}>
            <ThemedText type="smallBold">Open dashboard</ThemedText>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
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
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.five,
  },
  subtitle: {
    maxWidth: 560,
  },
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  listItem: {
    marginLeft: Spacing.one,
  },
  primaryButton: {
    backgroundColor: '#3c87f7',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: 999,
    alignItems: 'center',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#3c87f7',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: 999,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
  },
});
