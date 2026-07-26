import { useEffect } from 'react';

import { syncPendingBudgets, syncPendingTransactions } from '../services/syncService';
import { useNetworkStatus } from './useNetworkStatus';

export function useSync() {
  const isOnline = useNetworkStatus();

  useEffect(() => {
    if (isOnline) {
      Promise.all([syncPendingTransactions(), syncPendingBudgets()]).catch((error) => {
        console.error('Synchronization failed:', error);
      });
    }
  }, [isOnline]);

  return isOnline;
}
