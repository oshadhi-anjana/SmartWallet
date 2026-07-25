import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { getTransactions } from '@/database/transactionQueries';
import { Transaction } from '@/models/Transaction';
import { auth } from '@/services/firebase';

export default function AnalyticsScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useMemo(() => {
    async function loadTransactions() {
      const userId = auth.currentUser?.uid ?? 'local-user';
      const result = await getTransactions(userId);
      setTransactions(result);
    }

    loadTransactions();
  }, []);

  const analytics = useMemo(() => {
    const expenseByCategory = transactions
      .filter((item) => item.type === 'expense')
      .reduce<Record<string, number>>((result, item) => {
        result[item.category] = (result[item.category] ?? 0) + item.amount;
        return result;
      }, {});

    const totalIncome = transactions
      .filter((item) => item.type === 'income')
      .reduce((sum, item) => sum + item.amount, 0);
    const totalExpense = transactions
      .filter((item) => item.type === 'expense')
      .reduce((sum, item) => sum + item.amount, 0);

    const highestSpendingCategory = Object.entries(expenseByCategory).sort((a, b) => b[1] - a[1])[0];

    return {
      expenseByCategory,
      totalIncome,
      totalExpense,
      highestSpendingCategory,
    };
  }, [transactions]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText type="subtitle">Analytics</ThemedText>
          <ThemedText themeColor="textSecondary">Insights derived from your local transaction history.</ThemedText>

          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold">Income vs expense</ThemedText>
            <ThemedText themeColor="textSecondary">Income: LKR {analytics.totalIncome.toFixed(2)}</ThemedText>
            <ThemedText themeColor="textSecondary">Expense: LKR {analytics.totalExpense.toFixed(2)}</ThemedText>
          </ThemedView>

          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold">Expense by category</ThemedText>
            {Object.entries(analytics.expenseByCategory).length === 0 ? (
              <ThemedText themeColor="textSecondary">No expense data yet.</ThemedText>
            ) : (
              Object.entries(analytics.expenseByCategory).map(([category, value]) => (
                <ThemedText key={category} themeColor="textSecondary">{category}: LKR {value.toFixed(2)}</ThemedText>
              ))
            )}
          </ThemedView>

          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold">Highest spending category</ThemedText>
            {analytics.highestSpendingCategory ? (
              <ThemedText themeColor="textSecondary">{analytics.highestSpendingCategory[0]} • LKR {analytics.highestSpendingCategory[1].toFixed(2)}</ThemedText>
            ) : (
              <ThemedText themeColor="textSecondary">No spending yet.</ThemedText>
            )}
          </ThemedView>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.three,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  content: { gap: Spacing.three, paddingVertical: Spacing.four },
  card: { borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.two },
});
