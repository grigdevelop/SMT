import React, { createContext, useContext, useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export type Theme = 'light' | 'dark' | 'black' | 'system';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark' | 'black';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'smt_theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'system';
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
      if (stored === 'light' || stored === 'dark' || stored === 'black' || stored === 'system') {
        return stored;
      }
    } catch {
      // Ignore localStorage access errors
    }
    return 'system';
  });

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark' | 'black'>(() => {
    if (typeof window === 'undefined') return 'light';
    if (theme === 'light') return 'light';
    if (theme === 'dark') return 'dark';
    if (theme === 'black') return 'black';
    return window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = (targetTheme: 'light' | 'dark' | 'black') => {
      setResolvedTheme(targetTheme);
      root.setAttribute('data-theme', targetTheme);
      if (targetTheme === 'dark' || targetTheme === 'black') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    if (theme === 'system') {
      const mediaQuery = window.matchMedia?.('(prefers-color-scheme: dark)');
      const isSystemDark = mediaQuery?.matches ?? false;
      applyTheme(isSystemDark ? 'dark' : 'light');

      const handleChange = (e: MediaQueryListEvent) => {
        applyTheme(e.matches ? 'dark' : 'light');
      };

      mediaQuery?.addEventListener?.('change', handleChange);
      return () => mediaQuery?.removeEventListener?.('change', handleChange);
    } else {
      applyTheme(theme);
    }
  }, [theme]);

  const setTheme = (nextTheme: Theme) => {
    setThemeState(nextTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch {
      // Ignore localStorage write errors
    }
  };

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

const defaultThemeContext: ThemeContextType = {
  theme: 'system',
  resolvedTheme: 'light',
  setTheme: () => {},
  toggleTheme: () => {},
};

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  return context ?? defaultThemeContext;
}

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === 'dark' || resolvedTheme === 'black';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`btn btn-ghost btn-sm btn-square ${className}`}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-warning transition-transform duration-200 rotate-0 hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 text-base-content transition-transform duration-200 -rotate-12 hover:rotate-0" />
      )}
    </button>
  );
}
