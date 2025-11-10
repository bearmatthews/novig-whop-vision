import { Badge } from "@/components/ui/badge";
import { formatOdds, formatCurrency } from "@/lib/betting-utils";
import { TrendingUp, DollarSign, ExternalLink } from "lucide-react";
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
    if (!eventId) return;
    
    // Open Novig with the event markets
    const novigUrl = `https://app.novig.us/event-markets/${eventId}`;
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
        // Determine if this is a moneyline market (2-way market with team outcomes)
        const isMoneylineMarket = market.description.toLowerCase().includes('moneyline') || 
                                  market.description.toLowerCase().includes('money line') ||
                                  market.description.toLowerCase().includes('winner');
        const isSpreadMarket = market.description.toLowerCase().includes('spread');
        const isTotalMarket = market.description.toLowerCase().includes('total') || 
                              market.description.toLowerCase().includes('over/under');
        
        return (
          <Card key={market.id} className="p-5 space-y-3 border border-border/30 rounded-2xl bg-card">
            <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">
              {market.description}
            </h3>
            
            <div className="grid gap-2">
              {market.outcomes
                .filter((outcome) => outcome.available)
                .map((outcome, index) => {
                  const price = outcome.available || outcome.last;
                  const hasOrders = outcome.orders && outcome.orders.length > 0;
                  const totalLiquidity = hasOrders 
                    ? outcome.orders.reduce((sum, order) => sum + order.qty, 0)
                    : 0;
                  
                  // Determine team color based on market type and outcome position
                  let teamColor = null;
                  let teamAbbr = null;
                  
                  if (isMoneylineMarket && teams && event) {
                    // For moneyline, first outcome is away, second is home
                    teamColor = index === 0 ? colors.away : colors.home;
                    const teamName = index === 0 ? teams.away : teams.home;
                    teamAbbr = teamName ? getTeamAbbreviation(teamName, event.game.league) : null;
                  } else if (isSpreadMarket && teams && event) {
                    // For spread, determine which team based on outcome description
                    const outcomeDesc = outcome.description.toLowerCase();
                    const awayTeam = teams.away.toLowerCase();
                    const homeTeam = teams.home.toLowerCase();
                    
                    if (outcomeDesc.includes(awayTeam) || index === 0) {
                      teamColor = colors.away;
                      teamAbbr = getTeamAbbreviation(teams.away, event.game.league);
                    } else {
                      teamColor = colors.home;
                      teamAbbr = getTeamAbbreviation(teams.home, event.game.league);
                    }
                  }
                  
                  const buttonStyle = teamColor 
                    ? { backgroundColor: teamColor, borderColor: teamColor }
                    : {};
                  
                  const buttonClasses = teamColor
                    ? "rounded-xl p-4 space-y-2 text-left w-full transition-all duration-200 hover:scale-[1.02] cursor-pointer group border text-white hover:brightness-110 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.3)]"
                    : "bg-muted/50 border border-border rounded-xl p-4 space-y-2 text-left w-full transition-all hover:border-primary hover:bg-muted cursor-pointer group";

                  return (
                    <button
                      key={outcome.id}
                      ref={(el) => outcomeRefs.current[outcome.id] = el}
                      onClick={() => handleOutcomeClick(outcome.id)}
                      style={buttonStyle}
                      className={buttonClasses}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm uppercase tracking-wide">
                          {teamAbbr || outcome.description}
                        </span>
                        <ExternalLink className={`w-3.5 h-3.5 transition-colors ${teamColor ? 'text-white/70 group-hover:text-white' : 'text-muted-foreground group-hover:text-primary'}`} />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className={`text-xs ${teamColor ? 'text-white/70' : 'text-muted-foreground'}`}>
                          Price: <span className={`font-semibold ${teamColor ? 'text-white' : 'text-foreground'}`}>{price?.toFixed(2)}</span>
                        </div>
                        <div className={`text-2xl font-bold font-mono transition-colors ${teamColor ? 'text-white' : 'group-hover:text-primary'}`}>
                          {price ? formatOdds(price, format) : '-'}
                        </div>
                      </div>

                      {showLiquidity && hasOrders && (
                        <div className={`flex items-center justify-between pt-2 border-t text-xs ${teamColor ? 'border-white/20' : 'border-border/50'}`}>
                          <div className={`flex items-center gap-1 ${teamColor ? 'text-white/90' : 'text-success'}`}>
                            <DollarSign className="w-3 h-3" />
                            {formatCurrency(totalLiquidity)}
                          </div>
                          <div className={`flex items-center gap-1 ${teamColor ? 'text-white/70' : 'text-muted-foreground'}`}>
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
        );
      })}
    </div>
  );
}
