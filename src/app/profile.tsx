import { useRouter } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { ScreenNav } from '@/components/screen-nav';
import { auth } from '@/services/firebase';
import { logoutUser } from '@/services/authService';

export default function ProfileScreen() {
  const router = useRouter();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScreenNav />
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText type="subtitle">Profile</ThemedText>
          <ThemedText themeColor="textSecondary">Manage your account and preferences.</ThemedText>
          <ThemedText type="smallBold">{auth.currentUser?.displayName || 'SmartWallet user'}</ThemedText>
          <ThemedText themeColor="textSecondary">{auth.currentUser?.email || 'Offline profile'}</ThemedText>

          <Pressable style={styles.primaryButton} onPress={async () => {
            await logoutUser();
            router.replace('/login' as never);
          }}>
            <ThemedText type="smallBold" style={styles.buttonText}>
              Log out
            </ThemedText>
          </Pressable>
        </ThemedView>
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
    paddingTop: Spacing.four,
    gap: Spacing.three,
  },
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  primaryButton: {
    backgroundColor: '#F57C00',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: 999,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
  },
});
