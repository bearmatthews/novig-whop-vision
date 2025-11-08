import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatGameTime } from "@/lib/betting-utils";
import { Clock, TrendingUp, ChevronRight } from "lucide-react";

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

export function EventCard({ event, onClick, showMarkets = false }: EventCardProps) {
  const isLive = event.status === "OPEN_INGAME";
  const activeMarkets = event.markets?.filter(m => 
    m.outcomes.some(o => o.available || o.last)
  ) || [];
  
  return (
    <Card 
      className="hover:border-primary hover:shadow-lg transition-all cursor-pointer group"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg leading-tight mb-2 group-hover:text-primary transition-colors">
              {event.description}
            </CardTitle>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>{formatGameTime(event.game.scheduled_start)}</span>
              </div>
              {activeMarkets.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>{activeMarkets.length} markets</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            {isLive && (
              <Badge variant="destructive" className="gap-1.5 whitespace-nowrap">
                <div className="w-1.5 h-1.5 bg-destructive-foreground rounded-full animate-pulse" />
                LIVE
              </Badge>
            )}
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </div>
        </div>
      </CardHeader>
      
      {showMarkets && activeMarkets.length > 0 && (
        <CardContent className="pt-0">
          <div className="space-y-3">
            {activeMarkets.slice(0, 2).map((market) => (
              <div key={market.id} className="text-sm">
                <div className="font-medium text-muted-foreground mb-2 text-xs">
                  {market.description}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {market.outcomes.filter(o => o.available || o.last).map((outcome) => (
                    <div 
                      key={outcome.id}
                      className="bg-secondary/50 rounded-lg p-2.5 flex justify-between items-center hover:bg-secondary transition-colors"
                    >
                      <span className="text-xs font-medium truncate pr-2">{outcome.description}</span>
                      {outcome.available ? (
                        <Badge variant="outline" className="bg-success/10 text-success border-success/30 font-mono text-xs">
                          {outcome.available.toFixed(2)}
                        </Badge>
                      ) : outcome.last ? (
                        <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30 font-mono text-xs">
                          {outcome.last.toFixed(2)}
                        </Badge>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {activeMarkets.length > 2 && (
              <div className="text-center text-xs text-muted-foreground pt-1 border-t border-border/50">
                +{activeMarkets.length - 2} more markets
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
