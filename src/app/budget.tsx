import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BudgetProgressCard from '@/components/budget-progress-card';
import { DateField } from '@/components/date-field';
import { ScreenNav } from '@/components/screen-nav';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { getTransactions } from '@/database/transactionQueries';
import { deleteBudget, getBudgets, saveBudget } from '@/database/walletQueries';
import { Budget } from '@/models/Budget';
import { Transaction } from '@/models/Transaction';
import { auth } from '@/services/firebase';
import { createId } from '@/utils/id';

const categories = ['Food', 'Transport', 'Bills', 'Shopping', 'Entertainment', 'Health'];

export default function BudgetScreen() {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [month, setMonth] = useState(currentMonth);
  const [category, setCategory] = useState('Food');
  const [limit, setLimit] = useState('');
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState('');
  const userId = auth.currentUser?.uid ?? 'local-user';

  const load = useCallback(async () => {
    const [saved, tx] = await Promise.all([getBudgets(userId), getTransactions(userId)]);
    setBudgets(saved);
    setTransactions(tx);
  }, [userId]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function handleSave() {
    const amount = Number(limit);
    if (!month.match(/^\d{4}-\d{2}$/) || !Number.isFinite(amount) || amount <= 0) {
      setError('Use YYYY-MM for the month and enter a positive limit.');
      return;
    }
    const now = new Date().toISOString();
    const existing = budgets.find((item) => item.month === month && item.category === category);
    await saveBudget({
      id: existing?.id ?? createId(), userId, category, month, limitAmount: amount,
      spentAmount: 0, syncStatus: 'pending', createdAt: existing?.createdAt ?? now, updatedAt: now,
    });
    setLimit('');
    setError('');
    await load();
  }

  function spentFor(budget: Budget) {
    return transactions
      .filter((item) => item.type === 'expense' && item.category === budget.category && item.transactionDate.startsWith(budget.month))
      .reduce((sum, item) => sum + item.amount, 0);
  }

  return (
    <ThemedView style={styles.container}><SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="subtitle">Monthly budgets</ThemedText>
        <ThemedText themeColor="textSecondary">Set category limits and see progress from your local expenses.</ThemedText>
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText type="smallBold">Month (YYYY-MM)</ThemedText>
          <DateField value={month} onChange={setMonth} mode="month" placeholder="Select month" />
          <ThemedText type="smallBold">Category</ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <ThemedView style={styles.chips}>{categories.map((item) => (
              <Pressable key={item} onPress={() => setCategory(item)} style={[styles.chip, category === item && styles.chipActive]}>
                <ThemedText type="smallBold" style={category === item ? styles.white : undefined}>{item}</ThemedText>
              </Pressable>
            ))}</ThemedView>
          </ScrollView>
          <ThemedText type="smallBold">Limit (LKR)</ThemedText>
          <TextInput style={styles.input} value={limit} onChangeText={setLimit} keyboardType="decimal-pad" placeholder="25000" />
          {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
          <Pressable style={styles.primaryButton} onPress={handleSave}><ThemedText type="smallBold" style={styles.white}>Save budget</ThemedText></Pressable>
        </ThemedView>
        {budgets.length === 0 ? <ThemedView type="backgroundElement" style={styles.card}><ThemedText>No budgets yet.</ThemedText></ThemedView> :
          budgets.map((item) => <ThemedView key={item.id} style={styles.budgetItem}>
            <BudgetProgressCard title={`${item.category} · ${item.month}`} budget={item.limitAmount} spent={spentFor(item)} />
            <Pressable onPress={() => Alert.alert('Delete budget?', undefined, [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: async () => { await deleteBudget(item.id); await load(); } },
            ])}><ThemedText style={styles.delete}>Delete budget</ThemedText></Pressable>
          </ThemedView>)}
      </ScrollView>
      <ScreenNav />
    </SafeAreaView></ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: Spacing.four, paddingBottom: BottomTabInset + Spacing.three, maxWidth: MaxContentWidth, alignSelf: 'center', width: '100%' },
  content: { gap: Spacing.three, paddingVertical: Spacing.four },
  card: { borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.two },
  input: { borderWidth: 1, borderColor: '#FFC107', borderRadius: 12, padding: 12, backgroundColor: '#FFFFFF', color: '#212121' },
  chips: { flexDirection: 'row', gap: 8 },
  chip: { borderWidth: 1, borderColor: '#FFC107', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  chipActive: { backgroundColor: '#0F9D58', borderColor: '#0F9D58' },
  primaryButton: { backgroundColor: '#0F9D58', borderRadius: 14, padding: 14, alignItems: 'center' },
  white: { color: '#fff' },
  error: { color: '#D32F2F' },
  delete: { color: '#D32F2F', textAlign: 'right', paddingRight: 8 },
  budgetItem: { gap: 6 },
});
