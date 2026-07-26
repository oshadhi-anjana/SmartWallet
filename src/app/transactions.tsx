import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import { ScreenNav } from '@/components/screen-nav';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { deleteTransaction, getTransactions } from '@/database/transactionQueries';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { Transaction } from '@/models/Transaction';
import { auth } from '@/services/firebase';
import { syncPendingTransactions } from '@/services/syncService';

export default function TransactionsScreen() {
  const router = useRouter();
  const isOnline = useNetworkStatus();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  async function loadTransactions() {
    const userId = auth.currentUser?.uid ?? 'local-user';
    const result = await getTransactions(userId);
    setTransactions(result);
  }

  useFocusEffect(useCallback(() => { loadTransactions(); }, []));

  function handleDelete(id: string) {
    Alert.alert('Delete transaction?', 'This removes the local record from this device.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await deleteTransaction(id);
        await loadTransactions();
      }},
    ]);
  }

  async function handleRetrySync() {
    setIsSyncing(true);
    try {
      await syncPendingTransactions();
      await loadTransactions();
    } finally {
      setIsSyncing(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <ScreenNav />
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
                <ThemedView style={styles.metaRow}>
                  <ThemedText themeColor="textSecondary">
                    {item.description || 'No description'} • {item.transactionDate}
                  </ThemedText>
                  <ThemedText style={getSyncBadgeStyle(item.syncStatus, isOnline)}>{getSyncLabel(item.syncStatus, isOnline)}</ThemedText>
                </ThemedView>
                <ThemedView style={styles.actions}>
                  <Pressable onPress={() => router.push({ pathname: '/add-transaction', params: { id: item.id } } as never)}>
                    <ThemedText type="smallBold" style={styles.actionText}>Edit</ThemedText>
                  </Pressable>
                  <Pressable onPress={() => handleDelete(item.id)}>
                    <ThemedText type="smallBold" style={styles.deleteText}>Delete</ThemedText>
                  </Pressable>
                </ThemedView>
              </ThemedView>
            ))
          )}

          <Pressable style={styles.primaryButton} onPress={() => router.push('/add-transaction' as never)}>
            <ThemedText type="smallBold" style={styles.buttonText}>
              Add a transaction
            </ThemedText>
          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={handleRetrySync} disabled={isSyncing}>
            <ThemedText type="smallBold" style={styles.secondaryButtonText}>
              {isSyncing ? 'Syncing…' : 'Retry sync'}
            </ThemedText>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function getSyncLabel(syncStatus: Transaction['syncStatus'], isOnline: boolean) {
  if (!isOnline) {
    return 'Offline';
  }

  switch (syncStatus) {
    case 'synced':
      return 'Synced';
    case 'pending':
      return 'Pending';
    case 'failed':
      return 'Failed';
    default:
      return 'Syncing';
  }
}

function getSyncBadgeStyle(syncStatus: Transaction['syncStatus'], isOnline: boolean) {
  if (!isOnline) {
    return styles.badgeOffline;
  }

  switch (syncStatus) {
    case 'synced':
      return styles.badgeSynced;
    case 'pending':
      return styles.badgePending;
    case 'failed':
      return styles.badgeFailed;
    default:
      return styles.badgeSyncing;
  }
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
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.one,
    flexWrap: 'wrap',
  },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.three, paddingTop: Spacing.one },
  actionText: { color: '#0F9D58' },
  deleteText: { color: '#D32F2F' },
  badgeOffline: {
    color: '#F57C00',
    fontWeight: '700',
  },
  badgeSyncing: {
    color: '#F57C00',
    fontWeight: '700',
  },
  badgeSynced: {
    color: '#2E7D32',
    fontWeight: '700',
  },
  badgePending: {
    color: '#F57C00',
    fontWeight: '700',
  },
  badgeFailed: {
    color: '#D32F2F',
    fontWeight: '700',
  },
  incomeText: {
    color: '#2E7D32',
  },
  expenseText: {
    color: '#D32F2F',
  },
  primaryButton: {
    backgroundColor: '#0F9D58',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: 999,
    alignItems: 'center',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#F57C00',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: 999,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
  },
  secondaryButtonText: {
    color: '#F57C00',
  },
});
