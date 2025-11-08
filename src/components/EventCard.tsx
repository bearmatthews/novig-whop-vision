import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatGameTime } from "@/lib/betting-utils";
import { Clock, TrendingUp } from "lucide-react";

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
  
  return (
    <Card 
      className="hover:border-primary transition-all cursor-pointer"
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{event.description}</CardTitle>
          {isLive && (
            <Badge variant="destructive" className="gap-1">
              <div className="w-2 h-2 bg-destructive-foreground rounded-full animate-pulse" />
              LIVE
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {formatGameTime(event.game.scheduled_start)}
          </div>
          {event.markets && (
            <div className="flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              {event.markets.length} markets
            </div>
          )}
        </div>
      </CardHeader>
      
      {showMarkets && event.markets && event.markets.length > 0 && (
        <CardContent>
          <div className="space-y-2">
            {event.markets.slice(0, 3).map((market) => (
              <div key={market.id} className="text-sm">
                <div className="font-medium text-muted-foreground mb-1">
                  {market.description}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {market.outcomes.map((outcome) => (
                    <div 
                      key={outcome.id}
                      className="bg-secondary rounded p-2 flex justify-between items-center"
                    >
                      <span className="text-xs">{outcome.description}</span>
                      {outcome.available ? (
                        <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                          {outcome.available.toFixed(2)}
                        </Badge>
                      ) : outcome.last ? (
                        <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                          {outcome.last.toFixed(2)}
                        </Badge>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {event.markets.length > 3 && (
              <div className="text-center text-sm text-muted-foreground pt-2">
                +{event.markets.length - 3} more markets
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
