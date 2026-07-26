import { useNetInfo } from '@react-native-community/netinfo';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import { ScreenNav } from '@/components/screen-nav';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { getPendingTransactions, getTransactions } from '@/database/transactionQueries';
import { Transaction } from '@/models/Transaction';
import { auth } from '@/services/firebase';

export default function DashboardScreen() {
  const router = useRouter();
  const netInfo = useNetInfo();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pendingCount, setPendingCount] = useState(0);

  useFocusEffect(useCallback(() => {
    async function loadData() {
      const userId = auth.currentUser?.uid ?? 'local-user';
      const [localTransactions, pendingTransactions] = await Promise.all([
        getTransactions(userId),
        getPendingTransactions(),
      ]);

      setTransactions(localTransactions);
      setPendingCount(pendingTransactions.length);
    }

    loadData();
  }, []));

  const summary = useMemo(() => {
    const totalIncome = transactions
      .filter((item) => item.type === 'income')
      .reduce((sum, item) => sum + item.amount, 0);
    const totalExpense = transactions
      .filter((item) => item.type === 'expense')
      .reduce((sum, item) => sum + item.amount, 0);
    const balance = totalIncome - totalExpense;
    const monthlyBudget = 2000;
    const budgetProgress = monthlyBudget > 0 ? Math.min(100, (totalExpense / monthlyBudget) * 100) : 0;

    const categoryBreakdown = transactions
      .filter((item) => item.type === 'expense')
      .reduce<Record<string, number>>((group, item) => {
        group[item.category] = (group[item.category] || 0) + item.amount;
        return group;
      }, {});

    return {
      totalIncome,
      totalExpense,
      balance,
      budgetProgress,
      categoryBreakdown,
      recentTransactions: transactions.slice(0, 4),
    };
  }, [transactions]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <ScreenNav />
          <ThemedText type="subtitle">Dashboard</ThemedText>
          <ThemedText themeColor="textSecondary">Your offline-first money snapshot.</ThemedText>

          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold">Current balance</ThemedText>
            <ThemedText type="title">LKR {summary.balance.toFixed(2)}</ThemedText>
            <ThemedText themeColor="textSecondary">
              Income ${summary.totalIncome.toFixed(2)} • Expenses ${summary.totalExpense.toFixed(2)}
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.grid}>
            <ThemedView type="backgroundElement" style={styles.metricCard}>
              <ThemedText type="smallBold">Income</ThemedText>
              <ThemedText type="subtitle">LKR {summary.totalIncome.toFixed(2)}</ThemedText>
            </ThemedView>
            <ThemedView type="backgroundElement" style={styles.metricCard}>
              <ThemedText type="smallBold">Expenses</ThemedText>
              <ThemedText type="subtitle">LKR {summary.totalExpense.toFixed(2)}</ThemedText>
            </ThemedView>
          </ThemedView>

          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold">Monthly budget progress</ThemedText>
            <ThemedText themeColor="textSecondary">{summary.budgetProgress.toFixed(0)}% of your monthly budget used</ThemedText>
            <ThemedText type="smallBold">LKR {summary.totalExpense.toFixed(2)} / LKR 2000</ThemedText>
          </ThemedView>

          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold">Recent transactions</ThemedText>
            {summary.recentTransactions.length === 0 ? (
              <ThemedText themeColor="textSecondary">No local transactions yet.</ThemedText>
            ) : (
              summary.recentTransactions.map((item) => (
                <ThemedView key={item.id} style={styles.rowItem}>
                  <ThemedText type="smallBold">{item.category}</ThemedText>
                  <ThemedText themeColor="textSecondary">{item.transactionDate}</ThemedText>
                </ThemedView>
              ))
            )}
          </ThemedView>

          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold">Spending by category</ThemedText>
            {Object.entries(summary.categoryBreakdown).length === 0 ? (
              <ThemedText themeColor="textSecondary">No expense categories yet.</ThemedText>
            ) : (
              Object.entries(summary.categoryBreakdown).map(([category, value]) => (
                <ThemedView key={category} style={styles.rowItem}>
                  <ThemedText>{category}</ThemedText>
                  <ThemedText themeColor="textSecondary">LKR {value.toFixed(2)}</ThemedText>
                </ThemedView>
              ))
            )}
          </ThemedView>

          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold">Connection status</ThemedText>
            <ThemedText themeColor="textSecondary">{netInfo.isConnected ? 'Online' : 'Offline'}</ThemedText>
            <ThemedText type="smallBold">Pending sync: {pendingCount}</ThemedText>
          </ThemedView>

          <Pressable style={styles.primaryButton} onPress={() => router.push('/add-transaction' as never)}>
            <ThemedText type="smallBold" style={styles.buttonText}>Add transaction</ThemedText>
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
    gap: Spacing.three,
    paddingVertical: Spacing.four,
  },
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  grid: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  metricCard: {
    flex: 1,
    borderRadius: Spacing.two,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  rowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Spacing.one,
  },
  primaryButton: {
    backgroundColor: '#0F9D58',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: 999,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
  },
});
