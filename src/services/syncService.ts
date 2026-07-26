import { deleteDoc, doc, setDoc } from 'firebase/firestore';

import {
    deleteTransaction,
    getPendingTransactions,
    markTransactionFailed,
    markTransactionSynced,
} from '../database/transactionQueries';
import {
  deleteBudget,
  deleteSavingsGoal,
  getPendingBudgets,
  getPendingSavingsGoals,
  updateBudgetSyncStatus,
  updateSavingsGoalSyncStatus,
} from '../database/walletQueries';
import { firestore } from './firebase';

let syncInProgress = false;
let budgetSyncInProgress = false;
let savingsSyncInProgress = false;

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
