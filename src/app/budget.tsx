import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BudgetProgressCard from '@/components/budget-progress-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { getTransactions } from '@/database/transactionQueries';
import { Transaction } from '@/models/Transaction';
import { auth } from '@/services/firebase';

const monthOptions = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function BudgetScreen() {
  const router = useRouter();
  const [month, setMonth] = useState('July');
  const [category, setCategory] = useState('Food');
  const [limit, setLimit] = useState('500');
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useMemo(() => {
    async function loadTransactions() {
      const userId = auth.currentUser?.uid ?? 'local-user';
      const result = await getTransactions(userId);
      setTransactions(result);
    }

    loadTransactions();
  }, []);

  const spentAmount = useMemo(() => {
    const parsedLimit = Number(limit) || 0;
    const budgetTransactions = transactions.filter(
      (transaction) => transaction.type === 'expense' && transaction.category === category
    );

    const spent = budgetTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);

    return { spent, remaining: Math.max(parsedLimit - spent, 0), exceeded: spent > parsedLimit };
  }, [category, limit, transactions]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText type="subtitle">Budget</ThemedText>
          <ThemedText themeColor="textSecondary">Create budgets and monitor your spending.</ThemedText>

          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold">Month</ThemedText>
            <TextInput style={styles.input} value={month} onChangeText={setMonth} placeholder="Month" />

            <ThemedText type="smallBold">Category</ThemedText>
            <TextInput style={styles.input} value={category} onChangeText={setCategory} placeholder="Category" />

            <ThemedText type="smallBold">Budget limit</ThemedText>
            <TextInput style={styles.input} value={limit} onChangeText={setLimit} keyboardType="decimal-pad" placeholder="500" />

            <Pressable style={styles.primaryButton} onPress={() => router.push('/add-transaction' as never)}>
              <ThemedText type="smallBold" style={styles.buttonText}>Save budget</ThemedText>
            </Pressable>
          </ThemedView>

          <BudgetProgressCard
            title={`${category} • ${month}`}
            budget={Number(limit) || 0}
            spent={spentAmount.spent}
            onBudgetExceeded={() => undefined}
          />

          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold">Summary</ThemedText>
            <ThemedText themeColor="textSecondary">Spent: LKR {spentAmount.spent.toFixed(2)}</ThemedText>
            <ThemedText themeColor="textSecondary">Remaining: LKR {spentAmount.remaining.toFixed(2)}</ThemedText>
            {spentAmount.exceeded ? <ThemedText style={styles.warning}>Budget exceeded</ThemedText> : null}
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
  input: {
    borderWidth: 1,
    borderColor: '#d0d7de',
    borderRadius: 10,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    backgroundColor: '#ffffff',
  },
  primaryButton: {
    backgroundColor: '#3c87f7',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: 999,
    alignItems: 'center',
  },
  buttonText: { color: '#ffffff' },
  warning: { color: '#b91c1c', fontWeight: '600' },
});
