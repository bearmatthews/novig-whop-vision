import { Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useOddsFormat, type OddsFormat } from "@/hooks/use-odds-format";
import { useState, useEffect } from "react";

const MARKET_VIEW_KEY = 'novig-show-spreads-totals';
const MARKET_VIEW_EVENT = 'market-view-changed';

export function useMarketView() {
  const [showSpreadsAndTotals, setShowSpreadsAndTotalsState] = useState(() => {
    const stored = localStorage.getItem(MARKET_VIEW_KEY);
    return stored === 'true';
  });

  useEffect(() => {
    const handleViewChange = (e: CustomEvent<boolean>) => {
      setShowSpreadsAndTotalsState(e.detail);
    };

    window.addEventListener(MARKET_VIEW_EVENT, handleViewChange as EventListener);
    return () => {
      window.removeEventListener(MARKET_VIEW_EVENT, handleViewChange as EventListener);
    };
  }, []);

  const setShowSpreadsAndTotals = (value: boolean) => {
    setShowSpreadsAndTotalsState(value);
    localStorage.setItem(MARKET_VIEW_KEY, String(value));
    window.dispatchEvent(new CustomEvent(MARKET_VIEW_EVENT, { detail: value }));
  };

  return { showSpreadsAndTotals, setShowSpreadsAndTotals };
}

export function SettingsMenu() {
  const { format, setFormat } = useOddsFormat();
  const { showSpreadsAndTotals, setShowSpreadsAndTotals } = useMarketView();

  const formatLabels: Record<OddsFormat, string> = {
    price: 'Price (0.36)',
    decimal: 'Decimal (2.78)',
    american: 'American (+178)',
    percentage: 'Percentage (36%)',
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="w-4 h-4" />
          <span className="hidden sm:inline">Settings</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 bg-background border-border z-50">
        <DropdownMenuLabel>Odds Format</DropdownMenuLabel>
        {(Object.keys(formatLabels) as OddsFormat[]).map((formatOption) => (
          <DropdownMenuItem
            key={formatOption}
            onClick={() => setFormat(formatOption)}
            className={format === formatOption ? 'bg-accent text-accent-foreground' : ''}
          >
            <div className="flex items-center justify-between w-full">
              <span>{formatLabels[formatOption]}</span>
              {format === formatOption && (
                <span className="text-primary">✓</span>
              )}
            </div>
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuLabel>Market Display</DropdownMenuLabel>
        <div className="px-2 py-2">
          <div className="flex items-center justify-between">
            <label htmlFor="spreads-totals" className="text-sm cursor-pointer">
              Show Spreads & Totals
            </label>
            <Switch
              id="spreads-totals"
              checked={showSpreadsAndTotals}
              onCheckedChange={setShowSpreadsAndTotals}
            />
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
