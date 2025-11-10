import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatGameTime, calculateEventLiquidity, formatLargeCurrency, formatOdds } from "@/lib/betting-utils";
import { getEventLogos, getEventColors, parseTeamNames, getTeamAbbreviation } from "@/lib/team-logos";
import { Clock, DollarSign } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useOddsFormat } from "@/hooks/use-odds-format";
import { useMarketView } from "@/components/SettingsMenu";
import { ESPNScore, formatGameStatus, isGameLive } from "@/lib/espn-scores";
import { ensureCollegeLogoCached } from "@/lib/logo-cache";
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
  espnScore?: ESPNScore | null;
}
export function EventCard({
  event,
  onClick,
  showMarkets = false,
  aiReasoning,
  relevantMarket,
  onOutcomeClick,
  espnScore
}: EventCardProps) {
  const isMobile = useIsMobile();
  const {
    format
  } = useOddsFormat();
  const {
    showSpreadsAndTotals
  } = useMarketView();
  const isLive = event.status === "OPEN_INGAME";
  const activeMarkets = event.markets?.filter(m => m.outcomes.some(o => o.available || o.last)) || [];
  const [logosValid, setLogosValid] = useState({ away: true, home: true });
  const [displayLogos, setDisplayLogos] = useState(true);
  const logos = getEventLogos(event);
  const baseColors = getEventColors(event);
  // Override colors with null when logos are hidden
  const colors = displayLogos ? baseColors : { away: null, home: null };
  const teams = parseTeamNames(event.description);
  const totalLiquidity = calculateEventLiquidity(event);

  // Generate consistent random colors for the event
  const [randomColors] = useState(() => {
    const colorOptions = ['#2563eb', '#dc2626', '#16a34a', '#9333ea', '#ea580c', '#0891b2'];
    return {
      away: colorOptions[Math.floor(Math.random() * colorOptions.length)],
      home: colorOptions[Math.floor(Math.random() * colorOptions.length)]
    };
  });

  // Track logo load failures
  const handleLogoError = (side: 'away' | 'home') => {
    setLogosValid(prev => {
      const newValid = { ...prev, [side]: false };
      // If either logo fails, hide both
      if (!newValid.away || !newValid.home) {
        setDisplayLogos(false);
      }
      return newValid;
    });
  };

  // Background-warm college logo cache
  useEffect(() => {
    if (!teams || !event.game?.league) return;
    const league = event.game.league as "NCAAB" | "NCAAF" | string;
    if (league === "NCAAB" || league === "NCAAF") {
      ensureCollegeLogoCached(teams.away, league as "NCAAB" | "NCAAF");
      ensureCollegeLogoCached(teams.home, league as "NCAAB" | "NCAAF");
    }
  }, [teams?.away, teams?.home, event.game?.league]);

  // Consistent market type detection functions
  const isSpread = (m: any) => {
    const d = m.description?.toLowerCase() || '';
    const ot = (m.outcomes || []).map((o: any) => o.description?.toLowerCase() || '').join(' ');
    return /[+-]\d+(\.\d+)?/.test(d) || /[+-]\d+(\.\d+)?/.test(ot) || d.includes('spread');
  };
  const isTotal = (m: any) => {
    const d = m.description?.toLowerCase() || '';
    const ot = (m.outcomes || []).map((o: any) => o.description?.toLowerCase() || '').join(' ');
    return /(\s|^)t\s*\d+/.test(d) || d.includes('total') || d.includes('over/under') || /\bo\b|\bu\b|over|under/.test(ot);
  };
  const isMoneyline = (m: any) => {
    const totalOutcomes = m.outcomes?.length ?? 0;
    const hasTwoOutcomes = totalOutcomes === 2;
    return hasTwoOutcomes && !isSpread(m) && !isTotal(m);
  };

  // Find markets by type using consistent logic
  const moneylineMarket = activeMarkets.find(isMoneyline);
  const spreadMarket = activeMarkets.find(isSpread);
  const totalMarket = activeMarkets.find(isTotal);
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
  return <Card className={`${onClick ? 'hover:shadow-2xl transition-all duration-300 cursor-pointer group' : 'shadow-xl'} rounded-2xl overflow-hidden bg-card border border-border/30`} onClick={onClick}>
      <CardHeader className={onClick ? "pb-4 pt-5 px-5" : "pb-6 pt-8"}>
        {!onClick ?
      // Detail view - centered layout with large logos
      <div className="flex flex-col items-center gap-6 text-center">
            {(displayLogos && logos.away && logos.home) && <div className="flex items-center justify-center gap-12">
                {logos.away && <div className="flex flex-col items-center gap-4">
                    <div className="w-28 h-28 rounded-2xl bg-background shadow-lg flex items-center justify-center p-4">
                      <img src={logos.away} alt="Away team" className="w-full h-full object-contain" onError={() => handleLogoError('away')} />
                    </div>
                  </div>}
                <span className="text-2xl font-light text-muted-foreground/50">vs</span>
                {logos.home && <div className="flex flex-col items-center gap-4">
                    <div className="w-28 h-28 rounded-2xl bg-background shadow-lg flex items-center justify-center p-4">
                      <img src={logos.home} alt="Home team" className="w-full h-full object-contain" onError={() => handleLogoError('home')} />
                    </div>
                  </div>}
              </div>}
            
            <div className="space-y-3">
              <CardTitle className="text-3xl font-semibold leading-tight tracking-tight">
                {event.description}
              </CardTitle>
              
              {/* Score display for detail view */}
              {espnScore && (espnScore.home_score !== null || espnScore.away_score !== null) && (
                <div className="flex items-center justify-center gap-4 text-4xl font-bold">
                  <span>{espnScore.away_score ?? '-'}</span>
                  <span className="text-muted-foreground text-2xl">-</span>
                  <span>{espnScore.home_score ?? '-'}</span>
                </div>
              )}
              
              {isLive && <Badge variant="destructive" className="gap-2 whitespace-nowrap text-sm px-4 py-1.5 rounded-full font-medium">
                  <div className="w-2 h-2 bg-destructive-foreground rounded-full animate-pulse" />
                  LIVE {espnScore && formatGameStatus(espnScore)}
                </Badge>}
            </div>
          </div> :
      // List view - clean horizontal layout with prominent logos
      <div className="space-y-4">
            {/* Main content: Teams and logos - centered */}
            <div className="flex items-center justify-center gap-4">
              {displayLogos && logos.away && <div className="w-14 h-14 rounded-xl bg-background shadow-md flex items-center justify-center p-2.5 shrink-0 group-hover:scale-105 transition-transform duration-300">
                  <img src={logos.away} alt="Away team" className="w-full h-full object-contain" onError={() => handleLogoError('away')} />
                </div>}
              
              {/* Team names and matchup - centered */}
              <div className="text-center">
                <div className="text-base font-semibold text-foreground leading-tight tracking-tight">
                  {event.description}
                </div>
                
                {/* Score display for list view */}
                {espnScore && (espnScore.home_score !== null || espnScore.away_score !== null) && (
                  <div className="flex items-center justify-center gap-2 mt-1 text-lg font-bold">
                    <span>{espnScore.away_score ?? '-'}</span>
                    <span className="text-muted-foreground text-sm">-</span>
                    <span>{espnScore.home_score ?? '-'}</span>
                  </div>
                )}
                
                {/* Show date/time only when NOT live, or show LIVE badge when live */}
                {isLive ? <div className="flex items-center justify-center mt-2">
                    <Badge variant="destructive" className="gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium">
                      <div className="w-1.5 h-1.5 bg-destructive-foreground rounded-full animate-pulse" />
                      LIVE {espnScore && formatGameStatus(espnScore)}
                    </Badge>
                  </div> : <div className="flex items-center justify-center gap-3 mt-1.5">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="font-medium">{formatGameTime(event.game.scheduled_start)}</span>
                    </div>
                    {totalLiquidity > 0 && <div className={`flex items-center gap-1 text-xs text-muted-foreground font-medium transition-colors ${flashClass}`}>
                        <span>{formatLargeCurrency(totalLiquidity)} Vol.</span>
                      </div>}
                  </div>}
              </div>

              {displayLogos && logos.home && <div className="w-14 h-14 rounded-xl bg-background shadow-md flex items-center justify-center p-2.5 shrink-0 group-hover:scale-105 transition-transform duration-300">
                  <img src={logos.home} alt="Home team" className="w-full h-full object-contain" onError={() => handleLogoError('home')} />
                </div>}
            </div>

            {/* Outcomes - prominent betting options */}
            {showMarkets && activeMarkets.length > 0 && (() => {
          // Debug logging
          console.log('Active Markets:', activeMarkets.map(m => ({
            description: m.description,
            outcomeCount: m.outcomes.filter(o => o.available || o.last).length
          })));
          console.log('Show Spreads and Totals:', showSpreadsAndTotals);
          return <div className="grid grid-cols-3 gap-2">
                {showSpreadsAndTotals ?
            // Show all three columns with placeholders
            <>
                    {/* Moneyline Column */}
                    {(() => {
                const allOutcomes = moneylineMarket?.outcomes || [];
                const awayName = teams?.away;
                const homeName = teams?.home;
                const awayAbbr = awayName ? getTeamAbbreviation(awayName, event.game.league) : null;
                const homeAbbr = homeName ? getTeamAbbreviation(homeName, event.game.league) : null;
                const matchOutcome = (o: any, name?: string | null, abbr?: string | null) => {
                  const d = (o.description || '').toLowerCase();
                  return abbr && d.includes(abbr.toLowerCase()) || name && d.includes(name.toLowerCase());
                };
                const awayOutcome = allOutcomes.find((o: any) => matchOutcome(o, awayName, awayAbbr)) ?? allOutcomes[0];
                const homeOutcome = allOutcomes.find((o: any) => matchOutcome(o, homeName, homeAbbr)) ?? allOutcomes[1];
                const renderBox = (outcome: any, teamColor?: string | null, label?: string | null, isAway?: boolean) => {
                  const price = outcome?.available ?? outcome?.last;
                  // Use consistent random color if logos are not displayed
                  const finalColor = !displayLogos 
                    ? (isAway ? randomColors.away : randomColors.home)
                    : teamColor;
                  
                  if (price) {
                    return <button key={outcome.id} style={{
                      backgroundColor: finalColor || undefined,
                      borderColor: finalColor || undefined
                    }} className="w-full px-3 py-2 rounded-lg font-semibold text-xs transition-all duration-200 hover:scale-[1.02] border text-white hover:brightness-110 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.3)]" onClick={e => {
                      e.stopPropagation();
                      onOutcomeClick?.(outcome.id);
                    }}>
                              <div className="flex items-center justify-center gap-1.5">
                                <span className="text-xs font-bold uppercase tracking-wide">
                                  {label || outcome?.description}
                                </span>
                                <span className="text-base font-bold">
                                  {formatOdds(price, format)}
                                </span>
                              </div>
                            </button>;
                  }
                  return <div className="w-full px-3 py-2 rounded-lg border border-border bg-muted/30 text-muted-foreground/50 text-xs text-center">
                            {label || '-'}
                          </div>;
                };
                return <div className="space-y-2">
                          {renderBox(awayOutcome, colors.away, awayAbbr || awayName || null, true)}
                          {renderBox(homeOutcome, colors.home, homeAbbr || homeName || null, false)}
                        </div>;
              })()}

                    {/* Spread Column */}
                    {(() => {
                const spreadOutcomes = spreadMarket?.outcomes.filter(o => o.available || o.last) || [];
                if (spreadOutcomes.length === 2) {
                  return <div className="space-y-2">
                            {spreadOutcomes.map((outcome, index) => {
                      const price = outcome.available || outcome.last;
                      const teamName = index === 0 ? teams?.away : teams?.home;
                      const teamAbbr = teamName ? getTeamAbbreviation(teamName, event.game.league) : null;

                      // Extract spread value from description (e.g., "+3.5" or "-3.5")
                      const spreadMatch = outcome.description.match(/([+-]?\d+\.?\d*)/);
                      const spreadValue = spreadMatch ? spreadMatch[1] : '';
                      return <button key={outcome.id} className="w-full px-3 py-2 rounded-lg font-semibold text-xs transition-all duration-200 hover:scale-[1.02] border border-border bg-muted/50 hover:bg-muted text-foreground shadow-[0_4px_6px_-1px_rgba(0,0,0,0.3)]" onClick={e => {
                        e.stopPropagation();
                        onOutcomeClick?.(outcome.id);
                      }}>
                                  <div className="flex items-center justify-center gap-1.5">
                                    <span className="text-xs font-bold uppercase">
                                      {teamAbbr} {spreadValue}
                                    </span>
                                    <span className="text-base font-bold">
                                      {price && formatOdds(price, format)}
                                    </span>
                                  </div>
                                </button>;
                    })}
                          </div>;
                } else {
                  // Placeholder when no spread available
                  return <div className="space-y-2">
                            <div className="w-full px-3 py-2 rounded-lg border border-border bg-muted/30 text-muted-foreground/50 text-xs text-center">
                              -
                            </div>
                            <div className="w-full px-3 py-2 rounded-lg border border-border bg-muted/30 text-muted-foreground/50 text-xs text-center">
                              -
                            </div>
                          </div>;
                }
              })()}

                    {/* Total Column */}
                    {(() => {
                const totalOutcomes = totalMarket?.outcomes.filter(o => o.available || o.last) || [];
                if (totalOutcomes.length >= 2) {
                  return <div className="space-y-2">
                            {totalOutcomes.slice(0, 2).map(outcome => {
                      const price = outcome.available || outcome.last;

                      // Extract Over/Under and total value from description
                      const isOver = outcome.description.toLowerCase().includes('over');
                      const totalMatch = outcome.description.match(/(\d+\.?\d*)/);
                      const totalValue = totalMatch ? totalMatch[1] : '';
                      return <button key={outcome.id} className="w-full px-3 py-2 rounded-lg font-semibold text-xs transition-all duration-200 hover:scale-[1.02] border border-border bg-muted/50 hover:bg-muted text-foreground shadow-[0_4px_6px_-1px_rgba(0,0,0,0.3)]" onClick={e => {
                        e.stopPropagation();
                        onOutcomeClick?.(outcome.id);
                      }}>
                                  <div className="flex items-center justify-center gap-1.5">
                                    <span className="text-xs font-bold uppercase">
                                      {isOver ? 'O' : 'U'} {totalValue}
                                    </span>
                                    <span className="text-base font-bold">
                                      {price && formatOdds(price, format)}
                                    </span>
                                  </div>
                                </button>;
                    })}
                          </div>;
                } else {
                  // Placeholder when no total available
                  return <div className="space-y-2">
                            <div className="w-full px-3 py-2 rounded-lg border border-border bg-muted/30 text-muted-foreground/50 text-xs text-center">
                              -
                            </div>
                            <div className="w-full px-3 py-2 rounded-lg border border-border bg-muted/30 text-muted-foreground/50 text-xs text-center">
                              -
                            </div>
                          </div>;
                }
              })()}
                  </> :
            // Default view - show best available market
            (() => {
              // Try moneyline first
              const moneylineOutcomes = moneylineMarket?.outcomes.filter(o => o.available || o.last) || [];
              if (moneylineOutcomes.length >= 2) {
                return <div className="col-span-3">
                          <div className="flex items-center gap-2">
                            {moneylineOutcomes.slice(0, 2).map((outcome, index) => {
                      const price = outcome.available || outcome.last;
                      const teamColor = index === 0 ? colors.away : colors.home;
                      const teamName = index === 0 ? teams?.away : teams?.home;
                      const teamAbbr = teamName ? getTeamAbbreviation(teamName, event.game.league) : null;
                      return <button key={outcome.id} style={{
                        backgroundColor: teamColor || undefined,
                        borderColor: teamColor || undefined
                      }} className="flex-1 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-[1.02] border text-white hover:brightness-110 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.3)]" onClick={e => {
                        e.stopPropagation();
                        onOutcomeClick?.(outcome.id);
                      }}>
                                  <div className="flex items-center justify-center gap-2">
                                    <span className="text-sm font-bold uppercase tracking-wide">
                                      {teamAbbr || outcome.description}
                                    </span>
                                    <span className="text-xl font-bold tracking-tight">
                                      {price && formatOdds(price, format)}
                                    </span>
                                  </div>
                                </button>;
                    })}
                          </div>
                        </div>;
              }

              // Fallback to spread if moneyline not available
              const spreadOutcomes = spreadMarket?.outcomes.filter(o => o.available || o.last) || [];
              if (spreadOutcomes.length >= 2) {
                return <div className="col-span-3">
                          <div className="flex flex-col gap-2">
                            
                            <div className="flex items-center gap-2">
                              {spreadOutcomes.slice(0, 2).map((outcome, index) => {
                        const price = outcome.available || outcome.last;
                        const teamName = index === 0 ? teams?.away : teams?.home;
                        const teamAbbr = teamName ? getTeamAbbreviation(teamName, event.game.league) : null;
                        const spreadMatch = outcome.description.match(/([+-]?\d+\.?\d*)/);
                        const spreadValue = spreadMatch ? spreadMatch[1] : '';
                        return <button key={outcome.id} className="flex-1 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-[1.02] border border-border bg-muted/50 hover:bg-muted text-foreground shadow-[0_4px_6px_-1px_rgba(0,0,0,0.3)]" onClick={e => {
                          e.stopPropagation();
                          onOutcomeClick?.(outcome.id);
                        }}>
                                    <div className="flex items-center justify-center gap-2">
                                      <span className="text-sm font-bold uppercase">
                                        {teamAbbr} {spreadValue}
                                      </span>
                                      <span className="text-xl font-bold tracking-tight">
                                        {price && formatOdds(price, format)}
                                      </span>
                                    </div>
                                  </button>;
                      })}
                            </div>
                          </div>
                        </div>;
              }

              // Fallback to total if neither moneyline nor spread available
              const totalOutcomes = totalMarket?.outcomes.filter(o => o.available || o.last) || [];
              if (totalOutcomes.length >= 2) {
                return <div className="col-span-3">
                          <div className="flex flex-col gap-2">
                            
                            <div className="flex items-center gap-2">
                              {totalOutcomes.slice(0, 2).map(outcome => {
                        const price = outcome.available || outcome.last;
                        const isOver = outcome.description.toLowerCase().includes('over');
                        const totalMatch = outcome.description.match(/(\d+\.?\d*)/);
                        const totalValue = totalMatch ? totalMatch[1] : '';
                        return <button key={outcome.id} className="flex-1 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-[1.02] border border-border bg-muted/50 hover:bg-muted text-foreground shadow-[0_4px_6px_-1px_rgba(0,0,0,0.3)]" onClick={e => {
                          e.stopPropagation();
                          onOutcomeClick?.(outcome.id);
                        }}>
                                    <div className="flex items-center justify-center gap-2">
                                      <span className="text-sm font-bold uppercase">
                                        {isOver ? 'O' : 'U'} {totalValue}
                                      </span>
                                      <span className="text-xl font-bold tracking-tight">
                                        {price && formatOdds(price, format)}
                                      </span>
                                    </div>
                                  </button>;
                      })}
                            </div>
                          </div>
                        </div>;
              }

              // No markets available - don't show any betting buttons
              return null;
            })()}
              </div>;
        })()}
          </div>}
      </CardHeader>
      
      {aiReasoning && <CardContent className="pt-0 pb-4 px-5">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10">
            <Badge variant="secondary" className="text-xs px-2.5 py-1 bg-primary/10 text-primary border-0 font-semibold shrink-0 rounded-full">
              AI Match
            </Badge>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {aiReasoning}
            </p>
          </div>
        </CardContent>}
      
      {/* Detail view footer */}
      {!onClick && <CardContent className="pt-4 pb-4 border-t border-border/30">
          <div className="flex items-center gap-4 text-sm text-muted-foreground justify-center">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span className="font-medium">{formatGameTime(event.game.scheduled_start)}</span>
            </div>
            {totalLiquidity > 0 && <div className={`flex items-center gap-1.5 font-semibold transition-colors ${flashClass}`}>
                <DollarSign className="w-4 h-4" />
                <span>{formatLargeCurrency(totalLiquidity)} volume</span>
              </div>}
          </div>
        </CardContent>}
    </Card>;
}