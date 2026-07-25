import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { getTransactions } from '@/database/transactionQueries';
import { Transaction } from '@/models/Transaction';
import { auth } from '@/services/firebase';

export default function TransactionsScreen() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    async function loadTransactions() {
      const userId = auth.currentUser?.uid ?? 'local-user';
      const result = await getTransactions(userId);
      setTransactions(result);
    }

    loadTransactions();
  }, []);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText type="subtitle">Transactions</ThemedText>
          <ThemedText themeColor="textSecondary">Recent activity from your local wallet.</ThemedText>

          {transactions.length === 0 ? (
            <ThemedView type="backgroundElement" style={styles.emptyState}>
              <ThemedText>No transactions yet.</ThemedText>
              <ThemedText themeColor="textSecondary">Add one to start tracking your money.</ThemedText>
            </ThemedView>
          ) : (
            transactions.map((item) => (
              <ThemedView key={item.id} type="backgroundElement" style={styles.item}>
                <ThemedView style={styles.itemHeader}>
                  <ThemedText type="smallBold">{item.category}</ThemedText>
                  <ThemedText type="smallBold" style={item.type === 'income' ? styles.incomeText : styles.expenseText}>
                    {item.type === 'income' ? '+' : '-'}${item.amount.toFixed(2)}
                  </ThemedText>
                </ThemedView>
                <ThemedText themeColor="textSecondary">
                  {item.description || 'No description'} • {item.transactionDate}
                </ThemedText>
              </ThemedView>
            ))
          )}

          <Pressable style={styles.primaryButton} onPress={() => router.push('/add-transaction' as never)}>
            <ThemedText type="smallBold" style={styles.buttonText}>
              Add a transaction
            </ThemedText>
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
    gap: Spacing.two,
    paddingVertical: Spacing.four,
  },
  emptyState: {
    borderRadius: Spacing.two,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  item: {
    borderRadius: Spacing.two,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  incomeText: {
    color: '#1e8f57',
  },
  expenseText: {
    color: '#d14343',
  },
  primaryButton: {
    backgroundColor: '#3c87f7',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: 999,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
  },
});
