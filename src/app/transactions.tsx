import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';

export default function TransactionsScreen() {
  const router = useRouter();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText type="subtitle">Transactions</ThemedText>
          <ThemedText themeColor="textSecondary">Your recent activity.</ThemedText>

          {['Groceries', 'Transport', 'Coffee'].map((item) => (
            <ThemedView key={item} type="backgroundElement" style={styles.item}>
              <ThemedText type="smallBold">{item}</ThemedText>
              <ThemedText themeColor="textSecondary">Today • $24.50</ThemedText>
            </ThemedView>
          ))}

          <Pressable style={styles.primaryButton} onPress={() => router.push('/add-transaction' as never)}>
            <ThemedText type="smallBold" style={styles.buttonText}>
              Add a transaction
            </ThemedText>
          </Pressable>
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
    gap: Spacing.two,
    paddingVertical: Spacing.four,
  },
  item: {
    borderRadius: Spacing.two,
    padding: Spacing.three,
  },
  primaryButton: {
    backgroundColor: '#3c87f7',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: 999,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
  },
});
