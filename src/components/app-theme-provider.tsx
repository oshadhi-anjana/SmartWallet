import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

import { AppThemeName, AppThemes } from '@/constants/theme';

const STORAGE_KEY = 'smartwallet.theme';

type AppThemeContextValue = {
  themeName: AppThemeName;
  theme: (typeof AppThemes)[AppThemeName];
  setThemeName: (theme: AppThemeName) => void;
};

const AppThemeContext = createContext<AppThemeContextValue | null>(null);

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const [themeName, setThemeState] = useState<AppThemeName>('asia-light');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved && saved in AppThemes) setThemeState(saved as AppThemeName);
    }).catch(() => undefined);
  }, []);

  function setThemeName(value: AppThemeName) {
    setThemeState(value);
    AsyncStorage.setItem(STORAGE_KEY, value).catch(() => undefined);
  }

  const value = useMemo(() => ({ themeName, theme: AppThemes[themeName], setThemeName }), [themeName]);
  return <AppThemeContext.Provider value={value}>{children}</AppThemeContext.Provider>;
}

export function useAppTheme() {
  const value = useContext(AppThemeContext);
  if (!value) throw new Error('useAppTheme must be used inside AppThemeProvider.');
  return value;
}
