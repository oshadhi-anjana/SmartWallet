import { doc, setDoc } from 'firebase/firestore';

import {
    getPendingTransactions,
    markTransactionFailed,
    markTransactionSynced,
} from '../database/transactionQueries';
import { firestore } from './firebase';

let syncInProgress = false;

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
