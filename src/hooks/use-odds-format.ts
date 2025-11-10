import { useState, useEffect } from 'react';

export type OddsFormat = 'price' | 'decimal' | 'american' | 'percentage';

const STORAGE_KEY = 'novig-odds-format';
const ODDS_FORMAT_EVENT = 'odds-format-changed';

export function useOddsFormat() {
  const [format, setFormatState] = useState<OddsFormat>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return (stored as OddsFormat) || 'american';
  });

  useEffect(() => {
    const handleFormatChange = (e: CustomEvent<OddsFormat>) => {
      setFormatState(e.detail);
    };

    window.addEventListener(ODDS_FORMAT_EVENT, handleFormatChange as EventListener);
    return () => {
      window.removeEventListener(ODDS_FORMAT_EVENT, handleFormatChange as EventListener);
    };
  }, []);

  const setFormat = (newFormat: OddsFormat) => {
    setFormatState(newFormat);
    localStorage.setItem(STORAGE_KEY, newFormat);
    
    // Dispatch custom event to sync across all components
    window.dispatchEvent(new CustomEvent(ODDS_FORMAT_EVENT, { detail: newFormat }));
  };

  return { format, setFormat };
}
