import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenNav } from '@/components/screen-nav';
import { useAppTheme } from '@/components/app-theme-provider';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { getTransactions } from '@/database/transactionQueries';
import { Transaction } from '@/models/Transaction';
import { auth } from '@/services/firebase';
import { refreshWalletData } from '@/services/syncService';

const colors = ['#F57C00', '#0F9D58', '#FFC107', '#D32F2F', '#2485A8'];
export default function AnalyticsScreen() {
  const { formatCurrency: money, theme } = useAppTheme();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [period, setPeriod] = useState<'Week' | 'Month' | 'Year'>('Month');
  const [periodOffset, setPeriodOffset] = useState(0);
  const [chartWidth, setChartWidth] = useState(320);
  const [reportDate, setReportDate] = useState(() => formatDate(getSriLankaToday()));
  const [showDatePicker, setShowDatePicker] = useState(false);
  useFocusEffect(useCallback(() => {
    const userId = auth.currentUser?.uid ?? 'local-user';
    refreshWalletData(userId)
      .then(() => getTransactions(userId))
      .then(setTransactions)
      .catch((error) => console.error('Unable to load analytics data', error));
  }, []));

  const selectedPeriod = useMemo(
    () => getPeriodRange(period, periodOffset, reportDate),
    [period, periodOffset, reportDate]
  );

  function handleDateChange(event: DateTimePickerEvent, selectedDate?: Date) {
    if (Platform.OS !== 'ios') setShowDatePicker(false);
    if (event.type === 'dismissed' || !selectedDate) return;
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    setReportDate(`${year}-${month}-${day}`);
    setPeriodOffset(0);
  }

  const data = useMemo(() => {
    const periodTransactions = transactions.filter((item) =>
      item.transactionDate >= selectedPeriod.start && item.transactionDate <= selectedPeriod.end
    );
    const categories = periodTransactions.filter((item) => item.type === 'expense').reduce<Record<string, number>>((result, item) => {
      result[item.category] = (result[item.category] ?? 0) + item.amount;
      return result;
    }, {});
    const income = periodTransactions.filter((item) => item.type === 'income').reduce((sum, item) => sum + item.amount, 0);
    const expense = Object.values(categories).reduce((sum, value) => sum + value, 0);
    return { income, expense, savings: income - expense, categories: Object.entries(categories).sort((a, b) => b[1] - a[1]) };
  }, [selectedPeriod, transactions]);

  const pieData = [
    { name: 'Income', amount: data.income, color: theme.success },
    { name: 'Expenses', amount: data.expense, color: theme.expense },
    { name: 'Savings', amount: Math.max(data.savings, 0), color: theme.accent },
  ].map((item) => ({
    ...item,
    legendFontColor: '#212121',
    legendFontSize: 12,
  }));
  const hasReportData = data.income > 0 || data.expense > 0;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.titleRow}>
            <ThemedText type="subtitle" style={styles.title}>Analytics</ThemedText>
            <Pressable
              style={styles.calendar}
              onPress={() => setShowDatePicker(true)}
              accessibilityRole="button"
              accessibilityLabel="Select report date">
              <Ionicons name="calendar-outline" size={21} color="#212121" />
            </Pressable>
          </View>
          {showDatePicker ? (
            <View style={[styles.pickerContainer, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              <DateTimePicker
                value={new Date(`${reportDate}T12:00:00`)}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                onChange={handleDateChange}
              />
              {Platform.OS === 'ios' ? (
                <Pressable style={styles.pickerDone} onPress={() => setShowDatePicker(false)}>
                  <ThemedText type="smallBold" style={[styles.pickerDoneText, { color: theme.primary }]}>Done</ThemedText>
                </Pressable>
              ) : null}
            </View>
          ) : null}
          <View style={[styles.periods, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            {(['Week', 'Month', 'Year'] as const).map((item) => (
              <Pressable key={item} onPress={() => { setPeriod(item); setPeriodOffset(0); }} style={[styles.period, period === item && styles.periodActive, period === item && { backgroundColor: theme.primary }]}>
                <ThemedText type="smallBold" style={period === item ? styles.white : styles.periodText}>{item}</ThemedText>
              </Pressable>
            ))}
          </View>
          <View style={styles.monthRow}>
            <Pressable style={styles.periodArrow} onPress={() => setPeriodOffset((value) => value - 1)} accessibilityLabel={`Previous ${period}`}>
              <Ionicons name="chevron-back" size={20} color="#68756F" />
            </Pressable>
            <ThemedText type="smallBold">{selectedPeriod.label}</ThemedText>
            <Pressable style={styles.periodArrow} onPress={() => setPeriodOffset((value) => value + 1)} accessibilityLabel={`Next ${period}`}>
              <Ionicons name="chevron-forward" size={20} color="#68756F" />
            </Pressable>
          </View>
          <View style={styles.metrics}>
            <Metric label="Income" value={data.income} color={theme.success} />
            <Metric label="Expense" value={data.expense} color={theme.expense} />
            <Metric label="Savings" value={data.savings} color={theme.accent} />
          </View>
          <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]} onLayout={(event) => setChartWidth(Math.max(280, event.nativeEvent.layout.width - 32))}>
            <ThemedText type="smallBold" style={styles.cardTitle}>Income, expenses & savings</ThemedText>
            {!hasReportData ? (
              <View style={styles.empty}><Ionicons name="pie-chart-outline" size={36} color={theme.primary} /><ThemedText themeColor="textSecondary">No transactions recorded for this {period.toLowerCase()}.</ThemedText></View>
            ) : <>
              <PieChart
                data={pieData}
                width={chartWidth}
                height={190}
                accessor="amount"
                backgroundColor="transparent"
                paddingLeft="8"
                chartConfig={{ color: () => theme.primary }}
                absolute
              />
              {data.categories.length > 0 ? <ThemedText type="smallBold" style={styles.breakdownTitle}>Expense categories</ThemedText> : null}
              {data.categories.map(([category, value], index) => {
              const percent = data.expense ? (value / data.expense) * 100 : 0;
              return <View key={category} style={styles.category}>
                <View style={styles.categoryTop}>
                  <View style={styles.categoryName}><View style={[styles.dot, { backgroundColor: colors[index % colors.length] }]} /><ThemedText type="smallBold">{category}</ThemedText></View>
                  <View style={styles.categoryAmount}><ThemedText type="smallBold">{percent.toFixed(0)}%</ThemedText><ThemedText themeColor="textSecondary" style={styles.amount}>{money(value)}</ThemedText></View>
                </View>
                <View style={styles.track}><View style={[styles.fill, { width: `${percent}%`, backgroundColor: colors[index % colors.length] }]} /></View>
              </View>;
              })}
            </>}
          </View>
        </ScrollView>
        <ScreenNav />
      </SafeAreaView>
    </ThemedView>
  );
}

