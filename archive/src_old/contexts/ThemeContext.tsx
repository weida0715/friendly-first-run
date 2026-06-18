"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeColor =
  | 'cyan'
  | 'emerald'
  | 'violet'
  | 'amber'
  | 'rose'
  | 'blue'
  | 'sunset'
  | 'midnight'
  | 'aurora';
export type ThemeMode = 'dark' | 'light';
export type ThemeVariant = `${ThemeColor}-${ThemeMode}`;

interface ThemeContextType {
  color: ThemeColor;
  mode: ThemeMode;
  setColor: (color: ThemeColor) => void;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const themeColors: { id: ThemeColor; name: string; primary: string }[] = [
  { id: 'cyan', name: 'Electric Cyan', primary: 'hsl(187 85% 53%)' },
  { id: 'emerald', name: 'Matrix Green', primary: 'hsl(142 76% 45%)' },
  { id: 'violet', name: 'Cosmic Purple', primary: 'hsl(263 70% 58%)' },
  { id: 'amber', name: 'Golden Hour', primary: 'hsl(38 92% 50%)' },
  { id: 'rose', name: 'Neon Rose', primary: 'hsl(346 77% 55%)' },
  { id: 'blue', name: 'Deep Ocean', primary: 'hsl(217 91% 60%)' },
  { id: 'sunset', name: 'Solar Sunset', primary: 'hsl(18 94% 58%)' },
  { id: 'midnight', name: 'Midnight Iris', primary: 'hsl(241 70% 62%)' },
  { id: 'aurora', name: 'Aurora Teal', primary: 'hsl(174 82% 48%)' },
];

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [color, setColor] = useState<ThemeColor>('cyan');
  const [mode, setMode] = useState<ThemeMode>('dark');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const savedColor = window.localStorage?.getItem('loop-theme-color') as ThemeColor | null;
      const savedMode = window.localStorage?.getItem('loop-theme-mode') as ThemeMode | null;
      if (savedColor) setColor(savedColor);
      if (savedMode) setMode(savedMode);
    } catch {
      // Ignore localStorage access issues
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('loop-theme-color', color);
    localStorage.setItem('loop-theme-mode', mode);
    document.documentElement.setAttribute('data-theme', color);
    document.documentElement.setAttribute('data-mode', mode);
  }, [color, mode]);

  return (
    <ThemeContext.Provider value={{ color, mode, setColor, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
