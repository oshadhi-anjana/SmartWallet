import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { insertTransaction } from '@/database/transactionQueries';
import { Transaction } from '@/models/Transaction';
import { auth } from '@/services/firebase';
import { createId } from '@/utils/id';

const categoryOptions = ['Food', 'Transport', 'Bills', 'Shopping', 'Salary', 'Freelance', 'Entertainment', 'Health'];

export default function AddTransactionScreen() {
  const router = useRouter();
  const [type, setType] = useState<Transaction['type']>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState('');
  const [receiptUri, setReceiptUri] = useState<string | undefined>();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handlePickReceipt() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setError('Permission to access your photo library is required.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setReceiptUri(result.assets[0].uri);
      setError('');
    }
  }

  async function handleSave() {
    setError('');

    const parsedAmount = Number(amount);
    if (!amount || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Enter a valid amount.');
      return;
    }

    setLoading(true);

    try {
      const now = new Date().toISOString();
      const transaction: Transaction = {
        id: createId(),
        userId: auth.currentUser?.uid ?? 'local-user',
        type,
        amount: parsedAmount,
        category,
        description: description.trim() || undefined,
        transactionDate,
        receiptUri,
        syncStatus: 'pending',
        createdAt: now,
        updatedAt: now,
      };

      await insertTransaction(transaction);
      router.replace('/transactions' as never);
    } catch (saveError) {
      console.error('Failed to save transaction', saveError);
      setError('Unable to save the transaction right now.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="subtitle">Add transaction</ThemedText>
            <ThemedText themeColor="textSecondary">
              Save locally first, then sync when the connection is available.
            </ThemedText>

            <ThemedText type="smallBold">Type</ThemedText>
            <ThemedView style={styles.typeRow}>
              <Pressable
                style={[styles.typeButton, type === 'income' && styles.typeButtonActive]}
                onPress={() => setType('income')}>
                <ThemedText type="smallBold" style={type === 'income' ? styles.activeText : undefined}>
                  Income
                </ThemedText>
              </Pressable>
              <Pressable
                style={[styles.typeButton, type === 'expense' && styles.typeButtonActive]}
                onPress={() => setType('expense')}>
                <ThemedText type="smallBold" style={type === 'expense' ? styles.activeText : undefined}>
                  Expense
                </ThemedText>
              </Pressable>
            </ThemedView>

            <ThemedText type="smallBold">Amount</ThemedText>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              keyboardType="decimal-pad"
            />

            <ThemedText type="smallBold">Category</ThemedText>
            <TextInput
              style={styles.input}
              value={category}
              onChangeText={setCategory}
              placeholder="Food"
            />

            <ThemedText type="smallBold">Date</ThemedText>
            <TextInput
              style={styles.input}
              value={transactionDate}
              onChangeText={setTransactionDate}
              placeholder="YYYY-MM-DD"
            />

            <ThemedText type="smallBold">Description</ThemedText>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="What was this for?"
              multiline
            />

            <Pressable style={styles.secondaryButton} onPress={handlePickReceipt}>
              <ThemedText type="smallBold">Add receipt image</ThemedText>
            </Pressable>
            {receiptUri ? <ThemedText themeColor="textSecondary">Receipt selected.</ThemedText> : null}

            {error ? <ThemedText themeColor="textSecondary" style={styles.errorText}>{error}</ThemedText> : null}

            <Pressable style={styles.primaryButton} onPress={handleSave} disabled={loading}>
              {loading ? <ActivityIndicator color="#ffffff" /> : <ThemedText type="smallBold" style={styles.buttonText}>Save transaction</ThemedText>}
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
    paddingVertical: Spacing.four,
  },
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  typeRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  typeButton: {
    flex: 1,
    paddingVertical: Spacing.two,
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#3c87f7',
  },
  typeButtonActive: {
    backgroundColor: '#3c87f7',
  },
  activeText: {
    color: '#ffffff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d0d7de',
    borderRadius: 10,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    backgroundColor: '#ffffff',
  },
  textArea: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  secondaryButton: {
    paddingVertical: Spacing.two,
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#3c87f7',
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
  errorText: {
    color: '#d14343',
  },
});
