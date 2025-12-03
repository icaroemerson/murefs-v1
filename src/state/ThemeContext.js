// src/state/ThemeContext.js
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'themeMode';
const ThemeCtx = createContext(null);

export function ThemeProvider({ children }) {
  const [mode, setModeState] = useState('system');

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved === 'light' || saved === 'dark' || saved === 'system') {
          setModeState(saved);
        }
      } catch {}
    })();
  }, []);

  const setMode = useCallback(async (m) => {
    setModeState(m);
    try { await AsyncStorage.setItem(STORAGE_KEY, m); } catch {}
  }, []);

  const resolved = useMemo(() => {
    if (mode === 'system') return Appearance.getColorScheme() || 'light';
    return mode;
  }, [mode]);

  const value = useMemo(() => ({ mode, setMode, resolved }), [mode, setMode, resolved]);

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export function useThemeContext() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error('useThemeContext deve ser usado dentro de <ThemeProvider>.');
  return ctx;
}
