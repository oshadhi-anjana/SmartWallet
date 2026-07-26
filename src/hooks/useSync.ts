import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { refreshWalletData } from '../services/syncService';
import { auth } from '../services/firebase';
import { useNetworkStatus } from './useNetworkStatus';

export function useSync() {
  const isOnline = useNetworkStatus();
  const [userId, setUserId] = useState(auth.currentUser?.uid ?? 'local-user');

  useEffect(() => onAuthStateChanged(auth, (user) => {
    setUserId(user?.uid ?? 'local-user');
  }), []);

  useEffect(() => {
    if (!isOnline || userId === 'local-user') return;

    function synchronize() {
      refreshWalletData(userId).catch((error) => {
        console.error('Synchronization failed:', error);
      });
    }

    // Sync immediately after login and whenever connectivity returns.
    synchronize();

    // Pick up records created while the device remains continuously online.
    const timer = setInterval(synchronize, 30_000);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') synchronize();
    });

    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, [isOnline, userId]);

  return isOnline;
}
