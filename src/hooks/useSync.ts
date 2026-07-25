import { useEffect } from 'react';

import { syncPendingTransactions } from '../services/syncService';
import { useNetworkStatus } from './useNetworkStatus';

export function useSync() {
  const isOnline = useNetworkStatus();

  useEffect(() => {
    if (isOnline) {
      syncPendingTransactions().catch((error) => {
        console.error('Synchronization failed:', error);
      });
    }
  }, [isOnline]);

  return isOnline;
}
