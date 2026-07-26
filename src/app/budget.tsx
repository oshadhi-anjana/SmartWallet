import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BudgetProgressCard from '@/components/budget-progress-card';
import { useAppTheme } from '@/components/app-theme-provider';
import { DateField } from '@/components/date-field';
import { ScreenNav } from '@/components/screen-nav';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { getTransactions } from '@/database/transactionQueries';
import { getBudgets, saveBudget } from '@/database/walletQueries';
import { Budget } from '@/models/Budget';
import { Transaction } from '@/models/Transaction';
import { auth } from '@/services/firebase';
import { deleteBudgetEverywhere, refreshWalletData, syncPendingBudgets } from '@/services/syncService';
import { createId } from '@/utils/id';

const categories = ['Food', 'Transport', 'Bills', 'Shopping', 'Entertainment', 'Health'];

export default function BudgetScreen() {
  const { formatCurrency, currency, theme } = useAppTheme();
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [month, setMonth] = useState(currentMonth);
  const [filterMonth, setFilterMonth] = useState(currentMonth);
  const [category, setCategory] = useState('Food');
  const [limit, setLimit] = useState('');
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [budgetToDelete, setBudgetToDelete] = useState<Budget | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const userId = auth.currentUser?.uid ?? 'local-user';

  const load = useCallback(async () => {
    await refreshWalletData(userId);
    const [saved, tx] = await Promise.all([getBudgets(userId), getTransactions(userId)]);
    setBudgets(saved);
    setTransactions(tx);
  }, [userId]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const filteredBudgets = useMemo(
    () => budgets.filter((item) => item.month === filterMonth),
    [budgets, filterMonth]
  );
  const monthTotals = useMemo(() => {
    const budget = filteredBudgets.reduce((sum, item) => sum + item.limitAmount, 0);
    const spent = filteredBudgets.reduce((sum, item) => sum + spentFor(item), 0);
    return { budget, spent, remaining: budget - spent };
  }, [filteredBudgets, transactions]);
  const unavailableCategories = useMemo(
    () => new Set(
      budgets
        .filter((item) => item.month === month && item.id !== editingBudget?.id)
        .map((item) => item.category)
    ),
    [budgets, editingBudget?.id, month]
  );
  const availableCategories = categories.filter((item) => !unavailableCategories.has(item));

  useEffect(() => {
    if (unavailableCategories.has(category) && availableCategories[0]) {
      setCategory(availableCategories[0]);
    }
  }, [availableCategories, category, unavailableCategories]);

  async function handleSave() {
    const amount = Number(limit);
    if (!month.match(/^\d{4}-\d{2}$/) || !Number.isFinite(amount) || amount <= 0) {
      setError('Select a month and enter a positive limit.');
      return;
    }
    const duplicate = budgets.find((item) =>
      item.month === month && item.category === category && item.id !== editingBudget?.id
    );
    if (duplicate) {
      setError(`${category} already has a budget for ${month}. Edit the existing budget instead.`);
      return;
    }

    const now = new Date().toISOString();
    await saveBudget({
      id: editingBudget?.id ?? createId(),
      userId,
      category,
      month,
      limitAmount: amount,
      spentAmount: 0,
      syncStatus: 'pending',
      createdAt: editingBudget?.createdAt ?? now,
      updatedAt: now,
    });
    setLimit('');
    setError('');
    setEditingBudget(null);
    setFilterMonth(month);
    setFormOpen(false);
    await syncPendingBudgets();
    await load();
  }

  function startEdit(budget: Budget) {
    setEditingBudget(budget);
    setMonth(budget.month);
    setCategory(budget.category);
    setLimit(String(budget.limitAmount));
    setError('');
    setFormOpen(true);
  }

  function cancelEdit() {
    setEditingBudget(null);
    setMonth(filterMonth);
    setCategory('Food');
    setLimit('');
    setError('');
    setFormOpen(false);
  }

  function startAdd() {
    setEditingBudget(null);
    setMonth(filterMonth);
    setCategory('Food');
    setLimit('');
    setError('');
    setFormOpen(true);
  }

  async function confirmDelete() {
    if (!budgetToDelete || isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteBudgetEverywhere(budgetToDelete.userId, budgetToDelete.id);
      if (editingBudget?.id === budgetToDelete.id) cancelEdit();
      setBudgetToDelete(null);
      await load();
    } catch (deleteError) {
      console.error('Failed to delete budget', deleteError);
      setBudgetToDelete(null);
      setError('Unable to delete this budget. Check your connection and try again.');
    } finally {
      setIsDeleting(false);
    }
  }

  function spentFor(budget: Budget) {
    return transactions
      .filter((item) => item.type === 'expense' && item.category === budget.category && item.transactionDate.startsWith(budget.month))
      .reduce((sum, item) => sum + item.amount, 0);
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
          <View style={styles.titleRow}>
            <View>
              <ThemedText type="subtitle" style={styles.pageTitle}>Monthly Budget</ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.pageSubtitle}>Plan your spending by category</ThemedText>
            </View>
            <Pressable style={[styles.addButton, { backgroundColor: theme.primary }]} onPress={startAdd}>
              <Ionicons name="add" size={22} color="#FFFFFF" />
            </Pressable>
          </View>

          <ThemedView type="backgroundElement" style={styles.filterCard}>
            <View style={styles.filterHeading}>
              <View style={[styles.filterIcon, { backgroundColor: `${theme.primary}18` }]}><Ionicons name="calendar-outline" size={18} color={theme.primary} /></View>
              <View>
                <ThemedText type="smallBold">Budget month</ThemedText>
                <ThemedText themeColor="textSecondary" style={styles.hint}>View and manage one month at a time</ThemedText>
              </View>
            </View>
            <DateField value={filterMonth} onChange={setFilterMonth} mode="month" placeholder="Select month" />
          </ThemedView>

          <View style={[styles.summaryCard, { backgroundColor: theme.primary }]}>
            <ThemedText themeColor="textSecondary" style={styles.summaryLabel}>Total monthly budget</ThemedText>
            <ThemedText type="subtitle" style={styles.summaryTotal}>{formatCurrency(monthTotals.budget)}</ThemedText>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <View><ThemedText themeColor="textSecondary" style={styles.summaryLabel}>Spent</ThemedText><ThemedText type="smallBold" style={styles.spent}>{formatCurrency(monthTotals.spent)}</ThemedText></View>
              <View style={styles.summaryRight}><ThemedText themeColor="textSecondary" style={styles.summaryLabel}>Remaining</ThemedText><ThemedText type="smallBold" style={{ color: monthTotals.remaining < 0 ? '#FFD2C9' : '#C9F4DA' }}>{formatCurrency(monthTotals.remaining)}</ThemedText></View>
            </View>
          </View>

          <View style={styles.sectionHeading}>
            <ThemedText type="smallBold" style={styles.sectionTitle}>Category budgets</ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.countText}>{filteredBudgets.length} categories</ThemedText>
          </View>

          {filteredBudgets.length === 0 ? (
            <ThemedView type="backgroundElement" style={styles.emptyCard}>
              <Ionicons name="calendar-outline" size={30} color={theme.primary} />
              <ThemedText type="smallBold">No budgets for {filterMonth}</ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.emptyText}>Create your first category limit for this month.</ThemedText>
              <Pressable style={[styles.emptyAddButton, { backgroundColor: theme.primary }]} onPress={startAdd}><Ionicons name="add" size={18} color="#FFFFFF" /><ThemedText type="smallBold" style={styles.white}>Add budget</ThemedText></Pressable>
            </ThemedView>
          ) : filteredBudgets.map((item) => (
            <ThemedView key={item.id} style={styles.budgetItem}>
              <BudgetProgressCard title={`${item.category} · ${item.month}`} budget={item.limitAmount} spent={spentFor(item)} />
              <View style={styles.budgetActions}>
                <Pressable style={styles.editButton} onPress={() => startEdit(item)}>
                  <Ionicons name="create-outline" size={18} color="#F57C00" />
                  <ThemedText type="smallBold" style={styles.editText}>Edit</ThemedText>
                </Pressable>
                <Pressable style={styles.removeButton} onPress={() => setBudgetToDelete(item)}>
                  <Ionicons name="trash-outline" size={18} color="#D32F2F" />
                  <ThemedText type="smallBold" style={styles.removeText}>Delete</ThemedText>
                </Pressable>
              </View>
            </ThemedView>
          ))}
        </ScrollView>
        <ScreenNav />

        <Modal visible={formOpen} transparent animationType="slide" statusBarTranslucent onRequestClose={cancelEdit}>
          <Pressable style={styles.modalBackdrop} onPress={cancelEdit}>
            <Pressable style={[styles.formModal, { backgroundColor: theme.backgroundElement }]} onPress={(event) => event.stopPropagation()}>
              <View style={styles.formHeading}>
                <View>
                  <ThemedText type="subtitle" style={styles.formModalTitle}>{editingBudget ? 'Edit budget' : 'Add budget'}</ThemedText>
                  <ThemedText themeColor="textSecondary" style={styles.hint}>One category budget per month</ThemedText>
                </View>
                <Pressable style={styles.closeButton} onPress={cancelEdit}><Ionicons name="close" size={22} color="#68756F" /></Pressable>
              </View>
              <ScrollView keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets contentContainerStyle={styles.formContent}>
                <ThemedText type="smallBold">Month</ThemedText>
                <DateField value={month} onChange={setMonth} mode="month" placeholder="Select month" />
                <ThemedText type="smallBold">Category</ThemedText>
                <View style={styles.categoryGrid}>{categories.map((item) => {
                  const unavailable = unavailableCategories.has(item);
                  const allocated = budgets.find((budget) => budget.month === month && budget.category === item);
                  return (
                    <Pressable
                      key={item}
                      disabled={unavailable}
                      onPress={() => setCategory(item)}
                      style={[styles.categoryOption, category === item && styles.chipActive, category === item && { backgroundColor: theme.primary, borderColor: theme.primary }, unavailable && styles.categoryDisabled]}>
                      <ThemedText type="smallBold" style={category === item ? styles.white : unavailable ? styles.disabledText : undefined}>{item}</ThemedText>
                      {allocated ? (
                        <ThemedText style={[styles.allocatedCategoryText, category === item && styles.white]}>
                          {formatCurrency(allocated.limitAmount)} allocated
                        </ThemedText>
                      ) : <ThemedText style={[styles.availableText, { color: theme.primary }]}>Available</ThemedText>}
                    </Pressable>
                  );
                })}</View>
                {availableCategories.length === 0 ? (
                  <View style={styles.allAddedBox}>
                    <Ionicons name="checkmark-circle-outline" size={19} color={theme.success} />
                    <ThemedText style={styles.allAddedText}>All categories already have budgets for this month.</ThemedText>
                  </View>
                ) : null}
                <ThemedText type="smallBold">Monthly limit ({currency})</ThemedText>
                <TextInput style={styles.input} value={limit} onChangeText={setLimit} keyboardType="decimal-pad" placeholder="e.g. 25,000" autoFocus={!editingBudget} />
                {error ? <View style={styles.errorBox}><Ionicons name="alert-circle-outline" size={18} color="#D32F2F" /><ThemedText style={styles.error}>{error}</ThemedText></View> : null}
                <Pressable style={[styles.primaryButton, { backgroundColor: theme.primary }, availableCategories.length === 0 && !editingBudget && styles.buttonDisabled]} onPress={handleSave} disabled={availableCategories.length === 0 && !editingBudget}>
                  <ThemedText type="smallBold" style={styles.white}>{editingBudget ? 'Update budget' : 'Save budget'}</ThemedText>
                </Pressable>
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>

        <Modal visible={Boolean(budgetToDelete)} transparent animationType="fade" statusBarTranslucent onRequestClose={() => !isDeleting && setBudgetToDelete(null)}>
          <Pressable style={styles.modalBackdrop} onPress={() => !isDeleting && setBudgetToDelete(null)}>
            <Pressable style={[styles.deleteModal, { backgroundColor: theme.backgroundElement }]} onPress={(event) => event.stopPropagation()}>
              <View style={styles.deleteIcon}><Ionicons name="trash-outline" size={29} color="#D32F2F" /></View>
              <ThemedText type="subtitle" style={styles.deleteTitle}>Delete monthly budget?</ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.deleteMessage}>This budget will be permanently removed from your device and database.</ThemedText>
              {budgetToDelete ? (
                <View style={styles.deleteSummary}>
                  <View><ThemedText type="smallBold">{budgetToDelete.category}</ThemedText><ThemedText themeColor="textSecondary" style={styles.hint}>{budgetToDelete.month}</ThemedText></View>
                  <ThemedText type="smallBold" style={[styles.limitValue, { color: theme.primary }]}>{formatCurrency(budgetToDelete.limitAmount)}</ThemedText>
                </View>
              ) : null}
              <View style={styles.modalActions}>
                <Pressable style={styles.keepButton} onPress={() => setBudgetToDelete(null)} disabled={isDeleting}><ThemedText type="smallBold">Keep budget</ThemedText></Pressable>
                <Pressable style={styles.confirmDeleteButton} onPress={confirmDelete} disabled={isDeleting}>
                  {isDeleting ? <ActivityIndicator color="#FFFFFF" /> : <><Ionicons name="trash-outline" size={18} color="#FFFFFF" /><ThemedText type="smallBold" style={styles.white}>Delete</ThemedText></>}
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: Spacing.four, paddingBottom: BottomTabInset + Spacing.three, maxWidth: MaxContentWidth, alignSelf: 'center', width: '100%' },
  content: { gap: Spacing.three, paddingVertical: Spacing.four },
  card: { borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.two },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pageTitle: { fontSize: 27, lineHeight: 35 }, pageSubtitle: { fontSize: 12, lineHeight: 17 },
  addButton: { width: 46, height: 46, borderRadius: 15, backgroundColor: '#0F9D58', alignItems: 'center', justifyContent: 'center', shadowColor: '#0F9D58', shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  formHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  formTitle: { fontSize: 16 }, cancelEdit: { color: '#D32F2F', fontSize: 12, fontWeight: '700' },
  input: { borderWidth: 1, borderColor: '#FFC107', borderRadius: 12, padding: 12, backgroundColor: '#FFFFFF', color: '#212121' },
  chips: { flexDirection: 'row', gap: 8 },
  chip: { borderWidth: 1, borderColor: '#FFC107', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  chipActive: { backgroundColor: '#0F9D58', borderColor: '#0F9D58' },
  primaryButton: { backgroundColor: '#0F9D58', borderRadius: 14, padding: 14, alignItems: 'center' },
  white: { color: '#FFFFFF' }, error: { color: '#D32F2F', fontSize: 12, flex: 1 },
  errorBox: { backgroundColor: '#FFF0F0', borderRadius: 12, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 7 },
  filterCard: { borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.two },
  filterHeading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  filterIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: '#EAF7F0', alignItems: 'center', justifyContent: 'center' },
  hint: { fontSize: 11, lineHeight: 16 },
  emptyCard: { borderRadius: Spacing.three, padding: 24, alignItems: 'center', gap: 6 },
  emptyText: { fontSize: 12, textAlign: 'center' },
  emptyAddButton: { minHeight: 42, marginTop: 8, borderRadius: 13, paddingHorizontal: 17, backgroundColor: '#0F9D58', flexDirection: 'row', alignItems: 'center', gap: 6 },
  summaryCard: { borderRadius: 22, padding: 18, backgroundColor: '#078447' },
  summaryLabel: { color: '#DDF5E8', fontSize: 11, lineHeight: 16 },
  summaryTotal: { color: '#FFFFFF', fontSize: 25, lineHeight: 33, marginTop: 2 },
  summaryDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.18)', marginVertical: 13 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' }, summaryRight: { alignItems: 'flex-end' },
  spent: { color: '#FFD2C9' }, sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 16 }, countText: { fontSize: 11 },
  budgetItem: { gap: 7 },
  budgetActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, paddingHorizontal: 8 },
  editButton: { minHeight: 38, paddingHorizontal: 14, borderRadius: 11, backgroundColor: '#FFF0DC', flexDirection: 'row', alignItems: 'center', gap: 5 },
  editText: { color: '#F57C00' },
  removeButton: { minHeight: 38, paddingHorizontal: 14, borderRadius: 11, backgroundColor: '#FFE8E5', flexDirection: 'row', alignItems: 'center', gap: 5 },
  removeText: { color: '#D32F2F' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(16, 31, 24, 0.48)', justifyContent: 'center', paddingHorizontal: 24 },
  formModal: { height: '78%', backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, shadowColor: '#123D2B', shadowOpacity: 0.2, shadowRadius: 20, elevation: 12 },
  formModalTitle: { fontSize: 21, lineHeight: 28 }, closeButton: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#F7F8FA', alignItems: 'center', justifyContent: 'center' },
  formContent: { gap: 12, paddingTop: 18, paddingBottom: 10 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryOption: { width: '48%', minHeight: 54, borderWidth: 1, borderColor: '#DDE5E1', borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  categoryDisabled: { backgroundColor: '#F0F2F1', borderColor: '#E2E6E4', opacity: 0.72 },
  disabledText: { color: '#8A938F' },
  allocatedCategoryText: { color: '#68756F', fontSize: 8, lineHeight: 11, textAlign: 'center' },
  availableText: { color: '#0F9D58', fontSize: 8, lineHeight: 11 },
  allAddedBox: { backgroundColor: '#EAF7F0', borderRadius: 12, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 7 },
  allAddedText: { color: '#2E7D32', fontSize: 11, flex: 1 },
  buttonDisabled: { opacity: 0.45 },
  deleteModal: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 22, alignItems: 'center', gap: 12, shadowColor: '#123D2B', shadowOpacity: 0.2, shadowRadius: 20, elevation: 12 },
  deleteIcon: { width: 58, height: 58, borderRadius: 20, backgroundColor: '#FFE8E5', alignItems: 'center', justifyContent: 'center' },
  deleteTitle: { fontSize: 21, lineHeight: 28, textAlign: 'center' },
  deleteMessage: { fontSize: 13, lineHeight: 19, textAlign: 'center' },
  deleteSummary: { width: '100%', backgroundColor: '#F7F8FA', borderRadius: 15, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  limitValue: { color: '#0F9D58' },
  modalActions: { width: '100%', flexDirection: 'row', gap: 10, marginTop: 4 },
  keepButton: { flex: 1, minHeight: 48, borderRadius: 14, borderWidth: 1, borderColor: '#DDE5E1', alignItems: 'center', justifyContent: 'center' },
  confirmDeleteButton: { flex: 1, minHeight: 48, borderRadius: 14, backgroundColor: '#D32F2F', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
});
