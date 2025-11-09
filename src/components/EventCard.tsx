import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatGameTime, calculateEventLiquidity, formatLargeCurrency } from "@/lib/betting-utils";
import { getEventLogos } from "@/lib/team-logos";
import { Clock, ChevronRight, DollarSign } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
  const isLive = event.status === "OPEN_INGAME";
  const activeMarkets = event.markets?.filter(m => m.outcomes.some(o => o.available || o.last)) || [];
  const logos = getEventLogos(event);
  const totalLiquidity = calculateEventLiquidity(event);
  
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
  return <Card className={`${onClick ? 'hover:shadow-2xl transition-all duration-300 cursor-pointer group border-2 hover:border-foreground/20' : 'border-2 border-border/50 shadow-lg'} rounded-2xl overflow-hidden`} onClick={onClick}>
      <CardHeader className={onClick ? "pb-4" : "pb-6 pt-8"}>
        {!onClick ? (
          // Detail view - centered layout with large logos
          <div className="flex flex-col items-center gap-6 text-center">
            {(logos.away || logos.home) && (
              <div className="flex items-center justify-center gap-8">
                {logos.away && (
                  <div className="flex flex-col items-center gap-3">
                    <img 
                      src={logos.away} 
                      alt="Away team" 
                      className="w-24 h-24 object-contain drop-shadow-lg" 
                      onError={e => { e.currentTarget.style.display = 'none'; }} 
                    />
                  </div>
                )}
                <span className="text-3xl font-black text-muted-foreground">@</span>
                {logos.home && (
                  <div className="flex flex-col items-center gap-3">
                    <img 
                      src={logos.home} 
                      alt="Home team" 
                      className="w-24 h-24 object-contain drop-shadow-lg" 
                      onError={e => { e.currentTarget.style.display = 'none'; }} 
                    />
                  </div>
                )}
              </div>
            )}
            
            <div className="space-y-3">
              <CardTitle className="text-3xl font-black leading-tight">
                {event.description}
              </CardTitle>
              {isLive && (
                <Badge variant="destructive" className="gap-2 whitespace-nowrap text-base px-4 py-2">
                  <div className="w-2.5 h-2.5 bg-destructive-foreground rounded-full animate-pulse" />
                  LIVE
                </Badge>
              )}
            </div>
          </div>
        ) : (
          // List view - horizontal compact layout
          <div className="flex items-center gap-4">
            {(logos.away || logos.home) && <div className="flex items-center gap-3 flex-shrink-0">
                {logos.away && <img src={logos.away} alt="Away team" className="w-14 h-14 object-contain" onError={e => {
              e.currentTarget.style.display = 'none';
            }} />}
                <span className="text-muted-foreground text-lg font-bold">@</span>
                {logos.home && <img src={logos.home} alt="Home team" className="w-14 h-14 object-contain" onError={e => {
              e.currentTarget.style.display = 'none';
            }} />}
              </div>}
            
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-bold leading-tight group-hover:text-primary transition-colors">
                {event.description}
              </CardTitle>
            </div>
            <div className="flex items-center gap-3">
              {isLive && <Badge variant="destructive" className="gap-1.5 whitespace-nowrap text-sm px-3 py-1.5">
                  <div className="w-2 h-2 bg-destructive-foreground rounded-full animate-pulse" />
                  LIVE
                </Badge>}
              <ChevronRight className="w-6 h-6 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        )}
      </CardHeader>
      
      {aiReasoning && (
        <CardContent className="pt-0 pb-3 border-b border-border/50">
          <div className="flex items-start gap-2 p-3 rounded-xl bg-primary/5 border border-primary/10">
            <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-primary/10 text-primary border-0 font-semibold shrink-0">
              AI Match
            </Badge>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {aiReasoning}
            </p>
          </div>
        </CardContent>
      )}
      
      {showMarkets && displayMarkets.length > 0 && <CardContent className="pt-0 pb-3">
          <div className="space-y-3">
            {displayMarkets.slice(0, 2).map(market => <div key={market.id}>
                <div className="font-semibold text-muted-foreground mb-2 text-xs uppercase tracking-wide">
                  {market.description}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {market.outcomes.filter(o => o.available || o.last).map(outcome => <button 
                      key={outcome.id} 
                      className="bg-secondary/30 border border-border rounded-md p-3 flex flex-col gap-1 hover:border-primary hover:bg-secondary/50 transition-all group cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOutcomeClick?.(outcome.id);
                      }}
                    >
                      <span className="text-xs font-bold text-foreground/90 group-hover:text-primary transition-colors">
                        {outcome.description}
                      </span>
                      {outcome.available ? <span className="text-lg font-black text-success font-mono">
                          {outcome.available.toFixed(2)}
                        </span> : outcome.last ? <span className="text-lg font-black text-warning font-mono">
                          {outcome.last.toFixed(2)}
                        </span> : null}
                    </button>)}
                </div>
              </div>)}
          </div>
        </CardContent>}
      
      {/* Game Info Footer */}
      <CardContent className="pt-2.5 pb-3 border-t border-border/50">
        <div className={`flex items-center gap-3 text-sm text-muted-foreground flex-wrap ${!onClick ? 'justify-center' : 'justify-between'}`}>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>{formatGameTime(event.game.scheduled_start)}</span>
          </div>
          {totalLiquidity > 0 && <div className={`flex items-center gap-1.5 text-success font-semibold rounded-md px-2 py-1 -mx-2 -my-1 transition-colors ${flashClass}`}>
              <DollarSign className="w-3.5 h-3.5" />
              <span>{formatLargeCurrency(totalLiquidity)} volume</span>
            </div>}
        </div>
      </CardContent>
    </Card>;
}