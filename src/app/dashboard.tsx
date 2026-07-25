import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';

export default function DashboardScreen() {
  const router = useRouter();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText type="subtitle">Dashboard</ThemedText>
          <ThemedText themeColor="textSecondary">
            Your money snapshot for the week.
          </ThemedText>

          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold">Balance</ThemedText>
            <ThemedText type="title">$4,280</ThemedText>
            <ThemedText themeColor="textSecondary">+12% from last month</ThemedText>
          </ThemedView>

          <ThemedView style={styles.grid}>
            <Pressable style={styles.tile} onPress={() => router.push('/transactions' as never)}>
              <ThemedText type="smallBold">Transactions</ThemedText>
              <ThemedText themeColor="textSecondary">Recent activity</ThemedText>
            </Pressable>
            <Pressable style={styles.tile} onPress={() => router.push('/budgets' as never)}>
              <ThemedText type="smallBold">Budgets</ThemedText>
              <ThemedText themeColor="textSecondary">Monthly limits</ThemedText>
            </Pressable>
            <Pressable style={styles.tile} onPress={() => router.push('/savings' as never)}>
              <ThemedText type="smallBold">Savings</ThemedText>
              <ThemedText themeColor="textSecondary">Goals</ThemedText>
            </Pressable>
            <Pressable style={styles.tile} onPress={() => router.push('/analytics' as never)}>
              <ThemedText type="smallBold">Analytics</ThemedText>
              <ThemedText themeColor="textSecondary">Insights</ThemedText>
            </Pressable>
          </ThemedView>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
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
    gap: Spacing.three,
    paddingVertical: Spacing.four,
  },
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  tile: {
    backgroundColor: '#3c87f7',
    minWidth: '45%',
    padding: Spacing.three,
    borderRadius: Spacing.two,
    gap: Spacing.one,
  },
});
