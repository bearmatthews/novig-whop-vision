import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const THE_ODDS_API_KEY = Deno.env.get('THE_ODDS_API_KEY');
const THE_ODDS_API_BASE = 'https://api.the-odds-api.com/v4';

interface OddsAPIBookmaker {
  key: string;
  title: string;
  markets: Array<{
    key: string;
    outcomes: Array<{
      name: string;
      price: number;
    }>;
  }>;
}

interface OddsAPIEvent {
  id: string;
  sport_key: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: OddsAPIBookmaker[];
}

const SPORT_MAPPINGS: Record<string, string> = {
  'NBA': 'basketball_nba',
  'NFL': 'americanfootball_nfl',
  'MLB': 'baseball_mlb',
  'NHL': 'icehockey_nhl',
};

// Normalize team names for matching
function normalizeTeamName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9]/g, '');
}

// Extract team names from description (e.g., "Team A @ Team B")
function extractTeams(description: string): { away: string; home: string } | null {
  const parts = description.split('@').map(p => p.trim());
  if (parts.length === 2) {
    return { away: parts[0], home: parts[1] };
  }
  
  const vsParts = description.split(/\svs?\s/i).map(p => p.trim());
  if (vsParts.length === 2) {
    return { away: vsParts[0], home: vsParts[1] };
  }
  
  return null;
}

// Match Novig game with Odds API event
function matchGame(novigDescription: string, awayTeam: string, homeTeam: string): boolean {
  const novigTeams = extractTeams(novigDescription);
  if (!novigTeams) return false;
  
  const novigAwayNorm = normalizeTeamName(novigTeams.away);
  const novigHomeNorm = normalizeTeamName(novigTeams.home);
  const oddsAwayNorm = normalizeTeamName(awayTeam);
  const oddsHomeNorm = normalizeTeamName(homeTeam);
  
  return (
    (novigAwayNorm === oddsAwayNorm && novigHomeNorm === oddsHomeNorm) ||
    (novigAwayNorm === oddsHomeNorm && novigHomeNorm === oddsAwayNorm)
  );
}

// Convert American odds to decimal odds
function americanToDecimal(americanOdds: number): number {
  if (americanOdds > 0) {
    return (americanOdds / 100) + 1;
  } else {
    return (100 / Math.abs(americanOdds)) + 1;
  }
}

async function fetchOddsForSport(sportKey: string): Promise<OddsAPIEvent[]> {
  try {
    const response = await fetch(
      `${THE_ODDS_API_BASE}/sports/${sportKey}/odds?apiKey=${THE_ODDS_API_KEY}&regions=us&markets=h2h,spreads,totals&oddsFormat=american`,
      { headers: { 'Accept': 'application/json' } }
    );
    
    if (!response.ok) {
      console.error(`Failed to fetch odds for ${sportKey}: ${response.status}`);
      return [];
    }
    
    return await response.json();
  } catch (err) {
    console.error(`Error fetching odds for ${sportKey}:`, err);
    return [];
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { novigEvents } = await req.json();
    
    if (!THE_ODDS_API_KEY) {
      throw new Error('THE_ODDS_API_KEY not configured');
    }

    console.log(`Fetching odds for ${novigEvents?.length || 0} Novig events`);

    // Get unique leagues from Novig events
    const leagues = [...new Set(novigEvents.map((e: any) => e.game?.league).filter(Boolean))] as string[];
    console.log(`Fetching odds for leagues: ${leagues.join(', ')}`);

    // Fetch odds for all relevant sports in parallel
    const oddsPromises = leagues
      .filter(league => SPORT_MAPPINGS[league])
      .map(league => fetchOddsForSport(SPORT_MAPPINGS[league]));
    
    const oddsResults = await Promise.all(oddsPromises);
    const allOddsEvents = oddsResults.flat();
    
    console.log(`Fetched ${allOddsEvents.length} total odds events from The Odds API`);

    // Match and enhance Novig events with odds from multiple sportsbooks
    const enhancedEvents = novigEvents.map((novigEvent: any) => {
      const matchingOddsEvent = allOddsEvents.find(oddsEvent =>
        matchGame(novigEvent.description, oddsEvent.away_team, oddsEvent.home_team)
      );

      if (!matchingOddsEvent) {
        return { ...novigEvent, oddsComparison: null };
      }

      console.log(`Matched ${novigEvent.description} with ${matchingOddsEvent.bookmakers.length} bookmakers`);

      // Extract odds from all bookmakers
      const bookmakerOdds = matchingOddsEvent.bookmakers.map(bookmaker => ({
        name: bookmaker.title,
        key: bookmaker.key,
        markets: bookmaker.markets.map(market => ({
          type: market.key,
          outcomes: market.outcomes.map(outcome => ({
            name: outcome.name,
            price: outcome.price,
            decimalOdds: americanToDecimal(outcome.price),
          })),
        })),
      }));

      return {
        ...novigEvent,
        oddsComparison: {
          bookmakers: bookmakerOdds,
          matchedEvent: {
            id: matchingOddsEvent.id,
            commence_time: matchingOddsEvent.commence_time,
          },
        },
      };
    });

    // Calculate best odds for each outcome across all platforms
    const eventsWithBestOdds = enhancedEvents.map((event: any) => {
      if (!event.markets || !Array.isArray(event.markets)) {
        return event;
      }

      const enhancedMarkets = event.markets.map((market: any) => {
        if (!market.outcomes || !Array.isArray(market.outcomes)) {
          return market;
        }

        const enhancedOutcomes = market.outcomes.map((outcome: any) => {
          const novigOdds = outcome.available || outcome.last;
          let bestOdds = novigOdds;
          let bestSource = 'Novig';
          const allOdds: any[] = [{ source: 'Novig', odds: novigOdds }];

          // Compare with other sportsbooks if available
          if (event.oddsComparison?.bookmakers) {
            for (const bookmaker of event.oddsComparison.bookmakers) {
              for (const bmMarket of bookmaker.markets) {
                // Match market type (h2h for moneyline, spreads, totals)
                const matchingOutcome = bmMarket.outcomes.find((bmo: any) => {
                  const outcomeName = outcome.description.toLowerCase();
                  const bookmakerName = bmo.name.toLowerCase();
                  return bookmakerName.includes(outcomeName) || outcomeName.includes(bookmakerName);
                });

                if (matchingOutcome && matchingOutcome.decimalOdds > bestOdds) {
                  bestOdds = matchingOutcome.decimalOdds;
                  bestSource = bookmaker.name;
                }

                if (matchingOutcome) {
                  allOdds.push({
                    source: bookmaker.name,
                    odds: matchingOutcome.decimalOdds,
                    americanOdds: matchingOutcome.price,
                  });
                }
              }
            }
          }

          return {
            ...outcome,
            novigOdds,
            bestOdds,
            bestSource,
            allOdds: allOdds.sort((a, b) => b.odds - a.odds),
          };
        });

        return {
          ...market,
          outcomes: enhancedOutcomes,
        };
      });

      return {
        ...event,
        markets: enhancedMarkets,
      };
    });

    const matchedCount = eventsWithBestOdds.filter((e: any) => e.oddsComparison?.bookmakers?.length > 0).length;
    console.log(`Successfully matched ${matchedCount} events with sportsbook odds`);

    return new Response(
      JSON.stringify({
        events: eventsWithBestOdds,
        totalBookmakers: allOddsEvents.reduce((sum, e) => sum + e.bookmakers.length, 0),
        matchedEventsCount: matchedCount,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in odds comparison function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        events: [],
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
