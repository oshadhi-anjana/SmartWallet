import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenNav } from '@/components/screen-nav';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { logoutUser } from '@/services/authService';
import { auth } from '@/services/firebase';

const items = [
  ['person-outline', 'Personal information', 'Name and account details'],
  ['options-outline', 'Preferences', 'Currency, region and language'],
  ['color-palette-outline', 'Theme', 'Asia Light'],
  ['notifications-outline', 'Notifications', 'Reminders and alerts'],
  ['shield-checkmark-outline', 'Security', 'Password and privacy'],
  ['cloud-upload-outline', 'Backup & sync', 'Offline and Firebase status'],
  ['help-circle-outline', 'Help & support', 'Get assistance'],
] as const;

export default function ProfileScreen() {
  const router = useRouter();
  const initials = (auth.currentUser?.displayName || 'Smart Wallet').split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.titleRow}>
            <ThemedText type="subtitle" style={styles.title}>Profile</ThemedText>
            <View style={styles.settings}><Ionicons name="settings-outline" size={21} color="#212121" /></View>
          </View>

          <View style={styles.profileCard}>
            <View style={styles.avatar}><ThemedText style={styles.initials}>{initials}</ThemedText></View>
            <View style={styles.profileCopy}>
              <ThemedText type="smallBold" style={styles.userName}>{auth.currentUser?.displayName || 'SmartWallet user'}</ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.email}>{auth.currentUser?.email || 'Offline profile'}</ThemedText>
              <ThemedText style={styles.edit}>Edit profile</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#68756F" />
          </View>

          <View style={styles.menu}>
            {items.map(([icon, title, subtitle], index) => (
              <Pressable key={title} style={[styles.menuRow, index < items.length - 1 && styles.menuBorder]}>
                <View style={styles.menuIcon}><Ionicons name={icon} size={20} color="#0F9D58" /></View>
                <View style={styles.menuCopy}>
                  <ThemedText type="smallBold">{title}</ThemedText>
                  <ThemedText themeColor="textSecondary" style={styles.menuSubtitle}>{subtitle}</ThemedText>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#9AA39F" />
              </Pressable>
            ))}
          </View>

          <Pressable style={styles.logout} onPress={async () => {
            await logoutUser();
            if (router.canDismiss()) {
              router.dismissAll();
            }
            router.replace('/login' as never);
          }}>
            <Ionicons name="log-out-outline" size={20} color="#D32F2F" />
            <ThemedText type="smallBold" style={styles.logoutText}>Logout</ThemedText>
          </Pressable>
        </ScrollView>
        <ScreenNav />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, maxWidth: MaxContentWidth, alignSelf: 'center', width: '100%' },
  content: { paddingHorizontal: Spacing.three, paddingTop: Spacing.three, paddingBottom: BottomTabInset + 105, gap: 16 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 27, lineHeight: 35 },
  settings: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#ECE9DF' },
  profileCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ECE9DF' },
  avatar: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#0F9D58', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#DDF5E8' },
  initials: { color: '#FFFFFF', fontWeight: '800', fontSize: 18 },
  profileCopy: { flex: 1, paddingHorizontal: 12 }, userName: { fontSize: 16 }, email: { fontSize: 12, lineHeight: 17 }, edit: { color: '#0F9D58', fontSize: 12, fontWeight: '700' },
  menu: { backgroundColor: '#FFFFFF', borderRadius: 20, paddingHorizontal: 14, borderWidth: 1, borderColor: '#ECE9DF' },
  menuRow: { minHeight: 66, flexDirection: 'row', alignItems: 'center' }, menuBorder: { borderBottomWidth: 1, borderBottomColor: '#F0EEE8' },
  menuIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: '#EAF7F0', alignItems: 'center', justifyContent: 'center' },
  menuCopy: { flex: 1, paddingHorizontal: 11 }, menuSubtitle: { fontSize: 11, lineHeight: 15 },
  logout: { minHeight: 50, borderRadius: 15, backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: '#F4D7D7' },
  logoutText: { color: '#D32F2F' },
});
