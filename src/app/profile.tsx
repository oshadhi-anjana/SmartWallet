import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Modal, Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CurrencyCode, useAppTheme } from '@/components/app-theme-provider';
import { ScreenNav } from '@/components/screen-nav';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppThemeName, AppThemes, BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { getCurrentUserName, logoutUser, requestPasswordReset, updateCurrentUserName } from '@/services/authService';
import { auth } from '@/services/firebase';
import { refreshWalletData } from '@/services/syncService';

type Section = 'personal' | 'preferences' | 'theme' | 'notifications' | 'security' | 'backup' | 'help' | null;

const menuItems: Array<[keyof typeof Ionicons.glyphMap, string, string, Exclude<Section, null>]> = [
  ['person-outline', 'Personal information', 'Name and account details', 'personal'],
  ['options-outline', 'Preferences', 'Currency and region', 'preferences'],
  ['color-palette-outline', 'Theme', 'Choose your app appearance', 'theme'],
  ['notifications-outline', 'Notifications', 'Budget and spending alerts', 'notifications'],
  ['shield-checkmark-outline', 'Security', 'Biometrics and password', 'security'],
  ['cloud-upload-outline', 'Backup & sync', 'Refresh your Firebase data', 'backup'],
  ['help-circle-outline', 'Help & support', 'Contact SmartWallet support', 'help'],
];

const themeLabels: Record<AppThemeName, string> = {
  'asia-light': 'Asia Light',
  'asia-dark': 'Asia Dark',
  'europe-light': 'Europe Light',
  'europe-dark': 'Europe Dark',
};