function getSriLankaToday() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Colombo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const value = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value);
  return new Date(Date.UTC(value('year'), value('month') - 1, value('day')));
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getPeriodRange(period: 'Week' | 'Month' | 'Year', offset: number, reportDate: string) {
  const [year, month, day] = reportDate.split('-').map(Number);
  const today = new Date(Date.UTC(year, month - 1, day));
  let start: Date;
  let end: Date;

  if (period === 'Week') {
    const mondayOffset = (today.getUTCDay() + 6) % 7;
    start = new Date(today);
    start.setUTCDate(today.getUTCDate() - mondayOffset + offset * 7);
    end = new Date(start);
    end.setUTCDate(start.getUTCDate() + 6);
  } else if (period === 'Month') {
    start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + offset, 1));
    end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0));
  } else {
    start = new Date(Date.UTC(today.getUTCFullYear() + offset, 0, 1));
    end = new Date(Date.UTC(start.getUTCFullYear(), 11, 31));
  }

  const label = period === 'Week'
    ? `${start.toLocaleDateString('en-LK', { day: 'numeric', month: 'short', timeZone: 'UTC' })} – ${end.toLocaleDateString('en-LK', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })}`
    : period === 'Month'
      ? start.toLocaleDateString('en-LK', { month: 'long', year: 'numeric', timeZone: 'UTC' })
      : String(start.getUTCFullYear());

  return { start: formatDate(start), end: formatDate(end), label };
}

function Metric({ label, value, color }: { label: string; value: number; color: string }) {
  const { formatCurrency: money, theme } = useAppTheme();
  return <View style={[styles.metric, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}><ThemedText themeColor="textSecondary" style={styles.metricLabel}>{label}</ThemedText><ThemedText type="smallBold" style={{ color }}>{money(value)}</ThemedText></View>;
}

const styles = StyleSheet.create({
  container: { flex: 1 }, safeArea: { flex: 1, maxWidth: MaxContentWidth, alignSelf: 'center', width: '100%' },
  content: { paddingHorizontal: Spacing.three, paddingTop: Spacing.three, paddingBottom: BottomTabInset + 105, gap: 14 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, title: { fontSize: 27, lineHeight: 35 },
  calendar: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#ECE9DF' },
  pickerContainer: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 8, borderWidth: 1, borderColor: '#ECE9DF' },
  pickerDone: { alignSelf: 'flex-end', paddingHorizontal: 14, paddingVertical: 8 }, pickerDoneText: { color: '#0F9D58' },
  periods: { flexDirection: 'row', padding: 4, borderRadius: 15, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#ECE9DF' },
  period: { flex: 1, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }, periodActive: { backgroundColor: '#0F9D58' }, white: { color: '#FFFFFF' }, periodText: { color: '#68756F' },
  monthRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 5 }, periodArrow: { width: 40, height: 36, alignItems: 'center', justifyContent: 'center' },
  metrics: { flexDirection: 'row', gap: 8 }, metric: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 12, gap: 5, borderWidth: 1, borderColor: '#ECE9DF' },
  metricLabel: { fontSize: 11 }, card: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, gap: 17, borderWidth: 1, borderColor: '#ECE9DF' }, cardTitle: { fontSize: 16 },
  breakdownTitle: { fontSize: 14, marginTop: 2 },
  category: { gap: 7 }, categoryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, categoryName: { flexDirection: 'row', alignItems: 'center', gap: 8 }, categoryAmount: { alignItems: 'flex-end' },
  dot: { width: 9, height: 9, borderRadius: 5 }, amount: { fontSize: 10, lineHeight: 14 }, track: { height: 8, borderRadius: 8, backgroundColor: '#F0EEE8', overflow: 'hidden' }, fill: { height: '100%', borderRadius: 8 },
  empty: { alignItems: 'center', padding: 28, gap: 10 },
});
