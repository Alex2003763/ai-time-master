import React, { createContext, useState, useEffect, useContext } from 'react';

export const THEMES = [
  { id: 'light', name: 'Original Light', type: 'light' as const, colors: ['#0ea5e9', '#8b5cf6'] },
  { id: 'dark', name: 'Original Dark', type: 'dark' as const, colors: ['#22d3ee', '#a855f7'] },
  { id: 'twilight-glow', name: 'Twilight Glow', type: 'dark' as const, colors: ['#f472b6', '#c084fc', '#60a5fa'] },
  { id: 'minty-fresh', name: 'Minty Fresh', type: 'light' as const, colors: ['#2dd4bf', '#34d399', '#6ee7b7'] },
  { id: 'crimson-night', name: 'Crimson Night', type: 'dark' as const, colors: ['#f87171', '#fb923c', '#facc15'] },
  { id: 'ocean-breeze', name: 'Ocean Breeze', type: 'light' as const, colors: ['#38bdf8', '#22d3ee', '#4ade80'] }
];

interface ThemeContextType {
  theme: string;
  setTheme: (theme: string) => void;
  themeType: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<string>(() => {
    try {
      const savedTheme = window.localStorage.getItem('theme');
      if (savedTheme && THEMES.some(t => t.id === savedTheme)) {
        return savedTheme;
      }
      const userPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      return userPrefersDark ? 'dark' : 'light';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    document.body.dataset.theme = theme;
    try {
      window.localStorage.setItem('theme', theme);
    } catch (e) {
      console.error('Failed to save theme to localStorage', e);
    }
  }, [theme]);

  const setTheme = (newTheme: string) => {
    if (THEMES.some(t => t.id === newTheme)) {
        setThemeState(newTheme);
    }
  };

  const themeType = THEMES.find(t => t.id === theme)?.type || 'dark';

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themeType }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};