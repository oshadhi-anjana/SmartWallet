import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenNav } from '@/components/screen-nav';
import { DateField } from '@/components/date-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { deleteSavingsGoal, getSavingsGoals, saveSavingsGoal } from '@/database/walletQueries';
import { SavingsGoal } from '@/models/SavingsGoal';
import { auth } from '@/services/firebase';
import { createId } from '@/utils/id';

export default function SavingsScreen() {
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [error, setError] = useState('');
  const userId = auth.currentUser?.uid ?? 'local-user';
  const load = useCallback(async () => setGoals(await getSavingsGoals(userId)), [userId]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function addGoal() {
    const target = Number(targetAmount);
    const current = Number(currentAmount || 0);
    if (!title.trim() || target <= 0 || current < 0 || current > target) {
      setError('Enter a title and valid amounts. Saved amount cannot exceed the target.');
      return;
    }
    const now = new Date().toISOString();
    await saveSavingsGoal({
      id: createId(), userId, title: title.trim(), targetAmount: target, currentAmount: current,
      targetDate: targetDate || undefined, syncStatus: 'pending', createdAt: now, updatedAt: now,
    });
    setTitle(''); setTargetAmount(''); setCurrentAmount(''); setTargetDate(''); setError('');
    await load();
  }

  return <ThemedView style={styles.container}><SafeAreaView style={styles.safeArea}>
    <ScrollView contentContainerStyle={styles.content}>
      <ThemedText type="subtitle">Savings goals</ThemedText>
      <ThemedText themeColor="textSecondary">Create goals and track progress offline.</ThemedText>
      <ThemedView type="backgroundElement" style={styles.card}>
        <TextInput style={styles.input} placeholder="Goal name" value={title} onChangeText={setTitle} />
        <TextInput style={styles.input} placeholder="Target amount (LKR)" keyboardType="decimal-pad" value={targetAmount} onChangeText={setTargetAmount} />
        <TextInput style={styles.input} placeholder="Already saved (optional)" keyboardType="decimal-pad" value={currentAmount} onChangeText={setCurrentAmount} />
        <DateField value={targetDate} onChange={setTargetDate} placeholder="Select target date (optional)" />
        {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
        <Pressable style={styles.button} onPress={addGoal}><ThemedText type="smallBold" style={styles.white}>Create goal</ThemedText></Pressable>
      </ThemedView>
      {goals.length === 0 ? <ThemedView type="backgroundElement" style={styles.card}><ThemedText>No goals yet.</ThemedText></ThemedView> :
        goals.map((goal) => {
          const progress = Math.min(goal.currentAmount / goal.targetAmount, 1);
          return <ThemedView type="backgroundElement" style={styles.card} key={goal.id}>
            <ThemedView style={styles.row}><ThemedText type="smallBold">{goal.title}</ThemedText><ThemedText type="smallBold">{(progress * 100).toFixed(0)}%</ThemedText></ThemedView>
            <View style={styles.track}><View style={[styles.fill, { width: `${progress * 100}%` }]} /></View>
            <ThemedText themeColor="textSecondary">LKR {goal.currentAmount.toFixed(2)} of LKR {goal.targetAmount.toFixed(2)}</ThemedText>
            {goal.targetDate ? <ThemedText themeColor="textSecondary">Target: {goal.targetDate}</ThemedText> : null}
            <Pressable onPress={() => Alert.alert('Delete savings goal?', undefined, [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: async () => { await deleteSavingsGoal(goal.id); await load(); } },
            ])}><ThemedText style={styles.delete}>Delete</ThemedText></Pressable>
          </ThemedView>;
        })}
    </ScrollView>
    <ScreenNav />
  </SafeAreaView></ThemedView>;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: Spacing.four, paddingBottom: BottomTabInset + Spacing.three, maxWidth: MaxContentWidth, alignSelf: 'center', width: '100%' },
  content: { gap: Spacing.three, paddingVertical: Spacing.four },
  card: { borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.two },
  input: { borderWidth: 1, borderColor: '#FFC107', borderRadius: 12, padding: 12, backgroundColor: '#FFFFFF', color: '#212121' },
  button: { backgroundColor: '#0F9D58', borderRadius: 14, padding: 14, alignItems: 'center' },
  white: { color: '#FFFFFF' }, error: { color: '#D32F2F' }, delete: { color: '#D32F2F', textAlign: 'right' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  track: { height: 10, backgroundColor: '#F7F8FA', borderRadius: 99, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: '#0F9D58' },
});
