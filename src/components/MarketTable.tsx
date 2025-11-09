import { Badge } from "@/components/ui/badge";
import { priceToAmericanOdds, formatCurrency } from "@/lib/betting-utils";
import { TrendingUp, DollarSign, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useEffect, useRef } from "react";

interface Market {
  id: string;
  description: string;
  outcomes: Outcome[];
}

interface Outcome {
  id: string;
  description: string;
  last?: number;
  available?: number;
  orders?: Order[];
  bestOdds?: number;
  bestSource?: string;
  novigOdds?: number;
  allOdds?: Array<{
    source: string;
    odds: number;
    americanOdds?: number;
  }>;
}

interface Order {
  id: string;
  status: string;
  qty: number;
  price: number;
}

interface MarketTableProps {
  markets: Market[];
  showLiquidity?: boolean;
  eventId?: string;
  targetOutcomeId?: string | null;
  onOutcomeHighlighted?: () => void;
}

export function MarketTable({ 
  markets, 
  showLiquidity = false, 
  eventId,
  targetOutcomeId,
  onOutcomeHighlighted
}: MarketTableProps) {
  const outcomeRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    if (targetOutcomeId && outcomeRefs.current[targetOutcomeId]) {
      const element = outcomeRefs.current[targetOutcomeId];
      
      // Scroll to element with offset for header
      setTimeout(() => {
        const yOffset = -100;
        const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
        
        // Trigger highlight animation
        element.classList.add('outcome-highlight');
        
        // Remove highlight after animation
        setTimeout(() => {
          element.classList.remove('outcome-highlight');
          onOutcomeHighlighted?.();
        }, 2000);
      }, 300);
    }
  }, [targetOutcomeId, onOutcomeHighlighted]);
  const handleOutcomeClick = (outcome: Outcome, marketDescription: string) => {
    if (!eventId) return;
    
    // Determine which sportsbook to open based on best odds
    const bestSource = outcome.bestSource;
    
    if (bestSource && bestSource !== 'Novig') {
      // Generate sportsbook-specific URLs
      let sportsbookUrl = '';
      const sportsbookName = bestSource.toLowerCase();
      
      if (sportsbookName.includes('draftkings')) {
        sportsbookUrl = 'https://sportsbook.draftkings.com/';
        toast.success(`Opening ${bestSource}...`, {
          description: 'Navigate to the game manually'
        });
      } else if (sportsbookName.includes('fanduel')) {
        sportsbookUrl = 'https://sportsbook.fanduel.com/';
        toast.success(`Opening ${bestSource}...`, {
          description: 'Navigate to the game manually'
        });
      } else if (sportsbookName.includes('betmgm')) {
        sportsbookUrl = 'https://sports.betmgm.com/';
        toast.success(`Opening ${bestSource}...`, {
          description: 'Navigate to the game manually'
        });
      } else if (sportsbookName.includes('caesars')) {
        sportsbookUrl = 'https://sportsbook.caesars.com/';
        toast.success(`Opening ${bestSource}...`, {
          description: 'Navigate to the game manually'
        });
      } else if (sportsbookName.includes('pointsbet')) {
        sportsbookUrl = 'https://pointsbet.com/';
        toast.success(`Opening ${bestSource}...`, {
          description: 'Navigate to the game manually'
        });
      } else {
        // Fallback for unknown sportsbooks
        toast.info(`Best odds at ${bestSource}`, {
          description: 'Visit their sportsbook to place this bet'
        });
        return;
      }
      
      window.open(sportsbookUrl, '_blank');
    } else {
      // Open Novig if it has the best odds or is the only option
      const novigUrl = `https://app.novig.us/event-markets/${eventId}`;
      window.open(novigUrl, '_blank');
      toast.success("Opening in Novig...");
    }
  };
  // Filter to only show markets with available prices
  const marketsWithPrices = markets.filter((market) =>
    market.outcomes.some((outcome) => outcome.available)
  );

  if (marketsWithPrices.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No markets with available prices at the moment.
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {marketsWithPrices.map((market) => (
        <Card key={market.id} className="p-4 space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            {market.description}
          </h3>
          
          <div className="grid gap-2">
            {market.outcomes
              .filter((outcome) => outcome.available || outcome.bestOdds)
              .map((outcome) => {
                const price = outcome.bestOdds || outcome.available || outcome.last;
                const hasBetterOdds = outcome.bestSource && outcome.bestSource !== 'Novig';
                const hasMultipleSources = outcome.allOdds && outcome.allOdds.length > 1;
                const hasOrders = outcome.orders && outcome.orders.length > 0;
                const totalLiquidity = hasOrders 
                  ? outcome.orders.reduce((sum, order) => sum + order.qty, 0)
                  : 0;
                return (
                  <button
                    key={outcome.id}
                    ref={(el) => outcomeRefs.current[outcome.id] = el}
                    onClick={() => handleOutcomeClick(outcome, market.description)}
                    className="bg-secondary/30 border border-border rounded-md p-3 space-y-1 text-left w-full transition-all hover:border-primary hover:bg-secondary/50 cursor-pointer group relative"
                  >
                    {hasBetterOdds && (
                      <div className="absolute -top-2 -right-2 z-10">
                        <Badge variant="default" className="text-xs px-1.5 py-0.5 bg-success">
                          {outcome.bestSource}
                        </Badge>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{outcome.description}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-xs">
                          Available
                        </Badge>
                        <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground space-y-0.5">
                        <div>
                          Price: <span className="font-semibold text-foreground">{price?.toFixed(2)}</span>
                        </div>
                        {hasMultipleSources && (
                          <div className="text-muted-foreground">
                            {outcome.allOdds!.length} sportsbooks
                          </div>
                        )}
                      </div>
                      <div className="text-lg font-bold font-mono group-hover:text-primary transition-colors">
                        {price ? priceToAmericanOdds(price) : '-'}
                      </div>
                    </div>

                    {showLiquidity && hasOrders && (
                      <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
                        <div className="flex items-center gap-1 text-success">
                          <DollarSign className="w-3 h-3" />
                          {formatCurrency(totalLiquidity)}
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <TrendingUp className="w-3 h-3" />
                          {outcome.orders.length} orders
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
          </div>
        </Card>
      ))}
    </div>
  );
}
