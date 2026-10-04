import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

interface DateContextType {
  realToday: string;
  currentDate: string;
  isSimulated: boolean;
  setSimulatedDate: (dateStr: string) => void;
  offsetDays: (days: number) => void;
  resetToRealToday: () => void;
}

const STORAGE_KEY = 'smt_simulated_date';
const DateContext = createContext<DateContextType | undefined>(undefined);

export function DateProvider({ children }: { children: React.ReactNode }) {
  const realToday = useMemo(() => formatLocalDate(new Date()), []);

  const [simulatedDate, setSimulatedDateState] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  });

  const currentDate = simulatedDate || realToday;
  const isSimulated = Boolean(simulatedDate && simulatedDate !== realToday);

  const setSimulatedDate = useCallback((dateStr: string) => {
    try {
      sessionStorage.setItem(STORAGE_KEY, dateStr);
    } catch {
      // SessionStorage might be unavailable
    }
    setSimulatedDateState(dateStr);
  }, []);

  const offsetDays = useCallback(
    (days: number) => {
      const base = parseLocalDate(currentDate);
      base.setDate(base.getDate() + days);
      const newDateStr = formatLocalDate(base);
      setSimulatedDate(newDateStr);
    },
    [currentDate, setSimulatedDate],
  );

  const resetToRealToday = useCallback(() => {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // SessionStorage might be unavailable
    }
    setSimulatedDateState(null);
  }, []);

  const value = useMemo(
    () => ({
      realToday,
      currentDate,
      isSimulated,
      setSimulatedDate,
      offsetDays,
      resetToRealToday,
    }),
    [realToday, currentDate, isSimulated, setSimulatedDate, offsetDays, resetToRealToday],
  );

  return <DateContext.Provider value={value}>{children}</DateContext.Provider>;
}

export function useCurrentDate(): DateContextType {
  const context = useContext(DateContext);
  if (!context) {
    throw new Error('useCurrentDate must be used within a DateProvider');
  }
  return context;
}
