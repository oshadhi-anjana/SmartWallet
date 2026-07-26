import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenNav } from '@/components/screen-nav';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { getTransactions } from '@/database/transactionQueries';
import { Transaction } from '@/models/Transaction';
import { auth } from '@/services/firebase';

const colors = ['#F57C00', '#0F9D58', '#FFC107', '#D32F2F', '#2485A8'];
const money = (value: number) => `LKR ${value.toLocaleString('en-LK')}`;

export default function AnalyticsScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [period, setPeriod] = useState<'Week' | 'Month' | 'Year'>('Month');
  useFocusEffect(useCallback(() => {
    getTransactions(auth.currentUser?.uid ?? 'local-user').then(setTransactions);
  }, []));

  const data = useMemo(() => {
    const categories = transactions.filter((item) => item.type === 'expense').reduce<Record<string, number>>((result, item) => {
      result[item.category] = (result[item.category] ?? 0) + item.amount;
      return result;
    }, {});
    const income = transactions.filter((item) => item.type === 'income').reduce((sum, item) => sum + item.amount, 0);
    const expense = Object.values(categories).reduce((sum, value) => sum + value, 0);
    return { income, expense, savings: income - expense, categories: Object.entries(categories).sort((a, b) => b[1] - a[1]) };
  }, [transactions]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.titleRow}>
            <ThemedText type="subtitle" style={styles.title}>Reports</ThemedText>
            <View style={styles.calendar}><Ionicons name="calendar-outline" size={21} color="#212121" /></View>
          </View>
          <View style={styles.periods}>
            {(['Week', 'Month', 'Year'] as const).map((item) => (
              <Pressable key={item} onPress={() => setPeriod(item)} style={[styles.period, period === item && styles.periodActive]}>
                <ThemedText type="smallBold" style={period === item ? styles.white : styles.periodText}>{item}</ThemedText>
              </Pressable>
            ))}
          </View>
          <View style={styles.monthRow}><Ionicons name="chevron-back" size={20} color="#68756F" /><ThemedText type="smallBold">Current {period}</ThemedText><Ionicons name="chevron-forward" size={20} color="#68756F" /></View>
          <View style={styles.metrics}>
            <Metric label="Income" value={data.income} color="#2E7D32" />
            <Metric label="Expense" value={data.expense} color="#D32F2F" />
            <Metric label="Savings" value={data.savings} color="#F57C00" />
          </View>
          <View style={styles.card}>
            <ThemedText type="smallBold" style={styles.cardTitle}>Expenses by category</ThemedText>
            {data.categories.length === 0 ? (
              <View style={styles.empty}><Ionicons name="pie-chart-outline" size={36} color="#0F9D58" /><ThemedText themeColor="textSecondary">Add expenses to see your report.</ThemedText></View>
            ) : data.categories.map(([category, value], index) => {
              const percent = data.expense ? (value / data.expense) * 100 : 0;
              return <View key={category} style={styles.category}>
                <View style={styles.categoryTop}>
                  <View style={styles.categoryName}><View style={[styles.dot, { backgroundColor: colors[index % colors.length] }]} /><ThemedText type="smallBold">{category}</ThemedText></View>
                  <View style={styles.categoryAmount}><ThemedText type="smallBold">{percent.toFixed(0)}%</ThemedText><ThemedText themeColor="textSecondary" style={styles.amount}>{money(value)}</ThemedText></View>
                </View>
                <View style={styles.track}><View style={[styles.fill, { width: `${percent}%`, backgroundColor: colors[index % colors.length] }]} /></View>
              </View>;
            })}
          </View>
        </ScrollView>
        <ScreenNav />
      </SafeAreaView>
    </ThemedView>
  );
}

function Metric({ label, value, color }: { label: string; value: number; color: string }) {
  return <View style={styles.metric}><ThemedText themeColor="textSecondary" style={styles.metricLabel}>{label}</ThemedText><ThemedText type="smallBold" style={{ color }}>{money(value)}</ThemedText></View>;
}

const styles = StyleSheet.create({
  container: { flex: 1 }, safeArea: { flex: 1, maxWidth: MaxContentWidth, alignSelf: 'center', width: '100%' },
  content: { paddingHorizontal: Spacing.three, paddingTop: Spacing.three, paddingBottom: BottomTabInset + 105, gap: 14 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, title: { fontSize: 27, lineHeight: 35 },
  calendar: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#ECE9DF' },
  periods: { flexDirection: 'row', padding: 4, borderRadius: 15, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#ECE9DF' },
  period: { flex: 1, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }, periodActive: { backgroundColor: '#0F9D58' }, white: { color: '#FFFFFF' }, periodText: { color: '#68756F' },
  monthRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 5 },
  metrics: { flexDirection: 'row', gap: 8 }, metric: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 12, gap: 5, borderWidth: 1, borderColor: '#ECE9DF' },
  metricLabel: { fontSize: 11 }, card: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, gap: 17, borderWidth: 1, borderColor: '#ECE9DF' }, cardTitle: { fontSize: 16 },
  category: { gap: 7 }, categoryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, categoryName: { flexDirection: 'row', alignItems: 'center', gap: 8 }, categoryAmount: { alignItems: 'flex-end' },
  dot: { width: 9, height: 9, borderRadius: 5 }, amount: { fontSize: 10, lineHeight: 14 }, track: { height: 8, borderRadius: 8, backgroundColor: '#F0EEE8', overflow: 'hidden' }, fill: { height: '100%', borderRadius: 8 },
  empty: { alignItems: 'center', padding: 28, gap: 10 },
});
