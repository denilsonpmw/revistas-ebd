import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const ThemeContext = createContext(null);

const allowedThemes = ['system', 'light', 'dark'];

const getStoredTheme = () => {
  if (typeof window === 'undefined') return 'system';
  try {
    const stored = localStorage.getItem('theme');
    return allowedThemes.includes(stored) ? stored : 'system';
  } catch (err) {
    return 'system';
  }
};

const getSystemTheme = () => {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getStoredTheme);
  const [resolvedTheme, setResolvedTheme] = useState(() => (theme === 'system' ? getSystemTheme() : theme));

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      const nextResolved = theme === 'system' ? (media.matches ? 'dark' : 'light') : theme;
      setResolvedTheme(nextResolved);
      document.documentElement.setAttribute('data-theme', nextResolved);
      document.documentElement.style.colorScheme = nextResolved;
    };

    applyTheme();

    const handleChange = () => {
      if (theme === 'system') {
        applyTheme();
      }
    };

    if (media.addEventListener) {
      media.addEventListener('change', handleChange);
    } else {
      media.addListener(handleChange);
    }

    return () => {
      if (media.removeEventListener) {
        media.removeEventListener('change', handleChange);
      } else {
        media.removeListener(handleChange);
      }
    };
  }, [theme]);

  const setTheme = (value) => {
    const next = allowedThemes.includes(value) ? value : 'system';
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
