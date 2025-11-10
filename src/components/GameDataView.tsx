import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ESPNScore, formatGameStatus, isGameLive } from "@/lib/espn-scores";
import { GameDetails, extractGameId, fetchGameDetails, PlayerLeader, Player, InjuryReport, HeadToHeadGame } from "@/lib/game-details";
import { Activity, Clock, Users, MapPin, TrendingUp, CloudRain, User, Trophy, Target, Heart, BarChart3, Shield, AlertCircle } from "lucide-react";
import { formatGameTime } from "@/lib/betting-utils";
import { getEventLogos, parseTeamNames } from "@/lib/team-logos";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

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
    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
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

  const renderPlayer = (player: Player) => (
    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
      {player.headshot && (
        <img 
          src={player.headshot} 
          alt={player.name}
          className="w-10 h-10 rounded-full object-cover border border-border"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      )}
      <div className="flex-1">
        <div className="font-semibold text-sm">{player.name}</div>
        <div className="text-xs text-muted-foreground">
          {player.position} #{player.jersey}
          {player.college && ` • ${player.college}`}
        </div>
      </div>
      {player.height && player.weight && (
        <div className="text-xs text-muted-foreground">
          {player.height} • {player.weight}lb
        </div>
      )}
    </div>
  );

  const renderInjury = (injury: InjuryReport) => (
    <div className="flex items-center gap-3 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
      {injury.athlete.headshot && (
        <img 
          src={injury.athlete.headshot} 
          alt={injury.athlete.name}
          className="w-10 h-10 rounded-full object-cover border border-destructive/30 grayscale"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      )}
      <div className="flex-1">
        <div className="font-semibold text-sm">{injury.athlete.name}</div>
        <div className="text-xs text-muted-foreground">
          {injury.athlete.position} • {injury.details.type}
        </div>
      </div>
      <Badge variant="destructive" className="text-xs">
        {injury.status}
      </Badge>
    </div>
  );

  const renderH2HGame = (game: HeadToHeadGame, homeTeamId: string, awayTeamId: string) => {
    const isHomeGame = game.home_team.id === homeTeamId;
    const currentTeamScore = isHomeGame ? game.home_team.score : game.away_team.score;
    const opponentScore = isHomeGame ? game.away_team.score : game.home_team.score;
    const didWin = isHomeGame ? game.home_team.winner : game.away_team.winner;
    
    return (
      <div className={`flex items-center justify-between p-3 rounded-lg border ${didWin ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
        <div className="flex-1">
          <div className="text-sm font-medium">{game.shortName}</div>
          <div className="text-xs text-muted-foreground">
            {new Date(game.date).toLocaleDateString()}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={didWin ? "default" : "secondary"} className="text-sm">
            {didWin ? 'W' : 'L'}
          </Badge>
          <span className="text-lg font-bold">
            {currentTeamScore} - {opponentScore}
          </span>
        </div>
      </div>
    );
  };

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-6">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="rosters">Rosters</TabsTrigger>
        <TabsTrigger value="injuries">Injuries</TabsTrigger>
        <TabsTrigger value="h2h">H2H</TabsTrigger>
        <TabsTrigger value="predictions">Predictions</TabsTrigger>
        <TabsTrigger value="venue">Venue</TabsTrigger>
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

        {/* Top Performers */}
        {!isLoadingDetails && gameDetails && (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  {gameDetails.away_team.abbreviation} Leaders
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {gameDetails.away_team.leaders.length > 0 ? (
                  gameDetails.away_team.leaders.slice(0, 3).map((category) => (
                    <div key={category.name} className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">{category.displayName}</div>
                      {category.leaders.slice(0, 1).map((leader, idx) => (
                        <div key={idx}>
                          {renderPlayerLeader(leader, category.displayName)}
                        </div>
                      ))}
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    Player data not available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  {gameDetails.home_team.abbreviation} Leaders
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {gameDetails.home_team.leaders.length > 0 ? (
                  gameDetails.home_team.leaders.slice(0, 3).map((category) => (
                    <div key={category.name} className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">{category.displayName}</div>
                      {category.leaders.slice(0, 1).map((leader, idx) => (
                        <div key={idx}>
                          {renderPlayerLeader(leader, category.displayName)}
                        </div>
                      ))}
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    Player data not available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </TabsContent>

      {/* Rosters Tab */}
      <TabsContent value="rosters" className="space-y-6 mt-6">
        {isLoadingDetails ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : gameDetails ? (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Away Team Roster */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  {gameDetails.away_team.abbreviation} Roster
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-2">
                    {gameDetails.away_team.roster && gameDetails.away_team.roster.length > 0 ? (
                      gameDetails.away_team.roster.map((player) => (
                        <div key={player.id}>
                          {renderPlayer(player)}
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-muted-foreground text-center py-8">
                        Roster data not available
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Home Team Roster */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  {gameDetails.home_team.abbreviation} Roster
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-2">
                    {gameDetails.home_team.roster && gameDetails.home_team.roster.length > 0 ? (
                      gameDetails.home_team.roster.map((player) => (
                        <div key={player.id}>
                          {renderPlayer(player)}
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-muted-foreground text-center py-8">
                        Roster data not available
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">
                Roster data not available for this game
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      {/* Injuries Tab */}
      <TabsContent value="injuries" className="space-y-6 mt-6">
        {isLoadingDetails ? (
          <Skeleton className="h-64 w-full" />
        ) : gameDetails ? (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Away Team Injuries */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5" />
                  {gameDetails.away_team.abbreviation} Injuries
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {gameDetails.away_team.injuries && gameDetails.away_team.injuries.length > 0 ? (
                    gameDetails.away_team.injuries.map((injury, idx) => (
                      <div key={idx}>
                        {renderInjury(injury)}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground flex flex-col items-center gap-2">
                      <Shield className="w-12 h-12 text-green-500" />
                      <div className="font-medium">No Injuries Reported</div>
                      <div className="text-sm">Full team available</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Home Team Injuries */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5" />
                  {gameDetails.home_team.abbreviation} Injuries
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {gameDetails.home_team.injuries && gameDetails.home_team.injuries.length > 0 ? (
                    gameDetails.home_team.injuries.map((injury, idx) => (
                      <div key={idx}>
                        {renderInjury(injury)}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground flex flex-col items-center gap-2">
                      <Shield className="w-12 h-12 text-green-500" />
                      <div className="font-medium">No Injuries Reported</div>
                      <div className="text-sm">Full team available</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">
                Injury data not available for this game
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      {/* Head-to-Head Tab */}
      <TabsContent value="h2h" className="space-y-6 mt-6">
        {isLoadingDetails ? (
          <Skeleton className="h-64 w-full" />
        ) : gameDetails?.head_to_head && gameDetails.head_to_head.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Recent Matchups
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {gameDetails.head_to_head.map((game) => (
                <div key={game.id}>
                  {renderH2HGame(game, gameDetails.home_team.id, gameDetails.away_team.id)}
                </div>
              ))}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground flex flex-col items-center gap-2">
                <AlertCircle className="w-12 h-12" />
                <div className="font-medium">No Recent Matchups</div>
                <div className="text-sm">Head-to-head history not available</div>
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      {/* Predictions Tab */}
      <TabsContent value="predictions" className="space-y-6 mt-6">
        {isLoadingDetails ? (
          <Skeleton className="h-64 w-full" />
        ) : gameDetails?.predictor ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  {gameDetails.away_team.abbreviation} Projection
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-5xl font-bold mb-2">
                    {gameDetails.predictor.awayTeam?.gameProjection || 'N/A'}
                  </div>
                  <div className="text-sm text-muted-foreground">Projected Score</div>
                </div>
                {gameDetails.predictor.awayTeam?.teamChanceLoss && (
                  <div className="pt-4 border-t">
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {(100 - parseFloat(gameDetails.predictor.awayTeam.teamChanceLoss)).toFixed(1)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Win Probability</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  {gameDetails.home_team.abbreviation} Projection
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-5xl font-bold mb-2">
                    {gameDetails.predictor.homeTeam?.gameProjection || 'N/A'}
                  </div>
                  <div className="text-sm text-muted-foreground">Projected Score</div>
                </div>
                {gameDetails.predictor.homeTeam?.teamChanceLoss && (
                  <div className="pt-4 border-t">
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {(100 - parseFloat(gameDetails.predictor.homeTeam.teamChanceLoss)).toFixed(1)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Win Probability</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">
                Predictions not available for this game
              </div>
            </CardContent>
          </Card>
        )}

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
      </TabsContent>

      {/* Venue Tab */}
      <TabsContent value="venue" className="space-y-6 mt-6">
        {isLoadingDetails ? (
          <Skeleton className="h-64 w-full" />
        ) : gameDetails ? (
          <div className="grid gap-6 md:grid-cols-2">
            {gameDetails.venue && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Venue Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="font-semibold text-lg">{gameDetails.venue.fullName}</div>
                  {gameDetails.venue.address && (
                    <div className="text-muted-foreground">
                      {gameDetails.venue.address.city}, {gameDetails.venue.address.state}
                    </div>
                  )}
                  {gameDetails.attendance && (
                    <div className="pt-3 border-t">
                      <div className="text-sm text-muted-foreground">Attendance</div>
                      <div className="text-2xl font-bold">{gameDetails.attendance}</div>
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
                    Weather Conditions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-5xl font-bold">{gameDetails.weather.temperature}°F</div>
                  <div className="text-muted-foreground">{gameDetails.weather.displayValue}</div>
                </CardContent>
              </Card>
            )}

            {/* Data Sources */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Data Sources & Updates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Betting Markets</span>
                    <Badge variant="outline">Novig</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Game Data</span>
                    <Badge variant="outline">ESPN</Badge>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mt-4 pt-4 border-t">
                  All data refreshes automatically every 15-30 seconds. Injury reports and rosters updated in real-time.
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">
                Venue information not available
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>
    </Tabs>
  );
}
