import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAppTheme } from '@/components/app-theme-provider';
import { DateField } from '@/components/date-field';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { getTransaction, insertTransaction } from '@/database/transactionQueries';
import { Transaction } from '@/models/Transaction';
import { auth } from '@/services/firebase';
import { refreshWalletData } from '@/services/syncService';
import { createId } from '@/utils/id';

const categoryOptions = ['Food', 'Transport', 'Bills', 'Shopping', 'Salary', 'Freelance', 'Entertainment', 'Health'];

export default function AddTransactionScreen() {
  const router = useRouter();
  const { theme, currency, convertFromBase, convertToBase, exchangeRate } = useAppTheme();
  const scrollRef = useRef<ScrollView>(null);
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [type, setType] = useState<Transaction['type']>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState('');
  const [receiptUri, setReceiptUri] = useState<string | undefined>();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    getTransaction(id).then((item) => {
      if (!item) return;
      setType(item.type);
      setAmount(String(Number(convertFromBase(item.amount).toFixed(2))));
      setCategory(item.category);
      setTransactionDate(item.transactionDate);
      setDescription(item.description ?? '');
      setReceiptUri(item.receiptUri);
    }).catch(() => setError('Unable to load this transaction.'));
  }, [id]);

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

  async function handleCaptureReceipt() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setError('Camera permission is required to capture a receipt.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.65,
    });
    if (!result.canceled && result.assets[0]?.uri) {
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
    if (exchangeRate === null) {
      setError(`The ${currency} exchange rate is unavailable. Connect to the internet and try again.`);
      return;
    }

    setLoading(true);

    try {
      const now = new Date().toISOString();
      const existing = id ? await getTransaction(id) : null;
      const transaction: Transaction = {
        id: existing?.id ?? createId(),
        userId: auth.currentUser?.uid ?? 'local-user',
        type,
        amount: convertToBase(parsedAmount),
        category,
        description: description.trim() || undefined,
        transactionDate,
        receiptUri,
        syncStatus: 'pending',
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      };

      await insertTransaction(transaction);
      refreshWalletData(transaction.userId).catch((syncError) => {
        console.info('Transaction will sync automatically when online.', syncError);
      });
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
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}>
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            automaticallyAdjustKeyboardInsets
            showsVerticalScrollIndicator={false}>
          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="subtitle">{id ? 'Edit transaction' : 'Add transaction'}</ThemedText>
            <ThemedText themeColor="textSecondary">
              Save locally first, then sync when the connection is available.
            </ThemedText>

            <ThemedText type="smallBold">Type</ThemedText>
            <ThemedView style={styles.typeRow}>
              <Pressable
                style={[styles.typeButton, { borderColor: theme.primary }, type === 'income' && styles.typeButtonActive, type === 'income' && { backgroundColor: theme.primary }]}
                onPress={() => setType('income')}>
                <ThemedText type="smallBold" style={type === 'income' ? styles.activeText : undefined}>
                  Income
                </ThemedText>
              </Pressable>
              <Pressable
                style={[styles.typeButton, { borderColor: theme.primary }, type === 'expense' && styles.typeButtonActive, type === 'expense' && { backgroundColor: theme.primary }]}
                onPress={() => setType('expense')}>
                <ThemedText type="smallBold" style={type === 'expense' ? styles.activeText : undefined}>
                  Expense
                </ThemedText>
              </Pressable>
            </ThemedView>

            <ThemedText type="smallBold">Amount ({currency})</ThemedText>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              keyboardType="decimal-pad"
            />

            <ThemedText type="smallBold">Category</ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <ThemedView style={styles.categoryRow}>
                {categoryOptions.map((option) => (
                  <Pressable
                    key={option}
                    onPress={() => setCategory(option)}
                    style={[styles.categoryChip, { borderColor: theme.accent }, category === option && styles.typeButtonActive, category === option && { backgroundColor: theme.primary }]}>
                    <ThemedText type="small" style={category === option ? styles.activeText : undefined}>{option}</ThemedText>
                  </Pressable>
                ))}
              </ThemedView>
            </ScrollView>

            <ThemedText type="smallBold">Date</ThemedText>
            <DateField value={transactionDate} onChange={setTransactionDate} />

            <ThemedText type="smallBold">Description</ThemedText>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="What was this for?"
              multiline
              onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 250)}
            />

            <ThemedView style={styles.receiptActions}>
              <Pressable style={styles.secondaryButton} onPress={handleCaptureReceipt}>
                <ThemedText type="smallBold">Take photo</ThemedText>
              </Pressable>
              <Pressable style={styles.secondaryButton} onPress={handlePickReceipt}>
                <ThemedText type="smallBold">Choose photo</ThemedText>
              </Pressable>
            </ThemedView>
            {receiptUri ? <Image source={{ uri: receiptUri }} style={styles.receiptPreview} accessibilityLabel="Selected receipt" /> : null}

            {error ? <ThemedText themeColor="textSecondary" style={styles.errorText}>{error}</ThemedText> : null}

            <Pressable style={[styles.primaryButton, { backgroundColor: theme.primary }]} onPress={handleSave} disabled={loading}>
              {loading ? <ActivityIndicator color="#ffffff" /> : <ThemedText type="smallBold" style={styles.buttonText}>{id ? 'Update transaction' : 'Save transaction'}</ThemedText>}
            </Pressable>
          </ThemedView>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: { flex: 1 },
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
  categoryRow: { flexDirection: 'row', gap: Spacing.two },
  categoryChip: { borderWidth: 1, borderColor: '#FFC107', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  typeButton: {
    flex: 1,
    paddingVertical: Spacing.two,
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#0F9D58',
  },
  typeButtonActive: {
    backgroundColor: '#0F9D58',
  },
  activeText: {
    color: '#ffffff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#FFC107',
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
    flex: 1,
    paddingVertical: Spacing.two,
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#F57C00',
  },
  receiptActions: { flexDirection: 'row', gap: Spacing.two },
  receiptPreview: { width: '100%', height: 160, borderRadius: 12, resizeMode: 'cover' },
  primaryButton: {
    backgroundColor: '#0F9D58',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: 999,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
  },
  errorText: {
    color: '#D32F2F',
  },
});