export default function ProfileScreen() {
  const router = useRouter();
  const { theme, themeName, setThemeName, currency, setCurrency } = useAppTheme();
  const [section, setSection] = useState<Section>(null);
  const [userName, setUserName] = useState(auth.currentUser?.displayName ?? '');
  const [nameInput, setNameInput] = useState(userName);
  const [region, setRegion] = useState('Sri Lanka');
  const [budgetAlerts, setBudgetAlerts] = useState(true);
  const [spendingAlerts, setSpendingAlerts] = useState(true);
  const [savingReminders, setSavingReminders] = useState(true);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getCurrentUserName().then((name) => { setUserName(name); setNameInput(name); }).catch(() => undefined);
    AsyncStorage.multiGet([
      'smartwallet.region',
      'smartwallet.alerts.budget', 'smartwallet.alerts.spending', 'smartwallet.alerts.savings',
    ]).then((entries) => {
      const values = Object.fromEntries(entries);
      if (values['smartwallet.region']) setRegion(values['smartwallet.region']);
      if (values['smartwallet.alerts.budget']) setBudgetAlerts(values['smartwallet.alerts.budget'] === 'true');
      if (values['smartwallet.alerts.spending']) setSpendingAlerts(values['smartwallet.alerts.spending'] === 'true');
      if (values['smartwallet.alerts.savings']) setSavingReminders(values['smartwallet.alerts.savings'] === 'true');
    }).catch(() => undefined);
  }, []);

  const initials = (userName || 'Smart Wallet').split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();

  function openSection(value: Exclude<Section, null>) {
    setMessage('');
    setNameInput(userName);
    setSection(value);
  }

  async function saveName() {
    setBusy(true); setMessage('');
    try {
      const saved = await updateCurrentUserName(nameInput);
      setUserName(saved);
      setMessage('Your name has been updated.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to update your name.');
    } finally { setBusy(false); }
  }

  async function savePreferences() {
    await AsyncStorage.multiSet([
      ['smartwallet.region', region],
    ]);
    setMessage('Preferences saved on this device.');
  }

  async function saveNotifications() {
    await AsyncStorage.multiSet([
      ['smartwallet.alerts.budget', String(budgetAlerts)],
      ['smartwallet.alerts.spending', String(spendingAlerts)],
      ['smartwallet.alerts.savings', String(savingReminders)],
    ]);
    setMessage('Notification preferences saved.');
  }

  async function testBiometrics() {
    const result = await LocalAuthentication.authenticateAsync({ promptMessage: 'Verify SmartWallet security' });
    setMessage(result.success ? 'Biometric authentication is working.' : 'Biometric verification was not completed.');
  }

  async function syncNow() {
    setBusy(true); setMessage('');
    try {
      await refreshWalletData(auth.currentUser?.uid ?? 'local-user');
      setMessage('Your wallet data is up to date.');
    } catch {
      setMessage('Sync could not complete. Check your internet connection.');
    } finally { setBusy(false); }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.titleRow}>
            <ThemedText type="subtitle" style={styles.title}>Profile</ThemedText>
            <Pressable style={[styles.settings, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]} onPress={() => openSection('preferences')}><Ionicons name="settings-outline" size={21} color={theme.text} /></Pressable>
          </View>

          <Pressable style={[styles.profileCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]} onPress={() => openSection('personal')}>
            <View style={[styles.avatar, { backgroundColor: theme.primary }]}><ThemedText style={styles.initials}>{initials}</ThemedText></View>
            <View style={styles.profileCopy}>
              <ThemedText type="smallBold" style={styles.userName}>{userName || 'SmartWallet user'}</ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.email}>{auth.currentUser?.email || 'Offline profile'}</ThemedText>
              <ThemedText style={[styles.edit, { color: theme.primary }]}>Edit profile</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </Pressable>

          <View style={[styles.menu, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            {menuItems.map(([icon, title, subtitle, key], index) => (
              <Pressable key={key} onPress={() => openSection(key)} style={[styles.menuRow, index < menuItems.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border }]}>
                <View style={[styles.menuIcon, { backgroundColor: `${theme.primary}18` }]}><Ionicons name={icon} size={20} color={theme.primary} /></View>
                <View style={styles.menuCopy}>
                  <ThemedText type="smallBold">{title}</ThemedText>
                  <ThemedText themeColor="textSecondary" style={styles.menuSubtitle}>{key === 'theme' ? themeLabels[themeName] : subtitle}</ThemedText>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
              </Pressable>
            ))}
          </View>

          <Pressable style={[styles.logout, { backgroundColor: theme.backgroundElement }]} onPress={async () => {
            await logoutUser();
            if (router.canDismiss()) router.dismissAll();
            router.replace('/login' as never);
          }}>
            <Ionicons name="log-out-outline" size={20} color="#D32F2F" />
            <ThemedText type="smallBold" style={styles.logoutText}>Logout</ThemedText>
          </Pressable>
        </ScrollView>
        <ScreenNav />

        <Modal visible={Boolean(section)} transparent animationType="slide" statusBarTranslucent onRequestClose={() => setSection(null)}>
          <Pressable style={styles.backdrop} onPress={() => setSection(null)}>
            <Pressable style={[styles.modal, { backgroundColor: theme.backgroundElement }]} onPress={(event) => event.stopPropagation()}>
              <View style={styles.modalHeader}>
                <ThemedText type="subtitle" style={styles.modalTitle}>{sectionTitle(section)}</ThemedText>
                <Pressable style={[styles.close, { backgroundColor: theme.background }]} onPress={() => setSection(null)}><Ionicons name="close" size={22} color={theme.text} /></Pressable>
              </View>
              <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
                {section === 'personal' ? <>
                  <SettingLabel>Name</SettingLabel>
                  <TextInput style={[styles.input, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border }]} value={nameInput} onChangeText={setNameInput} placeholder="Your name" placeholderTextColor={theme.textSecondary} />
                  <SettingLabel>Email address</SettingLabel>
                  <View style={[styles.readonly, { backgroundColor: theme.background }]}><ThemedText themeColor="textSecondary">{auth.currentUser?.email ?? 'No email'}</ThemedText><Ionicons name="lock-closed-outline" size={17} color={theme.textSecondary} /></View>
                  <PrimaryButton label="Save profile" busy={busy} onPress={saveName} color={theme.primary} />
                </> : null}

                {section === 'preferences' ? <>
                  <ChoiceGroup label="Currency" values={['LKR', 'USD', 'EUR']} selected={currency} onSelect={(value) => setCurrency(value as CurrencyCode)} />
                  <ChoiceGroup label="Region" values={['Sri Lanka', 'Asia', 'Europe']} selected={region} onSelect={setRegion} />
                  <PrimaryButton label="Save preferences" onPress={savePreferences} color={theme.primary} />
                </> : null}

                {section === 'theme' ? (Object.keys(AppThemes) as AppThemeName[]).map((item) => {
                  const option = AppThemes[item];
                  const selected = item === themeName;
                  return <Pressable key={item} style={[styles.themeOption, { backgroundColor: option.backgroundElement, borderColor: selected ? option.primary : option.border }]} onPress={() => setThemeName(item)}>
                    <View style={[styles.themePreview, { backgroundColor: option.background }]}><View style={[styles.previewCard, { backgroundColor: option.backgroundElement }]} /><View style={[styles.previewAccent, { backgroundColor: option.primary }]} /></View>
                    <View style={styles.themeCopy}><ThemedText type="smallBold" style={{ color: option.text }}>{themeLabels[item]}</ThemedText><ThemedText style={{ color: option.textSecondary, fontSize: 11 }}>{option.isDark ? 'Dark appearance' : 'Light appearance'}</ThemedText></View>
                    <Ionicons name={selected ? 'radio-button-on' : 'radio-button-off'} size={22} color={selected ? option.primary : option.textSecondary} />
                  </Pressable>;
                }) : null}

                {section === 'notifications' ? <>
                  <ToggleRow label="Budget alerts" description="Notify when a category is near its limit" value={budgetAlerts} onChange={setBudgetAlerts} color={theme.primary} />
                  <ToggleRow label="Spending alerts" description="Warn when monthly expenses exceed income" value={spendingAlerts} onChange={setSpendingAlerts} color={theme.primary} />
                  <ToggleRow label="Savings reminders" description="Remind you to update savings goals" value={savingReminders} onChange={setSavingReminders} color={theme.primary} />
                  <PrimaryButton label="Save notification settings" onPress={saveNotifications} color={theme.primary} />
                </> : null}

                {section === 'security' ? <>
                  <ActionCard icon="finger-print-outline" title="Test biometric unlock" subtitle="Verify fingerprint or face recognition" onPress={testBiometrics} />
                  <ActionCard icon="key-outline" title="Reset password" subtitle="Send a secure reset link to your email" onPress={async () => {
                    if (!auth.currentUser?.email) return setMessage('No email address is available.');
                    try { await requestPasswordReset(auth.currentUser.email); setMessage('Password reset email sent.'); } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to send reset email.'); }
                  }} />
                </> : null}

                {section === 'backup' ? <>
                  <View style={[styles.syncCard, { backgroundColor: theme.background }]}><Ionicons name="cloud-done-outline" size={38} color={theme.primary} /><ThemedText type="smallBold">Firebase cloud backup</ThemedText><ThemedText themeColor="textSecondary" style={styles.centerText}>Transactions, budgets, and savings goals sync securely with your account.</ThemedText></View>
                  <PrimaryButton label="Sync now" busy={busy} onPress={syncNow} color={theme.primary} />
                </> : null}

                {section === 'help' ? <>
                  <ActionCard icon="mail-outline" title="Email support" subtitle="Send a message to the SmartWallet team" onPress={() => Linking.openURL('mailto:support@smartwallet.app?subject=SmartWallet%20Support')} />
                  <ActionCard icon="information-circle-outline" title="About SmartWallet" subtitle="Version 1.0.0 · Manage money smarter" onPress={() => setMessage('SmartWallet version 1.0.0')} />
                </> : null}

                {message ? <View style={[styles.message, { backgroundColor: theme.background }]}><Ionicons name="information-circle-outline" size={19} color={theme.primary} /><ThemedText style={styles.messageText}>{message}</ThemedText></View> : null}
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>
      </SafeAreaView>
    </ThemedView>
  );

  function ChoiceGroup({ label, values, selected, onSelect }: { label: string; values: string[]; selected: string; onSelect: (value: string) => void }) {
    return <View style={styles.group}><SettingLabel>{label}</SettingLabel><View style={styles.choices}>{values.map((value) => <Pressable key={value} onPress={() => onSelect(value)} style={[styles.choice, { borderColor: selected === value ? theme.primary : theme.border, backgroundColor: selected === value ? `${theme.primary}18` : theme.background }]}><ThemedText type="smallBold" style={selected === value ? { color: theme.primary } : undefined}>{value}</ThemedText></Pressable>)}</View></View>;
  }
}

