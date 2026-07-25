import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';

export default function SavingsScreen() {
  const [title, setTitle] = useState('Emergency Fund');
  const [targetAmount, setTargetAmount] = useState('1000');
  const [currentAmount, setCurrentAmount] = useState('250');
  const [targetDate, setTargetDate] = useState('2026-12-31');

  const progress = useMemo(() => {
    const target = Number(targetAmount) || 0;
    return target > 0 ? Math.min((Number(currentAmount) / target) * 100, 100) : 0;
  }, [currentAmount, targetAmount]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText type="subtitle">Savings goals</ThemedText>
          <ThemedText themeColor="textSecondary">Track your progress and add money toward each goal.</ThemedText>

          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold">Goal title</ThemedText>
            <TextInput style={styles.input} value={title} onChangeText={setTitle} />

            <ThemedText type="smallBold">Target amount</ThemedText>
            <TextInput style={styles.input} value={targetAmount} onChangeText={setTargetAmount} keyboardType="decimal-pad" />

            <ThemedText type="smallBold">Current amount</ThemedText>
            <TextInput style={styles.input} value={currentAmount} onChangeText={setCurrentAmount} keyboardType="decimal-pad" />

            <ThemedText type="smallBold">Target date</ThemedText>
            <TextInput style={styles.input} value={targetDate} onChangeText={setTargetDate} />

            <Pressable style={styles.primaryButton}>
              <ThemedText type="smallBold" style={styles.buttonText}>Add to goal</ThemedText>
            </Pressable>
          </ThemedView>

          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold">Progress</ThemedText>
            <ThemedText type="title">{progress.toFixed(0)}%</ThemedText>
            <ThemedText themeColor="textSecondary">Current: LKR {Number(currentAmount).toFixed(2)} • Target: LKR {Number(targetAmount).toFixed(2)}</ThemedText>
          </ThemedView>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.three,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  content: { gap: Spacing.three, paddingVertical: Spacing.four },
  card: { borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.two },
  input: {
    borderWidth: 1,
    borderColor: '#d0d7de',
    borderRadius: 10,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    backgroundColor: '#ffffff',
  },
  primaryButton: {
    backgroundColor: '#3c87f7',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: 999,
    alignItems: 'center',
  },
  buttonText: { color: '#ffffff' },
});
