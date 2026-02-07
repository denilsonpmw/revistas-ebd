import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const ThemeContext = createContext(null);

const allowedThemes = ['light', 'dark'];

const getStoredTheme = () => {
  if (typeof window === 'undefined') return 'light';
  try {
    const stored = localStorage.getItem('theme');
    return allowedThemes.includes(stored) ? stored : 'light';
  } catch (err) {
    return 'light';
  }
};

const getSystemTheme = () => 'light';

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getStoredTheme);
  const [resolvedTheme, setResolvedTheme] = useState(() => theme);

  useEffect(() => {
    const applyTheme = () => {
      const nextResolved = theme;
      setResolvedTheme(nextResolved);
      document.documentElement.setAttribute('data-theme', nextResolved);
      document.documentElement.style.colorScheme = nextResolved;
    };

    applyTheme();

    return () => {};
  }, [theme]);

  const setTheme = (value) => {
    const next = allowedThemes.includes(value) ? value : 'light';
    setThemeState(next);
    try {
      localStorage.setItem('theme', next);
    } catch (err) {
      // ignore storage errors
    }
  };

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme
    }),
    [theme, resolvedTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
