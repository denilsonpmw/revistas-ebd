import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { registerSW } from 'virtual:pwa-register';
import App from './App.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import './styles.css';

const queryClient = new QueryClient();

const initTheme = () => {
  if (typeof window === 'undefined') return;
  const allowedThemes = ['system', 'light', 'dark'];
  let stored = 'system';
  try {
    const value = localStorage.getItem('theme');
    stored = allowedThemes.includes(value) ? value : 'system';
  } catch (err) {
    stored = 'system';
  }

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const resolved = stored === 'system' ? (prefersDark ? 'dark' : 'light') : stored;
  document.documentElement.setAttribute('data-theme', resolved);
  document.documentElement.style.colorScheme = resolved;
};

const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent || navigator.vendor || window.opera;
  const isMobileUA = /android|iphone|ipad|ipod/i.test(ua);
  const isSmallScreen = window.matchMedia('(max-width: 767px)').matches;
  return isMobileUA || isSmallScreen;
};

initTheme();

if (isMobileDevice()) {
  registerSW({
    immediate: true
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
          <Toaster position="top-right" />
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  </React.StrictMode>
);
