import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenNav } from '@/components/screen-nav';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { getTransactions } from '@/database/transactionQueries';
import { Transaction } from '@/models/Transaction';
import { getCurrentUserName } from '@/services/authService';
import { auth } from '@/services/firebase';

const currency = (value: number) => `LKR ${value.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function DashboardScreen() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [greeting, setGreeting] = useState(getSriLankaGreeting);
  const [userName, setUserName] = useState(auth.currentUser?.displayName ?? '');
  const [notificationOpen, setNotificationOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setGreeting(getSriLankaGreeting()), 60_000);
    return () => clearInterval(timer);
  }, []);

  useFocusEffect(useCallback(() => {
    async function load() {
      try {
        const userId = auth.currentUser?.uid ?? 'local-user';
        const [items, name] = await Promise.all([
          getTransactions(userId),
          getCurrentUserName(),
        ]);
        setTransactions(items);
        setUserName(name);
      } catch (error) {
        console.error('Unable to load the dashboard.', error);
      }
    }
    load().catch(() => undefined);
  }, []));

  const summary = useMemo(() => {
    const income = transactions.filter((item) => item.type === 'income').reduce((sum, item) => sum + item.amount, 0);
    const expense = transactions.filter((item) => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0);
    const latestIncome = transactions.find((item) => item.type === 'income');
    const latestExpense = transactions.find((item) => item.type === 'expense');
    const recent = [latestIncome, latestExpense]
      .filter((item): item is Transaction => Boolean(item))
      .sort((a, b) => {
        const aTime = new Date(`${a.transactionDate}T00:00:00`).getTime();
        const bTime = new Date(`${b.transactionDate}T00:00:00`).getTime();
        return bTime - aTime || b.createdAt.localeCompare(a.createdAt);
      });

    return { income, expense, balance: income - expense, recent };
  }, [transactions]);

  const monthlySummary = useMemo(() => {
    const currentMonth = getSriLankaMonth();
    const currentTransactions = transactions.filter((item) => item.transactionDate.startsWith(currentMonth));
    const income = currentTransactions
      .filter((item) => item.type === 'income')
      .reduce((sum, item) => sum + item.amount, 0);
    const expense = currentTransactions
      .filter((item) => item.type === 'expense')
      .reduce((sum, item) => sum + item.amount, 0);
    return { income, expense, overspent: expense > income };
  }, [transactions]);

  const firstName = userName.split(' ')[0] || 'there';
  const quickActions = [
    ['Add transaction', 'add-circle-outline', '/add-transaction', '#E3F4E7', '#0F9D58'],
    ['Budgets', 'calendar-outline', '/budget', '#FFF0DC', '#F57C00'],
    ['Savings', 'shield-checkmark-outline', '/savings', '#FFF4CD', '#B77900'],
    ['Spending report', 'pie-chart-outline', '/analytics', '#FFE6DF', '#D32F2F'],
  ] as const;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <View style={styles.heroTop}>
              <View>
                <ThemedText style={styles.greeting}>{greeting},</ThemedText>
                <ThemedText type="subtitle" style={styles.name}>{firstName} 👋</ThemedText>
              </View>
              <Pressable
                style={styles.notification}
                onPress={() => setNotificationOpen(true)}
                accessibilityRole="button"
                accessibilityLabel={monthlySummary.overspent ? 'Monthly spending alert' : 'Notifications'}>
                <Ionicons name="notifications-outline" size={22} color="#FFFFFF" />
                {monthlySummary.overspent ? <View style={styles.notificationDot} /> : null}
              </Pressable>
            </View>
            <ThemedText style={styles.balanceLabel}>Total balance</ThemedText>
            <ThemedText style={styles.balance}>{currency(summary.balance)}</ThemedText>
            <View style={styles.trendRow}>
              <Ionicons name="trending-up" size={15} color="#FFFFFF" />
              <ThemedText style={styles.trendText}>Your offline-first money snapshot</ThemedText>
            </View>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryItem}>
              <ThemedText style={styles.summaryLabel}>Income</ThemedText>
              <ThemedText style={styles.income}>{currency(summary.income)}</ThemedText>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryItem}>
              <ThemedText style={styles.summaryLabel}>Expenses</ThemedText>
              <ThemedText style={styles.expense}>{currency(summary.expense)}</ThemedText>
            </View>
          </View>

          <SectionTitle title="Quick actions" />
          <View style={styles.quickRow}>
            {quickActions.map(([label, icon, href, background, color]) => (
              <Pressable key={label} style={styles.quickItem} onPress={() => router.push(href as never)}>
                <View style={[styles.quickIcon, { backgroundColor: background }]}>
                  <Ionicons name={icon} size={23} color={color} />
                </View>
                <ThemedText style={styles.quickLabel}>{label}</ThemedText>
              </Pressable>
            ))}
          </View>

          <SectionTitle title="Recent transactions" action="See all" onPress={() => router.push('/transactions' as never)} />
          <View style={styles.listCard}>
            {summary.recent.length === 0 ? (
              <View style={styles.empty}>
                <Ionicons name="receipt-outline" size={30} color="#0F9D58" />
                <ThemedText type="smallBold">No transactions yet</ThemedText>
                <ThemedText themeColor="textSecondary" style={styles.center}>Tap the plus button to add your first one.</ThemedText>
              </View>
            ) : summary.recent.map((item, index) => (
              <TransactionRow key={item.id} item={item} last={index === summary.recent.length - 1} />
            ))}
          </View>

        </ScrollView>
        <ScreenNav />
        <Modal
          visible={notificationOpen}
          transparent
          animationType="fade"
          statusBarTranslucent
          onRequestClose={() => setNotificationOpen(false)}>
          <Pressable style={styles.modalBackdrop} onPress={() => setNotificationOpen(false)}>
            <Pressable style={styles.notificationCard} onPress={(event) => event.stopPropagation()}>
              <View style={styles.notificationHeader}>
                <View style={[styles.alertIcon, monthlySummary.overspent ? styles.warningIcon : styles.safeIcon]}>
                  <Ionicons
                    name={monthlySummary.overspent ? 'warning-outline' : 'checkmark-circle-outline'}
                    size={26}
                    color={monthlySummary.overspent ? '#D32F2F' : '#2E7D32'}
                  />
                </View>
                <View style={styles.notificationTitleCopy}>
                  <ThemedText type="smallBold" style={styles.notificationTitle}>
                    {monthlySummary.overspent ? 'Spending needs attention' : 'You’re on track'}
                  </ThemedText>
                  <ThemedText themeColor="textSecondary" style={styles.notificationSubtitle}>This month’s money summary</ThemedText>
                </View>
                <Pressable style={styles.modalClose} onPress={() => setNotificationOpen(false)} accessibilityLabel="Close notification">
                  <Ionicons name="close" size={21} color="#68756F" />
                </Pressable>
              </View>

              <ThemedText style={styles.notificationMessage}>
                {monthlySummary.overspent
                  ? `You spent ${currency(monthlySummary.expense - monthlySummary.income)} more than you earned. Review your spending to get back on track.`
                  : 'Your income is covering your expenses. Keep up the good work!'}
              </ThemedText>

              <View style={styles.notificationFigures}>
                <NotificationFigure label="Income" value={monthlySummary.income} color="#2E7D32" />
                <View style={styles.figureDivider} />
                <NotificationFigure label="Expenses" value={monthlySummary.expense} color="#D32F2F" />
              </View>

              <Pressable
                style={styles.viewReportButton}
                onPress={() => {
                  setNotificationOpen(false);
                  router.push('/analytics' as never);
                }}>
                <ThemedText type="smallBold" style={styles.viewReportText}>View spending report</ThemedText>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
      </SafeAreaView>
    </ThemedView>
  );
}

function getSriLankaGreeting() {
  try {
    const hour = Number(
      new Intl.DateTimeFormat('en-GB', {
        hour: '2-digit',
        hour12: false,
        timeZone: 'Asia/Colombo',
      }).format(new Date())
    ) % 24;

    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  } catch {
    // Sri Lanka Standard Time is UTC+05:30 and does not observe daylight saving.
    const now = new Date();
    const sriLankaHour = (now.getUTCHours() + 5 + Math.floor((now.getUTCMinutes() + 30) / 60)) % 24;
    if (sriLankaHour < 12) return 'Good Morning';
    if (sriLankaHour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }
}

function getSriLankaMonth() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Colombo',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(new Date());
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  return `${year}-${month}`;
}

function SectionTitle({ title, action, onPress }: { title: string; action?: string; onPress?: () => void }) {
  return <View style={styles.sectionTitle}>
    <ThemedText type="smallBold" style={styles.sectionHeading}>{title}</ThemedText>
    {action ? <Pressable onPress={onPress}><ThemedText style={styles.seeAll}>{action}</ThemedText></Pressable> : null}
  </View>;
}

function NotificationFigure({ label, value, color }: { label: string; value: number; color: string }) {
  return <View style={styles.figure}>
    <ThemedText themeColor="textSecondary" style={styles.figureLabel}>{label}</ThemedText>
    <ThemedText type="smallBold" style={[styles.figureValue, { color }]}>{currency(value)}</ThemedText>
  </View>;
}

function TransactionRow({ item, last }: { item: Transaction; last: boolean }) {
  const positive = item.type === 'income';
  return <View style={[styles.transactionRow, !last && styles.rowBorder]}>
    <View style={[styles.transactionIcon, { backgroundColor: positive ? '#E3F4E7' : '#FFE6DF' }]}>
      <Ionicons name={positive ? 'cash-outline' : 'cart-outline'} size={21} color={positive ? '#2E7D32' : '#F57C00'} />
    </View>
    <View style={styles.transactionCopy}>
      <ThemedText type="smallBold">{item.category}</ThemedText>
      <ThemedText themeColor="textSecondary" style={styles.transactionDate}>{item.transactionDate}</ThemedText>
    </View>
    <ThemedText type="smallBold" style={{ color: positive ? '#2E7D32' : '#D32F2F' }}>
      {positive ? '+' : '-'} {currency(item.amount)}
    </ThemedText>
  </View>;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, maxWidth: MaxContentWidth, alignSelf: 'center', width: '100%' },
  content: { paddingHorizontal: Spacing.three, paddingTop: 8, paddingBottom: BottomTabInset + 105, gap: 16 },
  hero: { backgroundColor: '#078447', borderRadius: 26, padding: 20, minHeight: 190, overflow: 'hidden' },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 23 },
  greeting: { color: '#FFFFFF', fontSize: 14 }, name: { color: '#FFFFFF', fontSize: 22, lineHeight: 29 },
  notification: { width: 42, height: 42, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },
  notificationDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#F57C00', position: 'absolute', right: 8, top: 7 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(16, 31, 24, 0.48)', justifyContent: 'center', paddingHorizontal: 24 },
  notificationCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, gap: 17, shadowColor: '#123D2B', shadowOpacity: 0.2, shadowRadius: 20, elevation: 12 },
  notificationHeader: { flexDirection: 'row', alignItems: 'center' },
  alertIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  warningIcon: { backgroundColor: '#FFE8E5' }, safeIcon: { backgroundColor: '#E3F4E7' },
  notificationTitleCopy: { flex: 1, paddingHorizontal: 11 }, notificationTitle: { fontSize: 16 },
  notificationSubtitle: { fontSize: 11, lineHeight: 16 }, modalClose: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  notificationMessage: { fontSize: 14, lineHeight: 21, color: '#44504A' },
  notificationFigures: { flexDirection: 'row', backgroundColor: '#F7F8FA', borderRadius: 16, padding: 14 },
  figure: { flex: 1 }, figureLabel: { fontSize: 11, marginBottom: 4 }, figureValue: { fontSize: 14 },
  figureDivider: { width: 1, backgroundColor: '#DDE5E1', marginHorizontal: 12 },
  viewReportButton: { minHeight: 48, borderRadius: 14, backgroundColor: '#0F9D58', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  viewReportText: { color: '#FFFFFF' },
  balanceLabel: { color: '#DDF5E8', fontSize: 13 }, balance: { color: '#FFFFFF', fontSize: 29, lineHeight: 38, fontWeight: '800', marginVertical: 2 },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 5 }, trendText: { color: '#E5F7ED', fontSize: 12 },
  summaryCard: { marginTop: -42, marginHorizontal: 12, backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, flexDirection: 'row', elevation: 5, shadowColor: '#123D2B', shadowOpacity: 0.12, shadowRadius: 10 },
  summaryItem: { flex: 1 }, summaryLabel: { fontSize: 12, color: '#68756F', marginBottom: 5 }, income: { color: '#2E7D32', fontWeight: '800', fontSize: 15 }, expense: { color: '#D32F2F', fontWeight: '800', fontSize: 15 },
  divider: { width: 1, backgroundColor: '#E9E7DF', marginHorizontal: 16 },
  sectionTitle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 3 },
  sectionHeading: { fontSize: 16 }, seeAll: { color: '#0F9D58', fontSize: 13, fontWeight: '700' },
  quickRow: { flexDirection: 'row', justifyContent: 'space-between' }, quickItem: { width: '23%', alignItems: 'center', gap: 7 },
  quickIcon: { width: 50, height: 50, borderRadius: 17, alignItems: 'center', justifyContent: 'center' }, quickLabel: { fontSize: 11, lineHeight: 14, textAlign: 'center' },
  listCard: { backgroundColor: '#FFFFFF', borderRadius: 20, paddingHorizontal: 14, borderWidth: 1, borderColor: '#ECE9DF' },
  transactionRow: { minHeight: 70, flexDirection: 'row', alignItems: 'center' }, rowBorder: { borderBottomWidth: 1, borderBottomColor: '#F0EEE8' },
  transactionIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  transactionCopy: { flex: 1, paddingHorizontal: 11 }, transactionDate: { fontSize: 11, lineHeight: 16 },
  empty: { alignItems: 'center', padding: 26, gap: 5 }, center: { textAlign: 'center', fontSize: 13 },
});
