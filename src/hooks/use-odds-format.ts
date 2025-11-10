import { useState, useEffect } from 'react';

export type OddsFormat = 'price' | 'decimal' | 'american' | 'percentage';

const STORAGE_KEY = 'novig-odds-format';

export function useOddsFormat() {
  const [format, setFormatState] = useState<OddsFormat>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return (stored as OddsFormat) || 'american';
  });

  const setFormat = (newFormat: OddsFormat) => {
    setFormatState(newFormat);
    localStorage.setItem(STORAGE_KEY, newFormat);
  };

  return { format, setFormat };
}
