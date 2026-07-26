import { collection, deleteDoc, doc, getDocs, setDoc } from 'firebase/firestore';

import {
    deleteTransaction,
    getPendingTransactions,
    insertTransaction,
    markTransactionFailed,
    markTransactionSynced,
} from '../database/transactionQueries';
import {
  deleteBudget,
  deleteSavingsGoal,
  getPendingBudgets,
  getPendingSavingsGoals,
  saveBudget,
  saveSavingsGoal,
  updateBudgetSyncStatus,
  updateSavingsGoalSyncStatus,
} from '../database/walletQueries';
import { Budget } from '../models/Budget';
import { SavingsGoal } from '../models/SavingsGoal';
import { Transaction } from '../models/Transaction';
import { firestore } from './firebase';

let syncInProgress = false;
let budgetSyncInProgress = false;
let savingsSyncInProgress = false;
let refreshPromise: Promise<void> | null = null;

export async function deleteTransactionEverywhere(userId: string, transactionId: string) {
  if (userId !== 'local-user') {
    const transactionRef = doc(
      firestore,
      'users',
      userId,
      'transactions',
      transactionId
    );
    await deleteDoc(transactionRef);
  }

  await deleteTransaction(transactionId);
}

export async function deleteBudgetEverywhere(userId: string, budgetId: string) {
  if (userId !== 'local-user') {
    await deleteDoc(doc(firestore, 'users', userId, 'budgets', budgetId));
  }
  await deleteBudget(budgetId);
}

export async function syncPendingBudgets() {
  if (budgetSyncInProgress) return;
  budgetSyncInProgress = true;

  try {
    const budgets = await getPendingBudgets();
    for (const budget of budgets) {
      if (budget.userId === 'local-user') continue;
      try {
        await setDoc(
          doc(firestore, 'users', budget.userId, 'budgets', budget.id),
          { ...budget, syncStatus: 'synced' },
          { merge: true }
        );
        await updateBudgetSyncStatus(budget.id, 'synced');
      } catch (error) {
        console.error('Failed to sync budget', budget.id, error);
        await updateBudgetSyncStatus(budget.id, 'failed');
      }
    }
  } finally {
    budgetSyncInProgress = false;
  }
}

export async function deleteSavingsGoalEverywhere(userId: string, goalId: string) {
  if (userId !== 'local-user') {
    await deleteDoc(doc(firestore, 'users', userId, 'savingsGoals', goalId));
  }
  await deleteSavingsGoal(goalId);
}

export async function syncPendingSavingsGoals() {
  if (savingsSyncInProgress) return;
  savingsSyncInProgress = true;
  try {
    const goals = await getPendingSavingsGoals();
    for (const goal of goals) {
      if (goal.userId === 'local-user') continue;
      try {
        await setDoc(
          doc(firestore, 'users', goal.userId, 'savingsGoals', goal.id),
          { ...goal, syncStatus: 'synced' },
          { merge: true }
        );
        await updateSavingsGoalSyncStatus(goal.id, 'synced');
      } catch (error) {
        console.error('Failed to sync savings goal', goal.id, error);
        await updateSavingsGoalSyncStatus(goal.id, 'failed');
      }
    }
  } finally {
    savingsSyncInProgress = false;
  }
}

export async function pullRemoteWalletData(userId: string) {
  if (userId === 'local-user') return;

  try {
    const [transactionSnapshot, budgetSnapshot, savingsSnapshot] = await Promise.all([
      getDocs(collection(firestore, 'users', userId, 'transactions')),
      getDocs(collection(firestore, 'users', userId, 'budgets')),
      getDocs(collection(firestore, 'users', userId, 'savingsGoals')),
    ]);

    await Promise.all([
      ...transactionSnapshot.docs.map((snapshot) => {
        const remote = snapshot.data() as Transaction;
        return insertTransaction({
          ...remote,
          id: snapshot.id,
          userId,
          syncStatus: 'synced',
        });
      }),
      ...budgetSnapshot.docs.map((snapshot) => {
        const remote = snapshot.data() as Budget;
        return saveBudget({
          ...remote,
          id: snapshot.id,
          userId,
          syncStatus: 'synced',
        });
      }),
      ...savingsSnapshot.docs.map((snapshot) => {
        const remote = snapshot.data() as SavingsGoal;
        return saveSavingsGoal({
          ...remote,
          id: snapshot.id,
          userId,
          syncStatus: 'synced',
        });
      }),
    ]);
  } catch (error) {
    // Offline users continue using SQLite; the next online refresh will retry.
    console.info('Cloud wallet data is unavailable. Using local records.', error);
  }
}

export async function refreshWalletData(userId: string) {
  if (userId === 'local-user') return;
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    await Promise.all([
      syncPendingTransactions(),
      syncPendingBudgets(),
      syncPendingSavingsGoals(),
    ]);
    await pullRemoteWalletData(userId);
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

export async function syncPendingTransactions() {
  if (syncInProgress) {
    return;
  }

  syncInProgress = true;

  try {
    const transactions = await getPendingTransactions();

    for (const transaction of transactions) {
      const transactionRef = doc(
        firestore,
        'users',
        transaction.userId,
        'transactions',
        transaction.id
      );

      try {
        await setDoc(
          transactionRef,
          {
            ...transaction,
            syncStatus: 'synced',
          },
          { merge: true }
        );

        await markTransactionSynced(transaction.id);
      } catch (error) {
        console.error('Failed to sync transaction', transaction.id, error);
        await markTransactionFailed(transaction.id);
      }
    }
  } finally {
    syncInProgress = false;
  }
}
