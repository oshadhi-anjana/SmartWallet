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
  convertFromBase: (valueInLkr: number) => number;
  convertToBase: (displayValue: number) => number;
  exchangeRate: number | null;
  ratesUpdatedAt: string | null;
  refreshExchangeRates: () => Promise<void>;
};

export type CurrencyCode = 'LKR' | 'USD' | 'EUR';

const AppThemeContext = createContext<AppThemeContextValue | null>(null);
const RATES_KEY = 'smartwallet.exchangeRates';

type ExchangeRates = Record<CurrencyCode, number | null>;

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const [themeName, setThemeState] = useState<AppThemeName>('asia-light');
  const [currency, setCurrencyState] = useState<CurrencyCode>('LKR');
  const [rates, setRates] = useState<ExchangeRates>({ LKR: 1, USD: null, EUR: null });
  const [ratesUpdatedAt, setRatesUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved && saved in AppThemes) setThemeState(saved as AppThemeName);
    }).catch(() => undefined);
    AsyncStorage.getItem('smartwallet.currency').then((saved) => {
      if (saved === 'LKR' || saved === 'USD' || saved === 'EUR') setCurrencyState(saved);
    }).catch(() => undefined);
    AsyncStorage.getItem(RATES_KEY).then((saved) => {
      if (!saved) return;
      const cached = JSON.parse(saved) as { rates?: Partial<ExchangeRates>; updatedAt?: string };
      setRates((current) => ({ ...current, ...cached.rates, LKR: 1 }));
      setRatesUpdatedAt(cached.updatedAt ?? null);
    }).catch(() => undefined);
    refreshExchangeRates().catch(() => undefined);
  }, []);

  function setThemeName(value: AppThemeName) {
    setThemeState(value);
    AsyncStorage.setItem(STORAGE_KEY, value).catch(() => undefined);
  }

  function setCurrency(value: CurrencyCode) {
    setCurrencyState(value);
    AsyncStorage.setItem('smartwallet.currency', value).catch(() => undefined);
  }

  async function refreshExchangeRates() {
    const [usdResponse, eurResponse] = await Promise.all([
      fetch('https://api.frankfurter.dev/v2/rate/LKR/USD'),
      fetch('https://api.frankfurter.dev/v2/rate/LKR/EUR'),
    ]);
    if (!usdResponse.ok || !eurResponse.ok) throw new Error('Exchange-rate service is unavailable.');

    const [usd, eur] = await Promise.all([
      usdResponse.json() as Promise<{ rate?: number; date?: string }>,
      eurResponse.json() as Promise<{ rate?: number; date?: string }>,
    ]);
    if (!usd.rate || !eur.rate || usd.rate <= 0 || eur.rate <= 0) throw new Error('Exchange-rate response is invalid.');

    const updatedAt = usd.date ?? eur.date ?? new Date().toISOString();
    const nextRates: ExchangeRates = { LKR: 1, USD: usd.rate, EUR: eur.rate };
    setRates(nextRates);
    setRatesUpdatedAt(updatedAt);
    await AsyncStorage.setItem(RATES_KEY, JSON.stringify({ rates: nextRates, updatedAt }));
  }

  const value = useMemo(() => ({
    themeName,
    theme: AppThemes[themeName],
    setThemeName,
    currency,
    setCurrency,
    formatCurrency: (amountInLkr: number) => {
      const rate = rates[currency];
      if (rate === null) return `${currency} …`;
      return new Intl.NumberFormat(
        currency === 'LKR' ? 'en-LK' : currency === 'EUR' ? 'en-IE' : 'en-US',
        { style: 'currency', currency, currencyDisplay: 'code', minimumFractionDigits: 2, maximumFractionDigits: 2 }
      ).format(amountInLkr * rate);
    },
    convertFromBase: (amountInLkr: number) => amountInLkr * (rates[currency] ?? 1),
    convertToBase: (displayAmount: number) => displayAmount / (rates[currency] ?? 1),
    exchangeRate: rates[currency],
    ratesUpdatedAt,
    refreshExchangeRates,
  }), [currency, rates, ratesUpdatedAt, themeName]);
  return <AppThemeContext.Provider value={value}>{children}</AppThemeContext.Provider>;
}

export function useAppTheme() {
  const value = useContext(AppThemeContext);
  if (!value) throw new Error('useAppTheme must be used inside AppThemeProvider.');
  return value;
}