function sectionTitle(section: Section) {
  return menuItems.find((item) => item[3] === section)?.[1] ?? 'Profile settings';
}

function SettingLabel({ children }: { children: string }) {
  return <ThemedText type="smallBold" style={styles.settingLabel}>{children}</ThemedText>;
}

function PrimaryButton({ label, onPress, busy, color }: { label: string; onPress: () => void | Promise<void>; busy?: boolean; color: string }) {
  return <Pressable style={[styles.primaryButton, { backgroundColor: color }]} onPress={onPress} disabled={busy}>{busy ? <ActivityIndicator color="#FFFFFF" /> : <ThemedText type="smallBold" style={styles.white}>{label}</ThemedText>}</Pressable>;
}

function ToggleRow({ label, description, value, onChange, color }: { label: string; description: string; value: boolean; onChange: (value: boolean) => void; color: string }) {
  return <View style={styles.toggleRow}><View style={styles.toggleCopy}><ThemedText type="smallBold">{label}</ThemedText><ThemedText themeColor="textSecondary" style={styles.toggleDescription}>{description}</ThemedText></View><Switch value={value} onValueChange={onChange} trackColor={{ true: color }} /></View>;
}

function ActionCard({ icon, title, subtitle, onPress }: { icon: keyof typeof Ionicons.glyphMap; title: string; subtitle: string; onPress: () => void | Promise<void> }) {
  const { theme } = useAppTheme();
  return <Pressable style={[styles.actionCard, { backgroundColor: theme.background, borderColor: theme.border }]} onPress={onPress}><View style={[styles.actionIcon, { backgroundColor: `${theme.primary}18` }]}><Ionicons name={icon} size={21} color={theme.primary} /></View><View style={styles.actionCopy}><ThemedText type="smallBold">{title}</ThemedText><ThemedText themeColor="textSecondary" style={styles.toggleDescription}>{subtitle}</ThemedText></View><Ionicons name="chevron-forward" size={18} color={theme.textSecondary} /></Pressable>;
}

