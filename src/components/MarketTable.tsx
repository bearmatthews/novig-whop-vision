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
    <div className="grid gap-4 sm:grid-cols-1">
      {marketsWithPrices.map((market) => (
        <Card key={market.id} className="p-6 space-y-4">
          <h3 className="font-bold text-lg text-foreground">
            {market.description}
          </h3>
          
          <div className="space-y-3">
            {market.outcomes
              .filter((outcome) => outcome.available || outcome.bestOdds)
              .map((outcome) => {
                const hasMultipleSources = outcome.allOdds && outcome.allOdds.length > 1;
                
                return (
                  <div key={outcome.id} className="space-y-2">
                    <div className="flex items-center justify-between pb-2 border-b border-border/50">
                      <span className="font-semibold text-base">{outcome.description}</span>
                      {hasMultipleSources && (
                        <Badge variant="outline" className="text-xs">
                          {outcome.allOdds!.length} books
                        </Badge>
                      )}
                    </div>
                    
                    {hasMultipleSources ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {outcome.allOdds!.map((bookOdds, idx) => {
                          const isBest = idx === 0; // allOdds is already sorted by best odds
                          return (
                            <button
                              key={`${bookOdds.source}-${idx}`}
                              ref={(el) => {
                                if (isBest) {
                                  outcomeRefs.current[outcome.id] = el;
                                }
                              }}
                              onClick={() => handleOutcomeClick(outcome, market.description)}
                              className={`relative p-3 rounded-lg border transition-all text-left ${
                                isBest 
                                  ? 'bg-success/10 border-success/30 hover:bg-success/20' 
                                  : 'bg-secondary/30 border-border hover:bg-secondary/50'
                              }`}
                            >
                              {isBest && (
                                <div className="absolute -top-2 -right-2">
                                  <Badge className="text-xs px-1.5 py-0.5 bg-success">
                                    Best
                                  </Badge>
                                </div>
                              )}
                              
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-medium text-muted-foreground truncate">
                                    {bookOdds.source}
                                  </span>
                                  <ExternalLink className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                                </div>
                                
                                <div className="space-y-0.5">
                                  <div className="text-lg font-bold font-mono">
                                    {bookOdds.americanOdds ? priceToAmericanOdds(bookOdds.odds) : bookOdds.odds.toFixed(2)}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {bookOdds.odds.toFixed(2)} decimal
                                  </div>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <button
                        ref={(el) => outcomeRefs.current[outcome.id] = el}
                        onClick={() => handleOutcomeClick(outcome, market.description)}
                        className="w-full p-4 rounded-lg border border-border bg-secondary/30 hover:bg-secondary/50 transition-all text-left"
                      >
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-muted-foreground">Novig</span>
                              <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-xs">
                                Available
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Price: <span className="font-semibold text-foreground">{outcome.available?.toFixed(2)}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <div className="text-2xl font-bold font-mono">
                              {outcome.available ? priceToAmericanOdds(outcome.available) : '-'}
                            </div>
                            <ExternalLink className="w-4 h-4 text-muted-foreground" />
                          </div>
                        </div>
                      </button>
                    )}
                  </div>
                );
              })}
          </div>
        </Card>
      ))}
    </div>
  );
}
