import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatGameTime, calculateEventLiquidity, formatLargeCurrency, formatOdds } from "@/lib/betting-utils";
import { getEventLogos } from "@/lib/team-logos";
import { Clock, ChevronRight, DollarSign, Share2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { ShareBetDialog } from "@/components/ShareBetDialog";
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
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const { format } = useOddsFormat();
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
  return <Card className={`${onClick ? 'hover:shadow-xl transition-all duration-200 cursor-pointer group border border-border/50 hover:border-border' : 'border border-border/50 shadow-sm'} rounded-xl overflow-hidden bg-card`} onClick={onClick}>
      <CardHeader className={onClick ? "pb-3 pt-4" : "pb-6 pt-8"}>
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
          // List view - modern horizontal layout inspired by Polymarket
          <div className="space-y-3">
            {/* Top row: Time, Volume, Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5 font-semibold">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>{formatGameTime(event.game.scheduled_start)}</span>
                </div>
                {totalLiquidity > 0 && (
                  <div className={`flex items-center gap-1.5 text-muted-foreground transition-colors ${flashClass}`}>
                    <span>{formatLargeCurrency(totalLiquidity)} Vol.</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {activeMarkets.length > 0 && (
                  <Badge variant="secondary" className="text-xs px-2 py-0.5 font-medium">
                    {activeMarkets.length}
                  </Badge>
                )}
                {isLive && (
                  <Badge variant="destructive" className="gap-1 text-xs px-2 py-0.5">
                    <div className="w-1.5 h-1.5 bg-destructive-foreground rounded-full animate-pulse" />
                    LIVE
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShareDialogOpen(true);
                  }}
                  className="h-7 w-7 p-0 hover:bg-accent"
                >
                  <Share2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Main content row: Teams on left, outcomes on right */}
            <div className="flex items-center justify-between gap-4">
              {/* Teams section */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {logos.away && (
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-secondary/30 flex items-center justify-center p-1.5">
                      <img 
                        src={logos.away} 
                        alt="Away team" 
                        className="w-full h-full object-contain" 
                        onError={e => { e.currentTarget.style.display = 'none'; }} 
                      />
                    </div>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
                    {event.description}
                  </div>
                </div>
                {logos.home && (
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-secondary/30 flex items-center justify-center p-1.5">
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

              {/* Outcomes section - show first market's top 2 outcomes */}
              {showMarkets && displayMarkets.length > 0 && displayMarkets[0].outcomes.filter(o => o.available || o.last).length > 0 && (
                <div className="flex items-center gap-2 shrink-0">
                  {displayMarkets[0].outcomes
                    .filter(o => o.available || o.last)
                    .slice(0, 2)
                    .map(outcome => {
                      const price = outcome.available || outcome.last;
                      return (
                        <button
                          key={outcome.id}
                          className="px-4 py-2.5 rounded-lg font-bold text-sm transition-all hover:scale-105 min-w-[90px] bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 hover:border-primary/40 text-foreground hover:shadow-md"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOutcomeClick?.(outcome.id);
                          }}
                        >
                          <div className="text-xs font-medium opacity-80 mb-0.5 truncate">
                            {outcome.description}
                          </div>
                          <div className="text-lg font-black">
                            {price && formatOdds(price, format)}
                          </div>
                        </button>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        )}
      </CardHeader>
      
      {aiReasoning && (
        <CardContent className="pt-0 pb-3 border-t border-border/50">
          <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
            <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-primary/10 text-primary border-0 font-semibold shrink-0">
              AI Match
            </Badge>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {aiReasoning}
            </p>
          </div>
        </CardContent>
      )}
      
      {showMarkets && displayMarkets.length > 1 && (
        <CardContent className="pt-0 pb-4 border-t border-border/50">
          <div className="space-y-3">
            {displayMarkets.slice(1, 3).map(market => (
              <div key={market.id}>
                <div className="font-semibold text-muted-foreground mb-2 text-xs uppercase tracking-wide">
                  {market.description}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {market.outcomes.filter(o => o.available || o.last).slice(0, 2).map(outcome => {
                    const price = outcome.available || outcome.last;
                    return (
                      <button 
                        key={outcome.id} 
                        className="bg-secondary/30 border border-border rounded-lg p-2.5 flex flex-col gap-1 hover:border-primary hover:bg-secondary/50 transition-all group cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOutcomeClick?.(outcome.id);
                        }}
                      >
                        <span className="text-xs font-medium text-foreground/80 group-hover:text-primary transition-colors truncate">
                          {outcome.description}
                        </span>
                        {price && (
                          <span className={`text-base font-black font-mono ${outcome.available ? 'text-success' : 'text-warning'}`}>
                            {formatOdds(price, format)}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      )}
      
      {/* Detail view footer */}
      {!onClick && (
        <CardContent className="pt-2.5 pb-3 border-t border-border/50">
          <div className="flex items-center gap-3 text-sm text-muted-foreground justify-center">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatGameTime(event.game.scheduled_start)}</span>
            </div>
            {totalLiquidity > 0 && (
              <div className={`flex items-center gap-1.5 text-success font-semibold rounded-md px-2 py-1 -mx-2 -my-1 transition-colors ${flashClass}`}>
                <DollarSign className="w-3.5 h-3.5" />
                <span>{formatLargeCurrency(totalLiquidity)} volume</span>
              </div>
            )}
          </div>
        </CardContent>
      )}
      
      <ShareBetDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        eventName={event.description}
      />
    </Card>;
}