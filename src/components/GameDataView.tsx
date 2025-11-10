import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ESPNScore, formatGameStatus, isGameLive } from "@/lib/espn-scores";
import { GameDetails, extractGameId, fetchGameDetails, PlayerLeader } from "@/lib/game-details";
import { Activity, Clock, Users, MapPin, TrendingUp, CloudRain, User, Trophy, Target } from "lucide-react";
import { formatGameTime } from "@/lib/betting-utils";
import { getEventLogos, parseTeamNames } from "@/lib/team-logos";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface GameDataViewProps {
  event: any;
  espnScore?: ESPNScore | null;
}

export function GameDataView({ event, espnScore }: GameDataViewProps) {
  const [gameDetails, setGameDetails] = useState<GameDetails | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  
  const logos = getEventLogos(event);
  const teams = parseTeamNames(event.description);
  const isLive = event.status === "OPEN_INGAME" || (espnScore && isGameLive(espnScore.game_status));

  useEffect(() => {
    const loadGameDetails = async () => {
      const gameId = extractGameId(espnScore);
      if (!gameId) return;

      setIsLoadingDetails(true);
      const details = await fetchGameDetails(gameId, event.game.league);
      setGameDetails(details);
      setIsLoadingDetails(false);
    };

    loadGameDetails();
  }, [espnScore, event.game.league]);

  const renderPlayerLeader = (leader: PlayerLeader, statName: string) => (
    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
      {leader.athlete?.headshot && (
        <img 
          src={leader.athlete.headshot} 
          alt={leader.athlete.displayName}
          className="w-12 h-12 rounded-full object-cover border-2 border-border"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      )}
      <div className="flex-1">
        <div className="font-semibold text-sm">{leader.athlete?.displayName || leader.displayName}</div>
        <div className="text-xs text-muted-foreground">
          {leader.athlete?.position && `${leader.athlete.position} • `}
          {statName}
        </div>
      </div>
      <div className="text-xl font-bold">{leader.displayValue}</div>
    </div>
  );

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="players">Players</TabsTrigger>
        <TabsTrigger value="stats">Stats & Trends</TabsTrigger>
      </TabsList>

      {/* Overview Tab */}
      <TabsContent value="overview" className="space-y-6 mt-6">
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
                <span className="text-muted-foreground">Game Progress</span>
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
                <Trophy className="w-5 h-5" />
                Score
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Away Team */}
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  {(gameDetails?.away_team?.logo || logos.away) && (
                    <div className="w-12 h-12 rounded-lg bg-background shadow-md flex items-center justify-center p-2">
                      <img 
                        src={gameDetails?.away_team?.logo || logos.away} 
                        alt="Away team" 
                        className="w-full h-full object-contain"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    </div>
                  )}
                  <div>
                    <div className="font-semibold">{gameDetails?.away_team?.name || teams?.away || espnScore.away_team}</div>
                    <div className="text-xs text-muted-foreground">
                      {gameDetails?.away_team?.record && `Record: ${gameDetails.away_team.record}`}
                    </div>
                  </div>
                </div>
                <div className="text-4xl font-bold">{espnScore.away_score ?? '-'}</div>
              </div>

              {/* Home Team */}
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  {(gameDetails?.home_team?.logo || logos.home) && (
                    <div className="w-12 h-12 rounded-lg bg-background shadow-md flex items-center justify-center p-2">
                      <img 
                        src={gameDetails?.home_team?.logo || logos.home} 
                        alt="Home team" 
                        className="w-full h-full object-contain"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    </div>
                  )}
                  <div>
                    <div className="font-semibold">{gameDetails?.home_team?.name || teams?.home || espnScore.home_team}</div>
                    <div className="text-xs text-muted-foreground">
                      {gameDetails?.home_team?.record && `Record: ${gameDetails.home_team.record}`}
                    </div>
                  </div>
                </div>
                <div className="text-4xl font-bold">{espnScore.home_score ?? '-'}</div>
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

        {/* Venue & Weather */}
        {gameDetails && (gameDetails.venue || gameDetails.weather) && (
          <div className="grid gap-6 md:grid-cols-2">
            {gameDetails.venue && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Venue
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="font-semibold">{gameDetails.venue.fullName}</div>
                  {gameDetails.venue.address && (
                    <div className="text-sm text-muted-foreground">
                      {gameDetails.venue.address.city}, {gameDetails.venue.address.state}
                    </div>
                  )}
                  {gameDetails.attendance && (
                    <div className="text-sm text-muted-foreground">
                      Attendance: {gameDetails.attendance}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {gameDetails.weather && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CloudRain className="w-5 h-5" />
                    Weather
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-2xl font-bold">{gameDetails.weather.temperature}°F</div>
                  <div className="text-sm text-muted-foreground">{gameDetails.weather.displayValue}</div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </TabsContent>

      {/* Players Tab */}
      <TabsContent value="players" className="space-y-6 mt-6">
        {isLoadingDetails ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : gameDetails ? (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Away Team Leaders */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  {gameDetails.away_team.abbreviation} - Top Performers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {gameDetails.away_team.leaders.length > 0 ? (
                  gameDetails.away_team.leaders.map((category) => (
                    <div key={category.name} className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">{category.displayName}</div>
                      {category.leaders.slice(0, 3).map((leader, idx) => (
                        <div key={idx}>
                          {renderPlayerLeader(leader, category.displayName)}
                        </div>
                      ))}
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    Player data not available yet
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Home Team Leaders */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  {gameDetails.home_team.abbreviation} - Top Performers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {gameDetails.home_team.leaders.length > 0 ? (
                  gameDetails.home_team.leaders.map((category) => (
                    <div key={category.name} className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">{category.displayName}</div>
                      {category.leaders.slice(0, 3).map((leader, idx) => (
                        <div key={idx}>
                          {renderPlayerLeader(leader, category.displayName)}
                        </div>
                      ))}
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    Player data not available yet
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">
                Detailed player data not available for this game
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      {/* Stats & Trends Tab */}
      <TabsContent value="stats" className="space-y-6 mt-6">
        {/* Betting Odds */}
        {gameDetails?.odds && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Betting Lines
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {gameDetails.odds.details && (
                <div className="text-sm text-muted-foreground">
                  {gameDetails.odds.details}
                </div>
              )}
              {gameDetails.odds.overUnder && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Over/Under</span>
                  <span className="font-medium">{gameDetails.odds.overUnder}</span>
                </div>
              )}
              {gameDetails.odds.spread && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Spread</span>
                  <span className="font-medium">{gameDetails.odds.spread}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Data Sources */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Data Sources & Updates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Betting Markets</span>
              <Badge variant="outline">Novig</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Live Scores & Stats</span>
              <Badge variant="outline">ESPN</Badge>
            </div>
            <div className="text-xs text-muted-foreground mt-4 pt-4 border-t">
              Live data refreshes automatically every 15-30 seconds to provide the most up-to-date information.
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
