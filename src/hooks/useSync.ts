import { useEffect } from 'react';

import { refreshWalletData } from '../services/syncService';
import { auth } from '../services/firebase';
import { useNetworkStatus } from './useNetworkStatus';

export function useSync() {
  const isOnline = useNetworkStatus();

  useEffect(() => {
    if (isOnline) {
      refreshWalletData(auth.currentUser?.uid ?? 'local-user').catch((error) => {
        console.error('Synchronization failed:', error);
      });
    }
  }, [isOnline]);

  return isOnline;
}
