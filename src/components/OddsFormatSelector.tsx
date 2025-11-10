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
import { useOddsFormat } from "@/hooks/use-odds-format";

export type OddsFormat = 'price' | 'decimal' | 'american' | 'percentage';

export function OddsFormatSelector() {
  const { format, setFormat } = useOddsFormat();

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
          <span className="hidden sm:inline">Odds Format</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-background border-border z-50">
        <DropdownMenuLabel>Display Format</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {(Object.keys(formatLabels) as OddsFormat[]).map((formatOption) => (
          <DropdownMenuItem
            key={formatOption}
            onClick={() => setFormat(formatOption)}
            className={format === formatOption ? 'bg-accent' : ''}
          >
            <div className="flex items-center justify-between w-full">
              <span>{formatLabels[formatOption]}</span>
              {format === formatOption && (
                <span className="text-primary">✓</span>
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
