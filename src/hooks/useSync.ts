import { useEffect } from 'react';

import { syncPendingBudgets, syncPendingSavingsGoals, syncPendingTransactions } from '../services/syncService';
import { useNetworkStatus } from './useNetworkStatus';

export function useSync() {
  const isOnline = useNetworkStatus();

  useEffect(() => {
    if (isOnline) {
      Promise.all([syncPendingTransactions(), syncPendingBudgets(), syncPendingSavingsGoals()]).catch((error) => {
        console.error('Synchronization failed:', error);
      });
    }
  }, [isOnline]);

  return isOnline;
}
