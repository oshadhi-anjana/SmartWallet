import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DateField } from '@/components/date-field';
import { useAppTheme } from '@/components/app-theme-provider';
import { ScreenNav } from '@/components/screen-nav';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { getSavingsGoals, saveSavingsGoal } from '@/database/walletQueries';
import { SavingsGoal } from '@/models/SavingsGoal';
import { auth } from '@/services/firebase';
import { deleteSavingsGoalEverywhere, refreshWalletData, syncPendingSavingsGoals } from '@/services/syncService';
import { createId } from '@/utils/id';

export default function SavingsScreen() {
  const { formatCurrency: money, currency, theme, convertFromBase, convertToBase, exchangeRate } = useAppTheme();
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [error, setError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [goalToDelete, setGoalToDelete] = useState<SavingsGoal | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const userId = auth.currentUser?.uid ?? 'local-user';

  const load = useCallback(async () => {
    setGoals(await getSavingsGoals(userId));
    refreshWalletData(userId).then(async () => {
      setGoals(await getSavingsGoals(userId));
    }).catch(() => undefined);
  }, [userId]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const totals = useMemo(() => ({
    saved: goals.reduce((sum, goal) => sum + goal.currentAmount, 0),
    target: goals.reduce((sum, goal) => sum + goal.targetAmount, 0),
  }), [goals]);

  function resetForm() {
    setTitle('');
    setTargetAmount('');
    setCurrentAmount('');
    setTargetDate('');
    setError('');
    setEditingGoal(null);
    setFormOpen(false);
  }

  function startAdd() {
    resetForm();
    setFormOpen(true);
  }

  function startEdit(goal: SavingsGoal) {
    setEditingGoal(goal);
    setTitle(goal.title);
    setTargetAmount(String(Number(convertFromBase(goal.targetAmount).toFixed(2))));
    setCurrentAmount(String(Number(convertFromBase(goal.currentAmount).toFixed(2))));
    setTargetDate(goal.targetDate ?? '');
    setError('');
    setFormOpen(true);
  }

  async function saveGoal() {
    const target = Number(targetAmount);
    const current = Number(currentAmount || 0);
    if (!title.trim() || !Number.isFinite(target) || target <= 0 || !Number.isFinite(current) || current < 0 || current > target) {
      setError('Enter a goal name and valid amounts. Saved amount cannot exceed the target.');
      return;
    }
    if (exchangeRate === null) {
      setError(`The ${currency} exchange rate is unavailable. Connect to the internet and try again.`);
      return;
    }
    const now = new Date().toISOString();
    await saveSavingsGoal({
      id: editingGoal?.id ?? createId(),
      userId,
      title: title.trim(),
      targetAmount: convertToBase(target),
      currentAmount: convertToBase(current),
      targetDate: targetDate || undefined,
      syncStatus: 'pending',
      createdAt: editingGoal?.createdAt ?? now,
      updatedAt: now,
    });
    resetForm();
    await syncPendingSavingsGoals();
    await load();
  }

  async function confirmDelete() {
    if (!goalToDelete || isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteSavingsGoalEverywhere(goalToDelete.userId, goalToDelete.id);
      setGoalToDelete(null);
      await load();
    } catch (deleteError) {
      console.error('Failed to delete savings goal', deleteError);
      setGoalToDelete(null);
      setError('Unable to delete the goal. Check your connection and try again.');
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.titleRow}>
            <View>
              <ThemedText type="subtitle" style={styles.pageTitle}>Savings Goals</ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.subtitle}>Turn your plans into achievable targets</ThemedText>
            </View>
            <Pressable style={[styles.addButton, { backgroundColor: theme.primary }]} onPress={startAdd} accessibilityLabel="Add savings goal"><Ionicons name="add" size={23} color="#FFFFFF" /></Pressable>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: theme.primary }]}>
            <ThemedText style={styles.summaryLabel}>Total saved</ThemedText>
            <ThemedText type="subtitle" style={styles.summaryValue}>{money(totals.saved)}</ThemedText>
            <ThemedText style={styles.summaryTarget}>Across {goals.length} {goals.length === 1 ? 'goal' : 'goals'} · Target {money(totals.target)}</ThemedText>
            <View style={styles.summaryTrack}><View style={[styles.summaryFill, { width: `${totals.target ? Math.min(totals.saved / totals.target * 100, 100) : 0}%`, backgroundColor: theme.accent }]} /></View>
          </View>

          <View style={styles.sectionRow}><ThemedText type="smallBold" style={styles.sectionTitle}>Your goals</ThemedText><ThemedText themeColor="textSecondary" style={styles.goalCount}>{goals.length} active</ThemedText></View>
          {error && !formOpen ? <View style={styles.errorBox}><Ionicons name="alert-circle-outline" size={18} color="#D32F2F" /><ThemedText style={styles.error}>{error}</ThemedText></View> : null}

          {goals.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              <View style={[styles.emptyIcon, { backgroundColor: `${theme.primary}18` }]}><Ionicons name="flag-outline" size={31} color={theme.primary} /></View>
              <ThemedText type="smallBold">No savings goals yet</ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.emptyText}>Create a goal and start tracking your progress.</ThemedText>
              <Pressable style={[styles.emptyButton, { backgroundColor: theme.primary }]} onPress={startAdd}><Ionicons name="add" size={18} color="#FFFFFF" /><ThemedText type="smallBold" style={styles.white}>Create goal</ThemedText></Pressable>
            </View>
          ) : goals.map((goal) => {
            const progress = Math.min(goal.currentAmount / goal.targetAmount, 1);
            return (
              <View style={[styles.goalCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]} key={goal.id}>
                <View style={styles.goalHeader}>
                  <View style={[styles.goalIcon, { backgroundColor: `${theme.primary}18` }]}><Ionicons name="flag-outline" size={22} color={theme.primary} /></View>
                  <View style={styles.goalCopy}><ThemedText type="smallBold" style={styles.goalTitle}>{goal.title}</ThemedText><ThemedText themeColor="textSecondary" style={styles.goalDate}>{goal.targetDate ? `Target: ${goal.targetDate}` : 'No target date'}</ThemedText></View>
                  <ThemedText type="smallBold" style={[styles.percent, { color: theme.primary }]}>{(progress * 100).toFixed(0)}%</ThemedText>
                </View>
                <View style={styles.amountRow}><ThemedText style={[styles.savedAmount, { color: theme.primary }]}>{money(goal.currentAmount)} saved</ThemedText><ThemedText themeColor="textSecondary" style={styles.targetAmount}>of {money(goal.targetAmount)}</ThemedText></View>
                <View style={styles.track}><View style={[styles.fill, { width: `${progress * 100}%`, backgroundColor: theme.primary }]} /></View>
                <ThemedText themeColor="textSecondary" style={styles.remaining}>{money(Math.max(goal.targetAmount - goal.currentAmount, 0))} remaining</ThemedText>
                <View style={styles.actions}>
                  <Pressable style={styles.editButton} onPress={() => startEdit(goal)}><Ionicons name="create-outline" size={18} color="#F57C00" /><ThemedText type="smallBold" style={styles.editText}>Edit</ThemedText></Pressable>
                  <Pressable style={styles.deleteButton} onPress={() => setGoalToDelete(goal)}><Ionicons name="trash-outline" size={18} color="#D32F2F" /><ThemedText type="smallBold" style={styles.deleteText}>Delete</ThemedText></Pressable>
                </View>
              </View>
            );
          })}
        </ScrollView>
        <ScreenNav />

        <Modal visible={formOpen} transparent animationType="slide" statusBarTranslucent onRequestClose={resetForm}>
          <Pressable style={styles.backdrop} onPress={resetForm}>
            <Pressable style={[styles.formModal, { backgroundColor: theme.backgroundElement }]} onPress={(event) => event.stopPropagation()}>
              <View style={styles.modalHeader}><View><ThemedText type="subtitle" style={styles.modalTitle}>{editingGoal ? 'Edit savings goal' : 'Create savings goal'}</ThemedText><ThemedText themeColor="textSecondary" style={styles.subtitle}>Set a target and track every step</ThemedText></View><Pressable style={styles.closeButton} onPress={resetForm}><Ionicons name="close" size={22} color="#68756F" /></Pressable></View>
              <ScrollView contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
                <ThemedText type="smallBold">Goal name</ThemedText>
                <TextInput style={styles.input} placeholder="e.g. Emergency fund" value={title} onChangeText={setTitle} />
                <ThemedText type="smallBold">Target amount ({currency})</ThemedText>
                <TextInput style={styles.input} placeholder="100000" keyboardType="decimal-pad" value={targetAmount} onChangeText={setTargetAmount} />
                <ThemedText type="smallBold">Already saved ({currency})</ThemedText>
                <TextInput style={styles.input} placeholder="0" keyboardType="decimal-pad" value={currentAmount} onChangeText={setCurrentAmount} />
                <ThemedText type="smallBold">Target date (optional)</ThemedText>
                <DateField value={targetDate} onChange={setTargetDate} placeholder="Select target date" />
                {error ? <View style={styles.errorBox}><Ionicons name="alert-circle-outline" size={18} color="#D32F2F" /><ThemedText style={styles.error}>{error}</ThemedText></View> : null}
                <Pressable style={[styles.primaryButton, { backgroundColor: theme.primary }]} onPress={saveGoal}><ThemedText type="smallBold" style={styles.white}>{editingGoal ? 'Update goal' : 'Create goal'}</ThemedText></Pressable>
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>

        <Modal visible={Boolean(goalToDelete)} transparent animationType="fade" statusBarTranslucent onRequestClose={() => !isDeleting && setGoalToDelete(null)}>
          <Pressable style={styles.backdrop} onPress={() => !isDeleting && setGoalToDelete(null)}>
            <Pressable style={[styles.confirmModal, { backgroundColor: theme.backgroundElement }]} onPress={(event) => event.stopPropagation()}>
              <View style={styles.trashIcon}><Ionicons name="trash-outline" size={29} color="#D32F2F" /></View>
              <ThemedText type="subtitle" style={styles.confirmTitle}>Delete savings goal?</ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.confirmMessage}>This goal and its progress will be permanently removed from your device and database.</ThemedText>
              {goalToDelete ? <View style={styles.deleteSummary}><View><ThemedText type="smallBold">{goalToDelete.title}</ThemedText><ThemedText themeColor="textSecondary" style={styles.goalDate}>{money(goalToDelete.currentAmount)} saved</ThemedText></View><ThemedText type="smallBold" style={styles.targetGreen}>{money(goalToDelete.targetAmount)}</ThemedText></View> : null}
              <View style={styles.confirmActions}><Pressable style={styles.keepButton} onPress={() => setGoalToDelete(null)} disabled={isDeleting}><ThemedText type="smallBold">Keep goal</ThemedText></Pressable><Pressable style={styles.confirmDelete} onPress={confirmDelete} disabled={isDeleting}>{isDeleting ? <ActivityIndicator color="#FFFFFF" /> : <><Ionicons name="trash-outline" size={18} color="#FFFFFF" /><ThemedText type="smallBold" style={styles.white}>Delete</ThemedText></>}</Pressable></View>
            </Pressable>
          </Pressable>
        </Modal>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 }, safeArea: { flex: 1, maxWidth: MaxContentWidth, alignSelf: 'center', width: '100%' },
  content: { paddingHorizontal: Spacing.three, paddingTop: Spacing.three, paddingBottom: BottomTabInset + 120, gap: 14 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, pageTitle: { fontSize: 27, lineHeight: 35 }, subtitle: { fontSize: 11, lineHeight: 16 },
  addButton: { width: 46, height: 46, borderRadius: 15, backgroundColor: '#0F9D58', alignItems: 'center', justifyContent: 'center', elevation: 4 },
  summaryCard: { backgroundColor: '#078447', borderRadius: 22, padding: 18 }, summaryLabel: { color: '#DDF5E8', fontSize: 12 }, summaryValue: { color: '#FFFFFF', fontSize: 26, lineHeight: 34 }, summaryTarget: { color: '#DDF5E8', fontSize: 11, marginTop: 3 },
  summaryTrack: { height: 8, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.2)', overflow: 'hidden', marginTop: 14 }, summaryFill: { height: '100%', backgroundColor: '#FFC107', borderRadius: 8 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, sectionTitle: { fontSize: 16 }, goalCount: { fontSize: 11 },
  emptyCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 28, alignItems: 'center', gap: 7, borderWidth: 1, borderColor: '#ECE9DF' }, emptyIcon: { width: 58, height: 58, borderRadius: 20, backgroundColor: '#EAF7F0', alignItems: 'center', justifyContent: 'center' }, emptyText: { fontSize: 12, textAlign: 'center' }, emptyButton: { marginTop: 8, minHeight: 42, borderRadius: 13, backgroundColor: '#0F9D58', paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 6 },
  goalCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 15, borderWidth: 1, borderColor: '#ECE9DF' }, goalHeader: { flexDirection: 'row', alignItems: 'center' }, goalIcon: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#EAF7F0', alignItems: 'center', justifyContent: 'center' }, goalCopy: { flex: 1, paddingHorizontal: 10 }, goalTitle: { fontSize: 15 }, goalDate: { fontSize: 10, lineHeight: 15 }, percent: { color: '#0F9D58', fontSize: 15 },
  amountRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }, savedAmount: { color: '#0F9D58', fontSize: 12, fontWeight: '700' }, targetAmount: { fontSize: 10 }, track: { height: 9, backgroundColor: '#F0EEE8', borderRadius: 9, overflow: 'hidden', marginTop: 8 }, fill: { height: '100%', backgroundColor: '#0F9D58', borderRadius: 9 }, remaining: { fontSize: 10, marginTop: 5 },
  actions: { borderTopWidth: 1, borderTopColor: '#F0EEE8', marginTop: 12, paddingTop: 10, flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }, editButton: { minHeight: 36, borderRadius: 11, paddingHorizontal: 12, backgroundColor: '#FFF0DC', flexDirection: 'row', alignItems: 'center', gap: 5 }, editText: { color: '#F57C00' }, deleteButton: { minHeight: 36, borderRadius: 11, paddingHorizontal: 12, backgroundColor: '#FFE8E5', flexDirection: 'row', alignItems: 'center', gap: 5 }, deleteText: { color: '#D32F2F' },
  backdrop: { flex: 1, backgroundColor: 'rgba(16,31,24,0.48)', justifyContent: 'center', paddingHorizontal: 24 }, formModal: { height: '82%', backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20 }, modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, modalTitle: { fontSize: 21, lineHeight: 28 }, closeButton: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#F7F8FA', alignItems: 'center', justifyContent: 'center' }, formContent: { paddingTop: 18, paddingBottom: 8, gap: 11 },
  input: { minHeight: 48, borderWidth: 1, borderColor: '#FFC107', borderRadius: 12, paddingHorizontal: 12, backgroundColor: '#FFFFFF', color: '#212121' }, primaryButton: { minHeight: 48, backgroundColor: '#0F9D58', borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 3 }, white: { color: '#FFFFFF' },
  errorBox: { backgroundColor: '#FFF0F0', borderRadius: 12, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 7 }, error: { color: '#D32F2F', fontSize: 12, flex: 1 },
  confirmModal: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 22, alignItems: 'center', gap: 12 }, trashIcon: { width: 58, height: 58, borderRadius: 20, backgroundColor: '#FFE8E5', alignItems: 'center', justifyContent: 'center' }, confirmTitle: { fontSize: 21, lineHeight: 28 }, confirmMessage: { fontSize: 13, lineHeight: 19, textAlign: 'center' }, deleteSummary: { width: '100%', backgroundColor: '#F7F8FA', borderRadius: 15, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, targetGreen: { color: '#0F9D58' },
  confirmActions: { width: '100%', flexDirection: 'row', gap: 10, marginTop: 4 }, keepButton: { flex: 1, minHeight: 48, borderRadius: 14, borderWidth: 1, borderColor: '#DDE5E1', alignItems: 'center', justifyContent: 'center' }, confirmDelete: { flex: 1, minHeight: 48, borderRadius: 14, backgroundColor: '#D32F2F', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
});
