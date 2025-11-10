import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ESPNScore, formatGameStatus, isGameLive } from "@/lib/espn-scores";
import { Activity, Clock, Users, MapPin } from "lucide-react";
import { formatGameTime } from "@/lib/betting-utils";
import { getEventLogos, parseTeamNames } from "@/lib/team-logos";

interface GameDataViewProps {
  event: any;
  espnScore?: ESPNScore | null;
}

export function GameDataView({ event, espnScore }: GameDataViewProps) {
  const logos = getEventLogos(event);
  const teams = parseTeamNames(event.description);
  const isLive = event.status === "OPEN_INGAME" || (espnScore && isGameLive(espnScore.game_status));

  return (
    <div className="space-y-6">
      {/* Game Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Game Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Status</span>
            <div className="flex items-center gap-2">
              {isLive ? (
                <Badge variant="destructive" className="gap-1.5">
                  <div className="w-2 h-2 bg-destructive-foreground rounded-full animate-pulse" />
                  LIVE
                </Badge>
              ) : (
                <Badge variant="secondary">Scheduled</Badge>
              )}
            </div>
          </div>

          {espnScore && espnScore.game_status && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">ESPN Status</span>
              <span className="font-medium">{formatGameStatus(espnScore)}</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Scheduled Time</span>
            <span className="font-medium">{formatGameTime(event.game.scheduled_start)}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">League</span>
            <Badge variant="outline">{event.game.league}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Live Score Card */}
      {espnScore && (espnScore.home_score !== null || espnScore.away_score !== null) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Live Score
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Away Team */}
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-3">
                {logos.away && (
                  <div className="w-10 h-10 rounded-lg bg-background shadow-md flex items-center justify-center p-2">
                    <img 
                      src={logos.away} 
                      alt="Away team" 
                      className="w-full h-full object-contain"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  </div>
                )}
                <div>
                  <div className="font-semibold">{teams?.away || espnScore.away_team}</div>
                  <div className="text-xs text-muted-foreground">Away</div>
                </div>
              </div>
              <div className="text-3xl font-bold">{espnScore.away_score ?? '-'}</div>
            </div>

            {/* Home Team */}
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-3">
                {logos.home && (
                  <div className="w-10 h-10 rounded-lg bg-background shadow-md flex items-center justify-center p-2">
                    <img 
                      src={logos.home} 
                      alt="Home team" 
                      className="w-full h-full object-contain"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  </div>
                )}
                <div>
                  <div className="font-semibold">{teams?.home || espnScore.home_team}</div>
                  <div className="text-xs text-muted-foreground">Home</div>
                </div>
              </div>
              <div className="text-3xl font-bold">{espnScore.home_score ?? '-'}</div>
            </div>

            {espnScore.period && (
              <div className="text-center pt-2 border-t">
                <span className="text-sm text-muted-foreground">
                  {espnScore.clock ? `${espnScore.period} - ${espnScore.clock}` : `Period ${espnScore.period}`}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Teams Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Teams
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Away Team</span>
            <span className="font-medium">{teams?.away || espnScore?.away_team || 'N/A'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Home Team</span>
            <span className="font-medium">{teams?.home || espnScore?.home_team || 'N/A'}</span>
          </div>
        </CardContent>
      </Card>

      {/* Data Sources */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Data Sources
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Betting Markets</span>
            <Badge variant="outline">Novig</Badge>
          </div>
          {espnScore && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Live Scores</span>
              <Badge variant="outline">ESPN</Badge>
            </div>
          )}
          <div className="text-xs text-muted-foreground mt-4">
            Data is refreshed automatically every 15-30 seconds
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
