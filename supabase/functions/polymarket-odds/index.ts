import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Polymarket uses a different API structure than expected
// Let's adjust to handle their actual response format
interface PolymarketMarket {
  condition_id?: string;
  question: string;
  description?: string;
  end_date_iso?: string;
  game_start_time?: string;
  question_id?: string;
  market_slug?: string;
  outcomes?: string[];
  outcomePrices?: string[];
  outcome_prices?: string[];
  clob_token_ids?: string[];
  tokens?: Array<{
    token_id: string;
    outcome: string;
    price?: number;
  }>;
  volume?: string;
  active?: boolean;
  closed?: boolean;
  enable_order_book?: boolean;
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

    // Fetch Polymarket markets - try multiple endpoints
    let polymarketMarkets: any[] = [];
    let fetchSuccess = false;
    
    try {
      // Try the simplified markets endpoint first
      const simplifiedResponse = await fetch(
        'https://gamma-api.polymarket.com/markets?limit=100&closed=false',
        { headers: { 'Accept': 'application/json' } }
      );
      
      if (simplifiedResponse.ok) {
        const data = await simplifiedResponse.json();
        polymarketMarkets = Array.isArray(data) ? data : data.data || [];
        fetchSuccess = true;
        console.log(`Fetched ${polymarketMarkets.length} Polymarket markets`);
        
        // Log structure of first market to understand the format
        if (polymarketMarkets.length > 0) {
          console.log('First Polymarket market structure:', JSON.stringify(polymarketMarkets[0], null, 2));
        }
      }
    } catch (err) {
      console.error('Error fetching from Polymarket:', err);
    }

    if (!fetchSuccess || polymarketMarkets.length === 0) {
      console.log('No Polymarket markets found or API error, returning Novig data only');
      return new Response(
        JSON.stringify({
          events: novigEvents,
          polymarketMarketsCount: 0,
          matchedEventsCount: 0,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Match and enhance Novig events with Polymarket odds
    const enhancedEvents = novigEvents.map((novigEvent: any) => {
      // Find matching Polymarket markets
      const matchingMarkets = polymarketMarkets.filter(market => 
        matchGame(novigEvent.description, market.question)
      );

      if (matchingMarkets.length > 0) {
        console.log(`Found ${matchingMarkets.length} Polymarket matches for: ${novigEvent.description}`);
        console.log('Matched markets:', matchingMarkets.map(m => m.question));
      }

      if (matchingMarkets.length === 0) {
        return {
          ...novigEvent,
          polymarketData: null,
        };
      }

      // Process matching markets to extract comparable odds
      const polymarketOdds = matchingMarkets.map(market => {
        // Handle different possible structures from Polymarket
        const outcomes = (market.tokens || market.outcomes || []).map((outcome: any, index: number) => {
          let probability = 0.5; // default
          
          // Try to get price from different possible fields
          if (typeof outcome === 'object' && outcome.price) {
            probability = outcome.price;
          } else if (market.outcomePrices && market.outcomePrices[index]) {
            probability = parseFloat(market.outcomePrices[index]);
          } else if (market.outcome_prices && market.outcome_prices[index]) {
            probability = parseFloat(market.outcome_prices[index]);
          }
          
          const outcomeLabel = typeof outcome === 'string' ? outcome : (outcome.outcome || outcome.name || `Outcome ${index + 1}`);
          
          return {
            description: outcomeLabel,
            odds: probabilityToOdds(probability),
            probability,
            source: 'polymarket',
            marketId: market.condition_id || market.question_id || market.market_slug,
          };
        });

        return {
          marketId: market.condition_id || market.question_id || market.market_slug,
          question: market.question,
          outcomes,
          volume: market.volume || '0',
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

    const matchedCount = eventsWithBestOdds.filter((e: any) => e.polymarketData?.markets?.length > 0).length;
    console.log(`Successfully matched ${matchedCount} events with Polymarket data`);

    return new Response(
      JSON.stringify({
        events: eventsWithBestOdds,
        polymarketMarketsCount: polymarketMarkets.length,
        matchedEventsCount: matchedCount,
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
