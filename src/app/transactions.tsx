import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { getTransactions } from '@/database/transactionQueries';
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

  useEffect(() => {
    loadTransactions();
  }, []);

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
  badgeOffline: {
    color: '#8b5a00',
    fontWeight: '700',
  },
  badgeSyncing: {
    color: '#1d4ed8',
    fontWeight: '700',
  },
  badgeSynced: {
    color: '#15803d',
    fontWeight: '700',
  },
  badgePending: {
    color: '#b45309',
    fontWeight: '700',
  },
  badgeFailed: {
    color: '#b91c1c',
    fontWeight: '700',
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
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#3c87f7',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: 999,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
  },
  secondaryButtonText: {
    color: '#3c87f7',
  },
});
