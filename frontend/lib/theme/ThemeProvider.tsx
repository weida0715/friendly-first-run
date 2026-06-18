"use client";

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

export const THEMES = ['cyan', 'emerald', 'violet', 'amber', 'rose', 'blue', 'sunset', 'midnight', 'aurora'] as const;
export type Theme = (typeof THEMES)[number];
export type Mode = 'dark' | 'light';

interface ThemeContextValue {
  theme: Theme;
  mode: Mode;
  setTheme: (t: Theme) => void;
  setMode: (m: Mode) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
const STORE_KEY = 'bee-theme';

function applyAttrs(theme: Theme, mode: Mode) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.setAttribute('data-theme', theme);
  root.setAttribute('data-mode', mode);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('cyan');
  const [mode, setModeState] = useState<Mode>('dark');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { theme?: Theme; mode?: Mode };
        if (parsed.theme && THEMES.includes(parsed.theme)) setThemeState(parsed.theme);
        if (parsed.mode === 'light' || parsed.mode === 'dark') setModeState(parsed.mode);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    applyAttrs(theme, mode);
    try { localStorage.setItem(STORE_KEY, JSON.stringify({ theme, mode })); } catch { /* ignore */ }
  }, [theme, mode]);

  const setTheme = useCallback((t: Theme) => setThemeState(t), []);
  const setMode = useCallback((m: Mode) => setModeState(m), []);
  const toggleMode = useCallback(() => setModeState((m) => (m === 'dark' ? 'light' : 'dark')), []);

  return (
    <ThemeContext.Provider value={{ theme, mode, setTheme, setMode, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}