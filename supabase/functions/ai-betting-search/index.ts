import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const SearchSchema = z.object({
  message: z.string().min(1).max(2000, 'Message too long'),
  events: z.array(z.any()).max(100, 'Too many events'),
  conversationHistory: z.array(z.any()).max(20, 'Conversation history too long').optional()
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawBody = await req.json();
    const { message, events, conversationHistory } = SearchSchema.parse(rawBody);
    
    if (!message) {
      throw new Error("Message is required");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an expert sports betting analyst with deep knowledge of odds analysis, market efficiency, and betting strategy.

Events Data: ${JSON.stringify(events)}

CRITICAL RULE: You MUST ALWAYS return 3-5 results, even if the query is vague or doesn't perfectly match. Be creative and interpretive with user queries.

Your job is to ANALYZE the data and ALWAYS find relevant opportunities. Never return empty results.

INTERPRETATION GUIDELINES:
- If user asks for "good bets", find value based on odds analysis
- If user asks for a specific team/league, prioritize those but also suggest similar opportunities
- If query is unclear, interpret it broadly and suggest diverse opportunities
- If exact match isn't found, suggest the CLOSEST alternatives with explanation
- Always look for: value bets, market inefficiencies, high-edge opportunities, and interesting matchups

ANALYSIS FRAMEWORK:

1. ODDS ANALYSIS:
   - Calculate implied probabilities from decimal odds: probability = 1/odds
   - Find value bets where implied probability seems lower than actual probability
   - Detect odds discrepancies between related markets
   - Compare different market types for the same event

2. MARKET ANALYSIS:
   - High liquidity (large "qty") = sharp money, respect the line
   - Low liquidity = soft line, potential opportunity
   - Compare liquidity across similar events for inefficiencies

3. STRATEGIC INSIGHTS:
   - Identify correlated betting opportunities
   - Find potential arbitrage across different market types
   - Look for favorable odds relative to typical ranges
   - Consider implied probability edges

4. PATTERN RECOGNITION:
   - Compare over/under lines across similar matchups
   - Find outlier odds that deviate from typical ranges
   - Identify home/away advantages in odds
   - Spot trends in league-specific patterns

ODDS FORMAT REFERENCE:
- 2.0 = even money (50% implied probability)
- 1.5 = heavy favorite (66% implied probability)
- 3.0 = underdog (33% implied probability)
- Higher odds = lower implied probability = bigger payout if wins

RESPONSE REQUIREMENTS:
- MUST return 3-5 results minimum
- Each result needs specific analytical reasoning
- If query doesn't match perfectly, explain how the suggestion is relevant
- Diversify suggestions (don't just pick same team/league)

Response format (JSON):
{
  "message": "Brief analytical insights explaining your recommendations (2-3 sentences)",
  "results": [
    {
      "eventId": "event_id_here",
      "reasoning": "Specific analytical reason with numbers (e.g., 'Implied 38% probability vs estimated 45% actual chance - 7% edge based on recent form')",
      "relevantMarket": "specific market name or type"
    }
  ]
}

Remember: ALWAYS return results. Be creative and helpful, not restrictive.`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...(conversationHistory || []),
      { role: "user", content: message }
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        temperature: 0.5, // Balanced for creativity and accuracy
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error("Failed to get AI response");
    }

    const aiResponse = await response.json();
    let content = aiResponse.choices[0].message.content;
    
    // Strip markdown code fences if present
    content = content.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
    
    let parsedContent;
    try {
      parsedContent = JSON.parse(content);
      // Backwards compatibility: convert old format to new format
      if (parsedContent.eventIds && !parsedContent.results) {
        parsedContent.results = parsedContent.eventIds.map((id: string) => ({
          eventId: id,
          reasoning: "",
          relevantMarket: ""
        }));
      }
      
      // Ensure results always exist and have at least some data
      if (!parsedContent.results || parsedContent.results.length === 0) {
        console.warn("AI returned no results, creating fallback");
        // Return top 3 events as fallback with basic reasoning
        const fallbackEvents = events.slice(0, 3);
        parsedContent.results = fallbackEvents.map((event: any) => ({
          eventId: event.id,
          reasoning: "Highlighted opportunity based on current market activity",
          relevantMarket: event.markets?.[0]?.description || "Main markets"
        }));
        parsedContent.message = parsedContent.message || "Here are some opportunities based on current market conditions.";
      }
    } catch (e) {
      console.error("Failed to parse AI response:", content);
      // Fallback to top events if parsing fails
      const fallbackEvents = events.slice(0, 3);
      parsedContent = {
        message: "Here are some current betting opportunities based on market activity.",
        results: fallbackEvents.map((event: any) => ({
          eventId: event.id,
          reasoning: "Active market with available betting opportunities",
          relevantMarket: event.markets?.[0]?.description || "Available markets"
        }))
      };
    }

    return new Response(
      JSON.stringify(parsedContent),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ error: 'Validation error', details: error.errors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    return new Response(
      JSON.stringify({ error: "Failed to process request" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
