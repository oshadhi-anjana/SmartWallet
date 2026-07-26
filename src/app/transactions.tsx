import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenNav } from '@/components/screen-nav';
import { useAppTheme } from '@/components/app-theme-provider';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { getTransactions } from '@/database/transactionQueries';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { Transaction } from '@/models/Transaction';
import { auth } from '@/services/firebase';
import { deleteTransactionEverywhere, refreshWalletData, syncPendingTransactions } from '@/services/syncService';

export default function TransactionsScreen() {
  const router = useRouter();
  const { formatCurrency: money, theme } = useAppTheme();
  const isOnline = useNetworkStatus();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [transactionToView, setTransactionToView] = useState<Transaction | null>(null);
  const [receiptPreviewUri, setReceiptPreviewUri] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = useCallback(async () => {
    const userId = auth.currentUser?.uid ?? 'local-user';
    await refreshWalletData(userId);
    setTransactions(await getTransactions(userId));
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const visible = transactions.filter((item) => {
    if (filter !== 'all' && item.type !== filter) return false;
    if (!normalizedQuery) return true;

    return [
      item.category,
      item.description,
      item.transactionDate,
      item.type,
      String(item.amount),
      money(item.amount),
    ].some((value) => value?.toLowerCase().includes(normalizedQuery));
  });

  async function retrySync() {
    setIsSyncing(true);
    try { await syncPendingTransactions(); await load(); } finally { setIsSyncing(false); }
  }

  async function confirmDelete() {
    if (!transactionToDelete || isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteTransactionEverywhere(transactionToDelete.userId, transactionToDelete.id);
      setTransactionToDelete(null);
      await load();
    } catch (error) {
      console.error('Failed to delete transaction', transactionToDelete.id, error);
      Alert.alert(
        'Unable to delete',
        'The transaction could not be removed from the database. Check your internet connection and try again.'
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.transactionScroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets>
          <View style={styles.titleRow}>
            <ThemedText type="subtitle" style={styles.title}>Transactions</ThemedText>
            <Pressable
              style={[styles.search, { backgroundColor: theme.backgroundElement, borderColor: theme.border }, searchVisible && styles.searchActive, searchVisible && { backgroundColor: theme.primary, borderColor: theme.primary }]}
              accessibilityLabel={searchVisible ? 'Close transaction search' : 'Search transactions'}
              onPress={() => {
                setSearchVisible((value) => !value);
                if (searchVisible) setSearchQuery('');
              }}>
              <Ionicons name={searchVisible ? 'close' : 'search-outline'} size={22} color={searchVisible ? '#FFFFFF' : '#212121'} />
            </Pressable>
          </View>
          {searchVisible ? (
            <View style={[styles.searchField, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              <Ionicons name="search-outline" size={20} color="#68756F" />
              <TextInput
                autoFocus
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search category, date, amount..."
                placeholderTextColor="#8A938F"
                returnKeyType="search"
                style={styles.searchInput}
              />
              {searchQuery ? (
                <Pressable onPress={() => setSearchQuery('')} accessibilityLabel="Clear search">
                  <Ionicons name="close-circle" size={20} color="#68756F" />
                </Pressable>
              ) : null}
            </View>
          ) : null}
          <View style={[styles.filters, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            {(['all', 'income', 'expense'] as const).map((item) => (
              <Pressable key={item} onPress={() => setFilter(item)} style={[styles.filter, filter === item && styles.filterActive, filter === item && { backgroundColor: theme.primary }]}>
                <ThemedText type="smallBold" style={filter === item ? styles.filterActiveText : styles.filterText}>{item[0].toUpperCase() + item.slice(1)}</ThemedText>
              </Pressable>
            ))}
          </View>
          <View style={styles.dateHeading}>
            <ThemedText type="smallBold">Recent activity</ThemedText>
            <Pressable onPress={retrySync}><ThemedText style={[styles.sync, { color: theme.primary }]}>{isSyncing ? 'Syncing…' : isOnline ? 'Sync now' : 'Offline'}</ThemedText></Pressable>
          </View>

          {visible.length === 0 ? (
            <View style={[styles.empty, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              <View style={[styles.emptyIcon, { backgroundColor: `${theme.primary}18` }]}><Ionicons name="receipt-outline" size={32} color={theme.primary} /></View>
              <ThemedText type="smallBold">{normalizedQuery ? 'No matching transactions' : 'No transactions found'}</ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.emptyText}>
                {normalizedQuery ? 'Try another category, date, type, or amount.' : 'Use the plus button to record income or an expense.'}
              </ThemedText>
            </View>
          ) : visible.map((item) => {
            const income = item.type === 'income';
            return (
              <View key={item.id} style={[styles.row, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
                <View style={styles.transactionMain}>
                  <View style={[styles.rowIcon, income ? styles.incomeIcon : styles.expenseIcon]}>
                    <Ionicons name={income ? 'cash-outline' : 'cart-outline'} size={21} color={income ? theme.success : theme.secondary} />
                  </View>
                  <View style={styles.rowCopy}>
                    <ThemedText type="smallBold">{item.category}</ThemedText>
                    <ThemedText themeColor="textSecondary" style={styles.meta}>{item.description || item.transactionDate}</ThemedText>
                    <ThemedText style={[styles.status, { color: theme.primary }]}>{getStatus(item.syncStatus, isOnline)}</ThemedText>
                  </View>
                  <View style={styles.amountCopy}>
                    <ThemedText type="smallBold" style={{ color: income ? theme.success : theme.expense }}>{income ? '+' : '-'} {money(item.amount)}</ThemedText>
                    <ThemedText themeColor="textSecondary" style={styles.meta}>{item.transactionDate}</ThemedText>
                  </View>
                </View>
                <View style={styles.rowActions}>
                  <TransactionAction icon="eye-outline" label="View" color={theme.primary} onPress={() => setTransactionToView(item)} />
                  <TransactionAction
                    icon="create-outline"
                    label="Edit"
                    color="#F57C00"
                    onPress={() => router.push({ pathname: '/add-transaction', params: { id: item.id } } as never)}
                  />
                  <TransactionAction icon="trash-outline" label="Delete" color="#D32F2F" onPress={() => setTransactionToDelete(item)} />
                  {item.receiptUri ? (
                    <View style={styles.receiptBadge}>
                      <Ionicons name="image-outline" size={14} color={theme.primary} />
                      <ThemedText style={[styles.receiptBadgeText, { color: theme.primary }]}>Receipt</ThemedText>
                    </View>
                  ) : null}
                </View>
              </View>
            );
          })}
          <ThemedText themeColor="textSecondary" style={styles.hint}>Use the icons to view, edit, or delete a transaction.</ThemedText>
        </ScrollView>
        <ScreenNav />
        <Modal
          visible={Boolean(transactionToView)}
          transparent
          animationType="slide"
          statusBarTranslucent
          onRequestClose={() => setTransactionToView(null)}>
          <Pressable style={styles.modalBackdrop} onPress={() => setTransactionToView(null)}>
            <Pressable style={[styles.detailsModal, { backgroundColor: theme.backgroundElement }]} onPress={(event) => event.stopPropagation()}>
              <View style={styles.detailsHeader}>
                <View>
                  <ThemedText type="subtitle" style={styles.detailsTitle}>Transaction details</ThemedText>
                  <ThemedText themeColor="textSecondary" style={styles.detailsSubtitle}>Complete record and receipt</ThemedText>
                </View>
                <Pressable style={styles.modalClose} onPress={() => setTransactionToView(null)} accessibilityLabel="Close transaction details">
                  <Ionicons name="close" size={22} color="#68756F" />
                </Pressable>
              </View>
              {transactionToView ? (
                <ScrollView
                  style={styles.detailsScroll}
                  contentContainerStyle={styles.detailsContent}
                  showsVerticalScrollIndicator
                  nestedScrollEnabled>
                  <View style={styles.detailAmountCard}>
                    <ThemedText themeColor="textSecondary" style={styles.detailLabel}>{transactionToView.type === 'income' ? 'Income' : 'Expense'}</ThemedText>
                    <ThemedText type="subtitle" style={{ color: transactionToView.type === 'income' ? theme.success : theme.expense }}>
                      {transactionToView.type === 'income' ? '+' : '-'} {money(transactionToView.amount)}
                    </ThemedText>
                  </View>
                  <DetailRow label="Category" value={transactionToView.category} />
                  <DetailRow label="Date" value={transactionToView.transactionDate} />
                  <DetailRow label="Description" value={transactionToView.description || 'No description'} />
                  <ThemedText type="smallBold" style={styles.receiptTitle}>Receipt</ThemedText>
                  {transactionToView.receiptUri ? (
                    <Pressable
                      style={styles.receiptPreviewButton}
                      onPress={() => setReceiptPreviewUri(transactionToView.receiptUri ?? null)}
                      accessibilityRole="button"
                      accessibilityLabel="View receipt full screen">
                      <Image source={{ uri: transactionToView.receiptUri }} style={styles.receiptImage} resizeMode="contain" accessibilityLabel="Uploaded transaction receipt" />
                      <View style={styles.expandReceipt}>
                        <Ionicons name="expand-outline" size={17} color="#FFFFFF" />
                        <ThemedText style={styles.expandReceiptText}>Tap to enlarge</ThemedText>
                      </View>
                    </Pressable>
                  ) : (
                    <View style={styles.noReceipt}>
                      <Ionicons name="image-outline" size={30} color="#9AA39F" />
                      <ThemedText themeColor="textSecondary">No receipt uploaded</ThemedText>
                    </View>
                  )}
                  <Pressable
                    style={[styles.editDetailsButton, { backgroundColor: theme.primary }]}
                    onPress={() => {
                      const id = transactionToView.id;
                      setTransactionToView(null);
                      router.push({ pathname: '/add-transaction', params: { id } } as never);
                    }}>
                    <Ionicons name="create-outline" size={19} color="#FFFFFF" />
                    <ThemedText type="smallBold" style={styles.deleteButtonText}>Edit transaction</ThemedText>
                  </Pressable>
                </ScrollView>
              ) : null}
            </Pressable>
          </Pressable>
        </Modal>
        <Modal
          visible={Boolean(receiptPreviewUri)}
          transparent
          animationType="fade"
          statusBarTranslucent
          onRequestClose={() => setReceiptPreviewUri(null)}>
          <Pressable style={styles.imageViewer} onPress={() => setReceiptPreviewUri(null)}>
            <Pressable style={styles.imageClose} onPress={() => setReceiptPreviewUri(null)} accessibilityLabel="Close receipt image">
              <Ionicons name="close" size={27} color="#FFFFFF" />
            </Pressable>
            {receiptPreviewUri ? (
              <Image source={{ uri: receiptPreviewUri }} style={styles.fullReceiptImage} resizeMode="contain" accessibilityLabel="Full screen transaction receipt" />
            ) : null}
          </Pressable>
        </Modal>
        <Modal
          visible={Boolean(transactionToDelete)}
          transparent
          animationType="fade"
          statusBarTranslucent
          onRequestClose={() => !isDeleting && setTransactionToDelete(null)}>
          <Pressable style={styles.modalBackdrop} onPress={() => !isDeleting && setTransactionToDelete(null)}>
            <Pressable style={[styles.deleteModal, { backgroundColor: theme.backgroundElement }]} onPress={(event) => event.stopPropagation()}>
              <View style={styles.deleteIcon}>
                <Ionicons name="trash-outline" size={29} color="#D32F2F" />
              </View>
              <ThemedText type="subtitle" style={styles.deleteTitle}>Delete transaction?</ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.deleteMessage}>
                This transaction will be permanently removed from your device and database.
              </ThemedText>

              {transactionToDelete ? (
                <View style={styles.deleteSummary}>
                  <View>
                    <ThemedText type="smallBold">{transactionToDelete.category}</ThemedText>
                    <ThemedText themeColor="textSecondary" style={styles.deleteDate}>{transactionToDelete.transactionDate}</ThemedText>
                  </View>
                  <ThemedText type="smallBold" style={{ color: transactionToDelete.type === 'income' ? theme.success : theme.expense }}>
                    {transactionToDelete.type === 'income' ? '+' : '-'} {money(transactionToDelete.amount)}
                  </ThemedText>
                </View>
              ) : null}

              <View style={styles.deleteActions}>
                <Pressable style={styles.cancelButton} onPress={() => setTransactionToDelete(null)} disabled={isDeleting}>
                  <ThemedText type="smallBold">Keep transaction</ThemedText>
                </Pressable>
                <Pressable style={styles.deleteButton} onPress={confirmDelete} disabled={isDeleting}>
                  {isDeleting
                    ? <ActivityIndicator color="#FFFFFF" />
                    : <><Ionicons name="trash-outline" size={18} color="#FFFFFF" /><ThemedText type="smallBold" style={styles.deleteButtonText}>Delete</ThemedText></>}
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
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

function TransactionAction({ icon, label, color, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; color: string; onPress: () => void }) {
  return <Pressable style={styles.actionButton} onPress={onPress} accessibilityRole="button" accessibilityLabel={`${label} transaction`}>
    <Ionicons name={icon} size={18} color={color} />
    <ThemedText style={[styles.actionLabel, { color }]}>{label}</ThemedText>
  </Pressable>;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return <View style={styles.detailRow}>
    <ThemedText themeColor="textSecondary" style={styles.detailLabel}>{label}</ThemedText>
    <ThemedText type="smallBold" style={styles.detailValue}>{value}</ThemedText>
  </View>;
}

const styles = StyleSheet.create({
  container: { flex: 1 }, safeArea: { flex: 1, maxWidth: MaxContentWidth, alignSelf: 'center', width: '100%' },
  transactionScroll: { marginBottom: BottomTabInset +29 },
  content: { paddingHorizontal: Spacing.three, paddingTop: Spacing.three, paddingBottom: Spacing.four, gap: 11 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, title: { fontSize: 27, lineHeight: 35 },
  search: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#ECE9DF' },
  searchActive: { backgroundColor: '#0F9D58', borderColor: '#0F9D58' },
  searchField: { minHeight: 48, paddingHorizontal: 13, borderRadius: 15, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DDE5E1', flexDirection: 'row', alignItems: 'center', gap: 9 },
  searchInput: { flex: 1, color: '#212121', fontSize: 14, paddingVertical: 10 },
  filters: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 15, padding: 4, borderWidth: 1, borderColor: '#ECE9DF' },
  filter: { flex: 1, height: 39, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }, filterActive: { backgroundColor: '#0F9D58' },
  filterText: { color: '#68756F' }, filterActiveText: { color: '#FFFFFF' },
  dateHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 5 }, sync: { color: '#0F9D58', fontSize: 12, fontWeight: '700' },
  row: { borderRadius: 17, backgroundColor: '#FFFFFF', padding: 13, borderWidth: 1, borderColor: '#ECE9DF' },
  transactionMain: { minHeight: 58, flexDirection: 'row', alignItems: 'center' },
  rowIcon: { width: 45, height: 45, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }, incomeIcon: { backgroundColor: '#E3F4E7' }, expenseIcon: { backgroundColor: '#FFE6DF' },
  rowCopy: { flex: 1, paddingHorizontal: 11 }, amountCopy: { alignItems: 'flex-end' }, meta: { fontSize: 11, lineHeight: 16 }, status: { color: '#0F9D58', fontSize: 10, lineHeight: 14 },
  rowActions: { borderTopWidth: 1, borderTopColor: '#F0EEE8', marginTop: 9, paddingTop: 9, flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionButton: { minHeight: 34, paddingHorizontal: 8, borderRadius: 10, backgroundColor: '#F7F8FA', flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionLabel: { fontSize: 10, fontWeight: '700' },
  receiptBadge: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 3 }, receiptBadgeText: { color: '#0F9D58', fontSize: 9, fontWeight: '700' },
  empty: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 30, alignItems: 'center', gap: 7, borderWidth: 1, borderColor: '#ECE9DF' },
  emptyIcon: { width: 58, height: 58, borderRadius: 20, backgroundColor: '#EAF7F0', alignItems: 'center', justifyContent: 'center' }, emptyText: { textAlign: 'center', fontSize: 13 },
  hint: { fontSize: 11, textAlign: 'center', marginTop: 4 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(16, 31, 24, 0.48)', justifyContent: 'center', paddingHorizontal: 24 },
  deleteModal: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 22, alignItems: 'center', gap: 12, shadowColor: '#123D2B', shadowOpacity: 0.2, shadowRadius: 20, elevation: 12 },
  deleteIcon: { width: 58, height: 58, borderRadius: 20, backgroundColor: '#FFE8E5', alignItems: 'center', justifyContent: 'center' },
  deleteTitle: { fontSize: 21, lineHeight: 28, textAlign: 'center' },
  deleteMessage: { fontSize: 13, lineHeight: 19, textAlign: 'center', paddingHorizontal: 6 },
  deleteSummary: { width: '100%', backgroundColor: '#F7F8FA', borderRadius: 15, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 3 },
  deleteDate: { fontSize: 11, lineHeight: 16 },
  deleteActions: { width: '100%', flexDirection: 'row', gap: 10, marginTop: 5 },
  cancelButton: { flex: 1, minHeight: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#DDE5E1' },
  deleteButton: { flex: 1, minHeight: 48, borderRadius: 14, backgroundColor: '#D32F2F', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 },
  deleteButtonText: { color: '#FFFFFF' },
  detailsModal: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, height: '82%', shadowColor: '#123D2B', shadowOpacity: 0.2, shadowRadius: 20, elevation: 12 },
  detailsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  detailsScroll: { flex: 1 }, detailsContent: { paddingBottom: 4 },
  detailsTitle: { fontSize: 21, lineHeight: 28 }, detailsSubtitle: { fontSize: 11 },
  modalClose: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#F7F8FA', alignItems: 'center', justifyContent: 'center' },
  detailAmountCard: { backgroundColor: '#F7F8FA', borderRadius: 16, alignItems: 'center', padding: 16, marginBottom: 8 },
  detailRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0EEE8' },
  detailLabel: { fontSize: 11, marginBottom: 3 }, detailValue: { fontSize: 14 },
  receiptTitle: { fontSize: 14, marginTop: 16, marginBottom: 9 },
  receiptPreviewButton: { position: 'relative', borderRadius: 15, overflow: 'hidden', backgroundColor: '#F7F8FA' },
  receiptImage: { width: '100%', height: 240, backgroundColor: '#F7F8FA' },
  expandReceipt: { position: 'absolute', right: 9, bottom: 9, backgroundColor: 'rgba(18, 61, 43, 0.82)', borderRadius: 10, paddingHorizontal: 9, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 5 },
  expandReceiptText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
  noReceipt: { height: 120, borderRadius: 15, backgroundColor: '#F7F8FA', alignItems: 'center', justifyContent: 'center', gap: 7 },
  editDetailsButton: { minHeight: 48, borderRadius: 14, backgroundColor: '#0F9D58', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 17 },
  imageViewer: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.94)', justifyContent: 'center', alignItems: 'center' },
  imageClose: { position: 'absolute', top: 48, right: 20, zIndex: 2, width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  fullReceiptImage: { width: '100%', height: '85%' },
});
