import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatGameTime, calculateEventLiquidity, formatLargeCurrency } from "@/lib/betting-utils";
import { getEventLogos } from "@/lib/team-logos";
import { Clock, ChevronRight, DollarSign } from "lucide-react";
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
}
export function EventCard({
  event,
  onClick,
  showMarkets = false
}: EventCardProps) {
  const isLive = event.status === "OPEN_INGAME";
  const activeMarkets = event.markets?.filter(m => m.outcomes.some(o => o.available || o.last)) || [];
  const logos = getEventLogos(event);
  const totalLiquidity = calculateEventLiquidity(event);
  return <Card className="hover:border-primary hover:shadow-lg transition-all cursor-pointer group" onClick={onClick}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          {/* Team Logos */}
          {(logos.away || logos.home) && <div className="flex items-center gap-2 flex-shrink-0">
              {logos.away && <img src={logos.away} alt="Away team" className="w-10 h-10 object-contain" onError={e => {
            e.currentTarget.style.display = 'none';
          }} />}
              <span className="text-muted-foreground text-sm">@</span>
              {logos.home && <img src={logos.home} alt="Home team" className="w-10 h-10 object-contain" onError={e => {
            e.currentTarget.style.display = 'none';
          }} />}
            </div>}
          
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors">
              {event.description}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {isLive && <Badge variant="destructive" className="gap-1.5 whitespace-nowrap">
                <div className="w-1.5 h-1.5 bg-destructive-foreground rounded-full animate-pulse" />
                LIVE
              </Badge>}
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </div>
        </div>
      </CardHeader>
      
      {showMarkets && activeMarkets.length > 0 && <CardContent className="pt-0 pb-3">
          <div className="space-y-3">
            {activeMarkets.slice(0, 2).map(market => <div key={market.id} className="text-sm">
                <div className="font-medium text-muted-foreground mb-2 text-xs">
                  {market.description}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {market.outcomes.filter(o => o.available || o.last).map(outcome => <div key={outcome.id} className="bg-secondary/50 rounded-lg p-2.5 flex justify-between items-center hover:bg-secondary transition-colors">
                      <span className="text-xs font-medium truncate pr-2">{outcome.description}</span>
                      {outcome.available ? <Badge variant="outline" className="bg-success/10 text-success border-success/30 font-mono text-xs">
                          {outcome.available.toFixed(2)}
                        </Badge> : outcome.last ? <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30 font-mono text-xs">
                          {outcome.last.toFixed(2)}
                        </Badge> : null}
                    </div>)}
                </div>
              </div>)}
          </div>
        </CardContent>}
      
      {/* Game Info Footer */}
      <CardContent className="pt-2.5 pb-3 border-t border-border/50">
        <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground flex-wrap">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>{formatGameTime(event.game.scheduled_start)}</span>
          </div>
          {activeMarkets.length > 0 && <div className="flex items-center gap-1.5">
              
              <span>{activeMarkets.length} markets</span>
            </div>}
          {totalLiquidity > 0 && <div className="flex items-center gap-1.5 text-success font-semibold">
              <DollarSign className="w-3.5 h-3.5" />
              <span>{formatLargeCurrency(totalLiquidity)} volume</span>
            </div>}
        </div>
      </CardContent>
    </Card>;
}