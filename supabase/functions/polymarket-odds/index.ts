import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PolymarketMarket {
  id: string;
  question: string;
  description?: string;
  outcomes: string[];
  outcomePrices: string[];
  volume: string;
  active: boolean;
  closed: boolean;
  tags?: string[];
  events?: any[];
}

interface PolymarketEvent {
  id: string;
  title: string;
  slug: string;
  markets: PolymarketMarket[];
  tags?: string[];
}

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
  
  // Try with "vs" separator
  const vsParts = description.split(/\svs?\s/i).map(p => p.trim());
  if (vsParts.length === 2) {
    return { away: vsParts[0], home: vsParts[1] };
  }
  
  return null;
}

// Match Novig game with Polymarket market
function matchGame(novigDescription: string, polymarketQuestion: string): boolean {
  const novigTeams = extractTeams(novigDescription);
  const polyTeams = extractTeams(polymarketQuestion);
  
  if (!novigTeams || !polyTeams) return false;
  
  const novigAwayNorm = normalizeTeamName(novigTeams.away);
  const novigHomeNorm = normalizeTeamName(novigTeams.home);
  const polyAwayNorm = normalizeTeamName(polyTeams.away);
  const polyHomeNorm = normalizeTeamName(polyTeams.home);
  
  // Check if teams match in either order
  return (
    (novigAwayNorm === polyAwayNorm && novigHomeNorm === polyHomeNorm) ||
    (novigAwayNorm === polyHomeNorm && novigHomeNorm === polyAwayNorm)
  );
}

// Convert Polymarket probability to decimal odds
function probabilityToOdds(probability: number): number {
  if (probability <= 0 || probability >= 1) return 1.01;
  return 1 / probability;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { novigEvents } = await req.json();
    
    console.log(`Fetching Polymarket sports markets for ${novigEvents?.length || 0} Novig events`);

    // Fetch Polymarket markets with sports tags
    const sportsResponse = await fetch(
      'https://gamma-api.polymarket.com/markets?tag=sports&limit=100&active=true',
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!sportsResponse.ok) {
      throw new Error(`Polymarket API error: ${sportsResponse.status}`);
    }

    const polymarketMarkets: PolymarketMarket[] = await sportsResponse.json();
    console.log(`Fetched ${polymarketMarkets.length} Polymarket sports markets`);

    // Match and enhance Novig events with Polymarket odds
    const enhancedEvents = novigEvents.map((novigEvent: any) => {
      // Find matching Polymarket markets
      const matchingMarkets = polymarketMarkets.filter(market => 
        matchGame(novigEvent.description, market.question)
      );

      if (matchingMarkets.length === 0) {
        return {
          ...novigEvent,
          polymarketData: null,
        };
      }

      // Process matching markets to extract comparable odds
      const polymarketOdds = matchingMarkets.map(market => {
        const outcomes = market.outcomes.map((outcome: string, index: number) => {
          const probability = parseFloat(market.outcomePrices[index]);
          return {
            description: outcome,
            odds: probabilityToOdds(probability),
            probability,
            source: 'polymarket',
            marketId: market.id,
          };
        });

        return {
          marketId: market.id,
          question: market.question,
          outcomes,
          volume: market.volume,
        };
      });

      return {
        ...novigEvent,
        polymarketData: {
          markets: polymarketOdds,
          matchCount: matchingMarkets.length,
        },
      };
    });

    // Calculate best odds for each outcome across both platforms
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
          let bestSource = 'novig';

          // Compare with Polymarket odds if available
          if (event.polymarketData?.markets) {
            for (const polyMarket of event.polymarketData.markets) {
              // Try to match outcome by description similarity
              const matchingPolyOutcome = polyMarket.outcomes.find((po: any) => {
                const outcomeLower = outcome.description.toLowerCase();
                const polyLower = po.description.toLowerCase();
                return polyLower.includes(outcomeLower) || outcomeLower.includes(polyLower);
              });

              if (matchingPolyOutcome && matchingPolyOutcome.odds > bestOdds) {
                bestOdds = matchingPolyOutcome.odds;
                bestSource = 'polymarket';
              }
            }
          }

          return {
            ...outcome,
            novigOdds,
            bestOdds,
            bestSource,
            polymarketOdds: event.polymarketData?.markets?.[0]?.outcomes?.find((po: any) => {
              const outcomeLower = outcome.description.toLowerCase();
              const polyLower = po.description.toLowerCase();
              return polyLower.includes(outcomeLower) || outcomeLower.includes(polyLower);
            })?.odds,
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

    return new Response(
      JSON.stringify({
        events: eventsWithBestOdds,
        polymarketMarketsCount: polymarketMarkets.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in polymarket-odds function:', error);
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
