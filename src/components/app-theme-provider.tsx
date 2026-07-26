import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

import { AppThemeName, AppThemes } from '@/constants/theme';

const STORAGE_KEY = 'smartwallet.theme';

type AppThemeContextValue = {
  themeName: AppThemeName;
  theme: (typeof AppThemes)[AppThemeName];
  setThemeName: (theme: AppThemeName) => void;
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
  formatCurrency: (value: number) => string;
};

export type CurrencyCode = 'LKR' | 'USD' | 'EUR';

const AppThemeContext = createContext<AppThemeContextValue | null>(null);

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const [themeName, setThemeState] = useState<AppThemeName>('asia-light');
  const [currency, setCurrencyState] = useState<CurrencyCode>('LKR');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved && saved in AppThemes) setThemeState(saved as AppThemeName);
    }).catch(() => undefined);
    AsyncStorage.getItem('smartwallet.currency').then((saved) => {
      if (saved === 'LKR' || saved === 'USD' || saved === 'EUR') setCurrencyState(saved);
    }).catch(() => undefined);
  }, []);

  function setThemeName(value: AppThemeName) {
    setThemeState(value);
    AsyncStorage.setItem(STORAGE_KEY, value).catch(() => undefined);
  }

  function setCurrency(value: CurrencyCode) {
    setCurrencyState(value);
    AsyncStorage.setItem('smartwallet.currency', value).catch(() => undefined);
  }

  const value = useMemo(() => ({
    themeName,
    theme: AppThemes[themeName],
    setThemeName,
    currency,
    setCurrency,
    formatCurrency: (amount: number) => new Intl.NumberFormat(
      currency === 'LKR' ? 'en-LK' : currency === 'EUR' ? 'en-IE' : 'en-US',
      { style: 'currency', currency, currencyDisplay: 'code', minimumFractionDigits: 2, maximumFractionDigits: 2 }
    ).format(amount),
  }), [currency, themeName]);
  return <AppThemeContext.Provider value={value}>{children}</AppThemeContext.Provider>;
}

export function useAppTheme() {
  const value = useContext(AppThemeContext);
  if (!value) throw new Error('useAppTheme must be used inside AppThemeProvider.');
  return value;
}
