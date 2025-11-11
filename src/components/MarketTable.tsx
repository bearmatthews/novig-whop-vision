import { formatOdds, formatCurrency } from "@/lib/betting-utils";
import { TrendingUp, DollarSign, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useEffect, useRef } from "react";
import { useOddsFormat } from "@/hooks/use-odds-format";
import { getEventColors, parseTeamNames, getTeamAbbreviation } from "@/lib/team-logos";

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
  event?: any; // Add event prop for team colors
}

export function MarketTable({ 
  markets, 
  showLiquidity = false, 
  eventId,
  targetOutcomeId,
  onOutcomeHighlighted,
  event
}: MarketTableProps) {
  const outcomeRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const { format } = useOddsFormat();

  // Get team colors and names
  const colors = event ? getEventColors(event) : { away: null, home: null };
  const teams = event ? parseTeamNames(event.description) : null;

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
  const handleOutcomeClick = (outcomeId: string) => {
    // Open Novig with referral code
    const novigUrl = `https://app.novig.us/events/${outcomeId}/bearm?referralCode=BEARM`;
    window.open(novigUrl, '_blank');
    toast.success("Opening in Novig...");
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
      {marketsWithPrices.map((market) => {
        // Determine market type
        const isMoneylineMarket = market.description.toLowerCase().includes('moneyline') || 
                                  market.description.toLowerCase().includes('money line') ||
                                  market.description.toLowerCase().includes('winner');
        const isSpreadMarket = market.description.toLowerCase().includes('spread');
        
        return (
          <Card key={market.id} className="overflow-hidden border-border/50 bg-card hover:border-border transition-all">
            {/* Market Header */}
            <div className="px-4 py-3 bg-muted/30 border-b border-border/50">
              <h3 className="font-semibold text-sm text-foreground">
                {market.description}
              </h3>
            </div>
            
            {/* Outcomes */}
            <div className="p-3 space-y-2">
              {market.outcomes
                .filter((outcome) => outcome.available)
                .map((outcome, index) => {
                  const price = outcome.available || outcome.last;
                  const hasOrders = outcome.orders && outcome.orders.length > 0;
                  const totalLiquidity = hasOrders 
                    ? outcome.orders.reduce((sum, order) => sum + order.qty, 0)
                    : 0;
                  
                  // Determine team styling
                  let teamColor = null;
                  let teamAbbr = null;

                  if ((isMoneylineMarket || isSpreadMarket) && teams && event) {
                    teamColor = index === 0 ? colors.away : colors.home;
                    const teamName = index === 0 ? teams.away : teams.home;
                    teamAbbr = teamName ? getTeamAbbreviation(teamName, event.game.league) : null;
                  }
                  
                  const buttonStyle = teamColor 
                    ? { 
                        backgroundColor: teamColor,
                        boxShadow: `0 1px 3px 0 ${teamColor}40, 0 1px 2px -1px ${teamColor}30`
                      }
                    : {};

                  return (
                    <button
                      key={outcome.id}
                      ref={(el) => outcomeRefs.current[outcome.id] = el}
                      onClick={() => handleOutcomeClick(outcome.id)}
                      style={buttonStyle}
                      className={`
                        w-full rounded-lg p-3 transition-all duration-200 
                        border group relative overflow-hidden
                        ${teamColor 
                          ? 'border-transparent text-white hover:brightness-110 hover:scale-[1.02]' 
                          : 'bg-muted/50 border-border hover:border-primary/50 hover:bg-muted'
                        }
                      `}
                    >
                      {/* Subtle gradient overlay for team colors */}
                      {teamColor && (
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                      
                      <div className="relative">
                        {/* Header: Outcome name with action icon */}
                        <div className="flex items-center justify-between gap-3 mb-3">
                          <div className="flex-1 min-w-0">
                            <div className={`font-bold text-lg leading-tight truncate ${teamColor ? 'text-white' : 'text-foreground'}`}>
                              {teamAbbr || outcome.description}
                            </div>
                          </div>
                          <div className={`shrink-0 rounded-full p-1.5 transition-all ${teamColor ? 'bg-white/10 group-hover:bg-white/20' : 'bg-muted group-hover:bg-primary/10'}`}>
                            <ArrowUpRight className={`w-4 h-4 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${teamColor ? 'text-white' : 'text-muted-foreground group-hover:text-primary'}`} />
                          </div>
                        </div>
                        
                        {/* Main content: Odds and metadata */}
                        <div className="flex items-end justify-between gap-4">
                          {/* Left: Odds display */}
                          <div className="flex-1">
                            <div className={`text-xs uppercase tracking-wider font-medium mb-1 ${teamColor ? 'text-white/50' : 'text-muted-foreground'}`}>
                              Odds
                            </div>
                            <div className={`text-4xl font-bold font-mono leading-none transition-all ${teamColor ? 'text-white' : 'text-foreground group-hover:text-primary'}`}>
                              {price ? formatOdds(price, format) : '-'}
                            </div>
                            <div className={`text-xs font-medium mt-1.5 ${teamColor ? 'text-white/60' : 'text-muted-foreground'}`}>
                              Price: ${price?.toFixed(3)}
                            </div>
                          </div>
                          
                          {/* Right: Liquidity info */}
                          {showLiquidity && hasOrders && (
                            <div className={`text-right space-y-1 px-3 py-2 rounded-lg ${teamColor ? 'bg-white/10' : 'bg-muted/80'}`}>
                              <div className={`flex items-center justify-end gap-1.5 text-sm font-bold ${teamColor ? 'text-white' : 'text-success'}`}>
                                <DollarSign className="w-3.5 h-3.5" />
                                {formatCurrency(totalLiquidity)}
                              </div>
                              <div className={`flex items-center justify-end gap-1 text-xs ${teamColor ? 'text-white/70' : 'text-muted-foreground'}`}>
                                <TrendingUp className="w-3 h-3" />
                                {outcome.orders.length} order{outcome.orders.length !== 1 ? 's' : ''}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
