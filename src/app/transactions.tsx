import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenNav } from '@/components/screen-nav';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { getTransactions } from '@/database/transactionQueries';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { Transaction } from '@/models/Transaction';
import { auth } from '@/services/firebase';
import { deleteTransactionEverywhere, syncPendingTransactions } from '@/services/syncService';

const money = (value: number) => `LKR ${value.toLocaleString('en-LK')}`;

export default function TransactionsScreen() {
  const router = useRouter();
  const isOnline = useNetworkStatus();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [isSyncing, setIsSyncing] = useState(false);

  const load = useCallback(async () => {
    setTransactions(await getTransactions(auth.currentUser?.uid ?? 'local-user'));
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const visible = filter === 'all' ? transactions : transactions.filter((item) => item.type === filter);

  async function retrySync() {
    setIsSyncing(true);
    try { await syncPendingTransactions(); await load(); } finally { setIsSyncing(false); }
  }

  function remove(transaction: Transaction) {
    Alert.alert('Delete transaction?', 'This permanently removes the transaction from your device and database.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTransactionEverywhere(transaction.userId, transaction.id);
            await load();
          } catch (error) {
            console.error('Failed to delete transaction', transaction.id, error);
            Alert.alert(
              'Unable to delete',
              'The transaction could not be removed from the database. Check your internet connection and try again.'
            );
          }
        },
      },
    ]);
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.titleRow}>
            <ThemedText type="subtitle" style={styles.title}>Transactions</ThemedText>
            <Pressable style={styles.search} accessibilityLabel="Search transactions"><Ionicons name="search-outline" size={22} color="#212121" /></Pressable>
          </View>
          <View style={styles.filters}>
            {(['all', 'income', 'expense'] as const).map((item) => (
              <Pressable key={item} onPress={() => setFilter(item)} style={[styles.filter, filter === item && styles.filterActive]}>
                <ThemedText type="smallBold" style={filter === item ? styles.filterActiveText : styles.filterText}>{item[0].toUpperCase() + item.slice(1)}</ThemedText>
              </Pressable>
            ))}
          </View>
          <View style={styles.dateHeading}>
            <ThemedText type="smallBold">Recent activity</ThemedText>
            <Pressable onPress={retrySync}><ThemedText style={styles.sync}>{isSyncing ? 'Syncing…' : isOnline ? 'Sync now' : 'Offline'}</ThemedText></Pressable>
          </View>

          {visible.length === 0 ? (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}><Ionicons name="receipt-outline" size={32} color="#0F9D58" /></View>
              <ThemedText type="smallBold">No transactions found</ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.emptyText}>Use the plus button to record income or an expense.</ThemedText>
            </View>
          ) : visible.map((item) => {
            const income = item.type === 'income';
            return (
              <Pressable key={item.id} style={styles.row} onPress={() => router.push({ pathname: '/add-transaction', params: { id: item.id } } as never)} onLongPress={() => remove(item)}>
                <View style={[styles.rowIcon, income ? styles.incomeIcon : styles.expenseIcon]}>
                  <Ionicons name={income ? 'cash-outline' : 'cart-outline'} size={21} color={income ? '#2E7D32' : '#F57C00'} />
                </View>
                <View style={styles.rowCopy}>
                  <ThemedText type="smallBold">{item.category}</ThemedText>
                  <ThemedText themeColor="textSecondary" style={styles.meta}>{item.description || item.transactionDate}</ThemedText>
                  <ThemedText style={styles.status}>{getStatus(item.syncStatus, isOnline)}</ThemedText>
                </View>
                <View style={styles.amountCopy}>
                  <ThemedText type="smallBold" style={{ color: income ? '#2E7D32' : '#D32F2F' }}>{income ? '+' : '-'} {money(item.amount)}</ThemedText>
                  <ThemedText themeColor="textSecondary" style={styles.meta}>{item.transactionDate}</ThemedText>
                </View>
              </Pressable>
            );
          })}
          <ThemedText themeColor="textSecondary" style={styles.hint}>Tap a transaction to edit. Hold it to delete.</ThemedText>
        </ScrollView>
        <ScreenNav />
      </SafeAreaView>
    </ThemedView>
  );
}

function getStatus(status: Transaction['syncStatus'], online: boolean) {
  if (!online) return 'Saved offline';
  if (status === 'synced') return 'Synced';
  if (status === 'failed') return 'Sync failed';
  return 'Pending sync';
}

const styles = StyleSheet.create({
  container: { flex: 1 }, safeArea: { flex: 1, maxWidth: MaxContentWidth, alignSelf: 'center', width: '100%' },
  content: { paddingHorizontal: Spacing.three, paddingTop: Spacing.three, paddingBottom: BottomTabInset + 105, gap: 11 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, title: { fontSize: 27, lineHeight: 35 },
  search: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#ECE9DF' },
  filters: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 15, padding: 4, borderWidth: 1, borderColor: '#ECE9DF' },
  filter: { flex: 1, height: 39, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }, filterActive: { backgroundColor: '#0F9D58' },
  filterText: { color: '#68756F' }, filterActiveText: { color: '#FFFFFF' },
  dateHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 5 }, sync: { color: '#0F9D58', fontSize: 12, fontWeight: '700' },
  row: { minHeight: 82, borderRadius: 17, backgroundColor: '#FFFFFF', padding: 13, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ECE9DF' },
  rowIcon: { width: 45, height: 45, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }, incomeIcon: { backgroundColor: '#E3F4E7' }, expenseIcon: { backgroundColor: '#FFE6DF' },
  rowCopy: { flex: 1, paddingHorizontal: 11 }, amountCopy: { alignItems: 'flex-end' }, meta: { fontSize: 11, lineHeight: 16 }, status: { color: '#0F9D58', fontSize: 10, lineHeight: 14 },
  empty: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 30, alignItems: 'center', gap: 7, borderWidth: 1, borderColor: '#ECE9DF' },
  emptyIcon: { width: 58, height: 58, borderRadius: 20, backgroundColor: '#EAF7F0', alignItems: 'center', justifyContent: 'center' }, emptyText: { textAlign: 'center', fontSize: 13 },
  hint: { fontSize: 11, textAlign: 'center', marginTop: 4 },
});
