import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatGameTime, calculateEventLiquidity, formatLargeCurrency, formatOdds } from "@/lib/betting-utils";
import { getEventLogos, getEventColors, parseTeamNames, getTeamAbbreviation } from "@/lib/team-logos";
import { Clock, DollarSign } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useOddsFormat } from "@/hooks/use-odds-format";
interface Event {
  id: string;
  description: string;
  status: string;
  game: {
    scheduled_start: string;
    league: string;
  };
  markets?: Market[];
}
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
}
interface EventCardProps {
  event: Event;
  onClick?: () => void;
  showMarkets?: boolean;
  aiReasoning?: string;
  relevantMarket?: string;
  onOutcomeClick?: (outcomeId: string) => void;
}
export function EventCard({
  event,
  onClick,
  showMarkets = false,
  aiReasoning,
  relevantMarket,
  onOutcomeClick
}: EventCardProps) {
  const isMobile = useIsMobile();
  const { format } = useOddsFormat();
  const isLive = event.status === "OPEN_INGAME";
  const activeMarkets = event.markets?.filter(m => m.outcomes.some(o => o.available || o.last)) || [];
  const logos = getEventLogos(event);
  const colors = getEventColors(event);
  const teams = parseTeamNames(event.description);
  const totalLiquidity = calculateEventLiquidity(event);
  
  // Helper to lighten hex color while keeping it opaque
  const lightenColor = (hex: string, percent: number = 85) => {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = (num >> 16) + Math.round(((255 - (num >> 16)) * percent) / 100);
    const g = ((num >> 8) & 0x00FF) + Math.round(((255 - ((num >> 8) & 0x00FF)) * percent) / 100);
    const b = (num & 0x0000FF) + Math.round(((255 - (num & 0x0000FF)) * percent) / 100);
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  };
  
  // Filter markets to show relevant one first if specified
  const displayMarkets = relevantMarket 
    ? [...activeMarkets.filter(m => m.description.toLowerCase().includes(relevantMarket.toLowerCase())),
       ...activeMarkets.filter(m => !m.description.toLowerCase().includes(relevantMarket.toLowerCase()))]
    : activeMarkets;
  
  const [flashClass, setFlashClass] = useState("");
  const prevLiquidityRef = useRef<number | null>(null);

  useEffect(() => {
    if (prevLiquidityRef.current !== null && prevLiquidityRef.current !== totalLiquidity) {
      if (totalLiquidity > prevLiquidityRef.current) {
        setFlashClass("animate-flash-green");
      } else if (totalLiquidity < prevLiquidityRef.current) {
        setFlashClass("animate-flash-red");
      }
      
      const timer = setTimeout(() => setFlashClass(""), 500);
      return () => clearTimeout(timer);
    }
    prevLiquidityRef.current = totalLiquidity;
  }, [totalLiquidity]);
  return <Card className={`${onClick ? 'hover:shadow-2xl transition-all duration-300 cursor-pointer group' : 'shadow-xl'} rounded-2xl overflow-hidden bg-card border-0`} onClick={onClick}>
      <CardHeader className={onClick ? "pb-4 pt-5 px-5" : "pb-6 pt-8"}>
        {!onClick ? (
          // Detail view - centered layout with large logos
          <div className="flex flex-col items-center gap-6 text-center">
            {(logos.away || logos.home) && (
              <div className="flex items-center justify-center gap-12">
                {logos.away && (
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-28 h-28 rounded-2xl bg-background shadow-lg flex items-center justify-center p-4">
                      <img 
                        src={logos.away} 
                        alt="Away team" 
                        className="w-full h-full object-contain" 
                        onError={e => { e.currentTarget.style.display = 'none'; }} 
                      />
                    </div>
                  </div>
                )}
                <span className="text-2xl font-light text-muted-foreground/50">vs</span>
                {logos.home && (
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-28 h-28 rounded-2xl bg-background shadow-lg flex items-center justify-center p-4">
                      <img 
                        src={logos.home} 
                        alt="Home team" 
                        className="w-full h-full object-contain" 
                        onError={e => { e.currentTarget.style.display = 'none'; }} 
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div className="space-y-3">
              <CardTitle className="text-3xl font-semibold leading-tight tracking-tight">
                {event.description}
              </CardTitle>
              {isLive && (
                <Badge variant="destructive" className="gap-2 whitespace-nowrap text-sm px-4 py-1.5 rounded-full font-medium">
                  <div className="w-2 h-2 bg-destructive-foreground rounded-full animate-pulse" />
                  LIVE
                </Badge>
              )}
            </div>
          </div>
        ) : (
          // List view - clean horizontal layout with prominent logos
          <div className="space-y-4">
            {/* Main content: Teams and logos - centered */}
            <div className="flex items-center justify-center gap-4">
              {logos.away && (
                <div className="w-14 h-14 rounded-xl bg-background shadow-md flex items-center justify-center p-2.5 shrink-0 group-hover:scale-105 transition-transform duration-300">
                  <img 
                    src={logos.away} 
                    alt="Away team" 
                    className="w-full h-full object-contain" 
                    onError={e => { e.currentTarget.style.display = 'none'; }} 
                  />
                </div>
              )}
              
              {/* Team names and matchup - centered */}
              <div className="text-center">
                <div className="text-base font-semibold text-foreground leading-tight tracking-tight">
                  {event.description}
                </div>
                
                {/* Show date/time only when NOT live, or show LIVE badge when live */}
                {isLive ? (
                  <div className="flex items-center justify-center mt-2">
                    <Badge variant="destructive" className="gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium">
                      <div className="w-1.5 h-1.5 bg-destructive-foreground rounded-full animate-pulse" />
                      LIVE
                    </Badge>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3 mt-1.5">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="font-medium">{formatGameTime(event.game.scheduled_start)}</span>
                    </div>
                    {totalLiquidity > 0 && (
                      <div className={`flex items-center gap-1 text-xs text-muted-foreground font-medium transition-colors ${flashClass}`}>
                        <span>{formatLargeCurrency(totalLiquidity)} Vol.</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {logos.home && (
                <div className="w-14 h-14 rounded-xl bg-background shadow-md flex items-center justify-center p-2.5 shrink-0 group-hover:scale-105 transition-transform duration-300">
                  <img 
                    src={logos.home} 
                    alt="Home team" 
                    className="w-full h-full object-contain" 
                    onError={e => { e.currentTarget.style.display = 'none'; }} 
                  />
                </div>
              )}
            </div>

            {/* Outcomes - prominent betting options */}
            {showMarkets && displayMarkets.length > 0 && displayMarkets[0].outcomes.filter(o => o.available || o.last).length > 0 && (
              <div className="flex items-center gap-2">
                {displayMarkets[0].outcomes
                  .filter(o => o.available || o.last)
                  .slice(0, 2)
                  .map((outcome, index) => {
                    const price = outcome.available || outcome.last;
                    // Use team colors for the buttons - away team for first outcome, home team for second
                    const teamColor = index === 0 ? colors.away : colors.home;
                    const bgStyle = teamColor 
                      ? { backgroundColor: lightenColor(teamColor, 85), borderColor: teamColor }
                      : {};
                    const hoverStyle = teamColor
                      ? { '--hover-bg': lightenColor(teamColor, 75), '--hover-border': teamColor } as React.CSSProperties
                      : {};
                    
                    // Get team abbreviation
                    const teamName = index === 0 ? teams?.away : teams?.home;
                    const teamAbbr = teamName ? getTeamAbbreviation(teamName, event.game.league) : null;
                    
                    return (
                      <button
                        key={outcome.id}
                        style={{ ...bgStyle, ...hoverStyle }}
                        className="flex-1 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-[1.02] border hover:shadow-lg text-foreground [&:hover]:bg-[var(--hover-bg)] [&:hover]:border-[var(--hover-border)]"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOutcomeClick?.(outcome.id);
                        }}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-sm font-bold uppercase tracking-wide">
                            {teamAbbr || outcome.description}
                          </span>
                          <span className="text-xl font-bold tracking-tight">
                            {price && formatOdds(price, format)}
                          </span>
                        </div>
                      </button>
                    );
                  })}
              </div>
            )}
          </div>
        )}
      </CardHeader>
      
      {aiReasoning && (
        <CardContent className="pt-0 pb-4 px-5">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10">
            <Badge variant="secondary" className="text-xs px-2.5 py-1 bg-primary/10 text-primary border-0 font-semibold shrink-0 rounded-full">
              AI Match
            </Badge>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {aiReasoning}
            </p>
          </div>
        </CardContent>
      )}
      
      {/* Detail view footer */}
      {!onClick && (
        <CardContent className="pt-4 pb-4 border-t border-border/30">
          <div className="flex items-center gap-4 text-sm text-muted-foreground justify-center">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span className="font-medium">{formatGameTime(event.game.scheduled_start)}</span>
            </div>
            {totalLiquidity > 0 && (
              <div className={`flex items-center gap-1.5 font-semibold transition-colors ${flashClass}`}>
                <DollarSign className="w-4 h-4" />
                <span>{formatLargeCurrency(totalLiquidity)} volume</span>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>;
}