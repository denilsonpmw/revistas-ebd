import React from 'react';
import { useTheme } from '../context/ThemeContext.jsx';

const themeOrder = ['light', 'dark'];

const getNextTheme = (current) => {
  const index = themeOrder.indexOf(current);
  const nextIndex = index === -1 ? 0 : (index + 1) % themeOrder.length;
  return themeOrder[nextIndex];
};

const icons = {
  light: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364-6.364-1.414 1.414M7.05 16.95l-1.414 1.414M16.95 16.95l1.414 1.414M7.05 7.05 5.636 5.636M12 8a4 4 0 100 8 4 4 0 000-8z" />
    </svg>
  ),
  dark: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </svg>
  )
};

const labels = {
  light: 'Claro',
  dark: 'Escuro'
};

export default function ThemeToggle({ className = '' }) {
  const { theme, setTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={() => setTheme(getNextTheme(theme))}
      className={`rounded-lg border border-slate-700 bg-slate-900/50 text-slate-200 px-2 py-1 text-xs min-h-[44px] min-w-[44px] flex items-center justify-center ${className}`}
      aria-label={`Tema: ${labels[theme]}`}
      title={`Tema: ${labels[theme]}`}
    >
      {icons[theme]}
    </button>
  );
}