const styles = StyleSheet.create({
  container: { flex: 1 }, safeArea: { flex: 1, maxWidth: MaxContentWidth, alignSelf: 'center', width: '100%' },
  content: { paddingHorizontal: Spacing.three, paddingTop: Spacing.three, paddingBottom: BottomTabInset + 120, gap: 16 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, title: { fontSize: 27, lineHeight: 35 },
  settings: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  profileCard: { borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 1 },
  avatar: { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)' },
  initials: { color: '#FFFFFF', fontWeight: '800', fontSize: 18 }, profileCopy: { flex: 1, paddingHorizontal: 12 }, userName: { fontSize: 16 }, email: { fontSize: 12, lineHeight: 17 }, edit: { fontSize: 12, fontWeight: '700' },
  menu: { borderRadius: 20, paddingHorizontal: 14, borderWidth: 1 }, menuRow: { minHeight: 66, flexDirection: 'row', alignItems: 'center' },
  menuIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, menuCopy: { flex: 1, paddingHorizontal: 11 }, menuSubtitle: { fontSize: 11, lineHeight: 15 },
  logout: { minHeight: 50, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: '#F4D7D7' }, logoutText: { color: '#D32F2F' },
  backdrop: { flex: 1, backgroundColor: 'rgba(8,18,13,0.55)', justifyContent: 'center', paddingHorizontal: 20 }, modal: { maxHeight: '86%', minHeight: 300, borderRadius: 24, padding: 20 }, modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, modalTitle: { fontSize: 21, lineHeight: 28 }, close: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, modalContent: { gap: 13, paddingTop: 18, paddingBottom: 4 },
  settingLabel: { fontSize: 12 }, input: { minHeight: 49, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12 }, readonly: { minHeight: 49, borderRadius: 12, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  primaryButton: { minHeight: 49, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 4 }, white: { color: '#FFFFFF' },
  group: { gap: 7 }, choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, choice: { minHeight: 42, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
  themeOption: { minHeight: 78, borderRadius: 16, borderWidth: 2, padding: 10, flexDirection: 'row', alignItems: 'center' }, themePreview: { width: 62, height: 50, borderRadius: 10, padding: 7 }, previewCard: { height: 15, borderRadius: 4 }, previewAccent: { width: 28, height: 8, borderRadius: 4, marginTop: 7 }, themeCopy: { flex: 1, paddingHorizontal: 11 },
  toggleRow: { minHeight: 62, flexDirection: 'row', alignItems: 'center' }, toggleCopy: { flex: 1, paddingRight: 10 }, toggleDescription: { fontSize: 11, lineHeight: 16 },
  actionCard: { minHeight: 68, borderRadius: 15, borderWidth: 1, padding: 11, flexDirection: 'row', alignItems: 'center' }, actionIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, actionCopy: { flex: 1, paddingHorizontal: 10 },
  syncCard: { borderRadius: 17, padding: 20, alignItems: 'center', gap: 7 }, centerText: { fontSize: 12, textAlign: 'center' },
  message: { borderRadius: 13, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 7 }, messageText: { fontSize: 12, flex: 1 },
});
