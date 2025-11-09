import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, events, conversationHistory } = await req.json();
    
    if (!message) {
      throw new Error("Message is required");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an expert sports betting analyst with deep knowledge of odds analysis, market efficiency, and betting strategy.

Events Data: ${JSON.stringify(events)}

Your job is to ANALYZE the data, not just filter it. Perform sophisticated analysis:

1. ODDS ANALYSIS:
   - Calculate implied probabilities from decimal odds: probability = 1/odds
   - Find value bets where implied probability is lower than actual probability
   - Detect odds discrepancies between related markets
   - Compare moneyline to spread odds for inconsistencies

2. MARKET ANALYSIS:
   - High liquidity (large "qty" in orders) = sharp money, respect the line
   - Low liquidity = soft line, potential opportunity
   - Compare total liquidity across similar events to find market inefficiencies

3. STRATEGIC INSIGHTS:
   - Identify correlated betting opportunities
   - Find arbitrage possibilities across different market types
   - Detect line movement patterns (compare "last" vs "available" when both exist)
   - Calculate expected value and recommend Kelly Criterion sizing

4. PATTERN RECOGNITION:
   - Compare over/under lines across similar matchups
   - Find outlier odds that deviate from typical ranges
   - Identify home/away advantages reflected in odds
   - Spot trends in league-specific betting patterns

CRITICAL: Decimal odds format:
- 2.0 = even money (50% probability, +100 American)
- 1.5 = heavy favorite (66% probability, -200 American)
- 3.0 = underdog (33% probability, +200 American)

Response format (JSON):
{
  "message": "Your analytical insights (2-3 sentences explaining WHY these are good bets)",
  "results": [
    {
      "eventId": "id1",
      "reasoning": "Specific analytical reason (e.g., 'Implied 38% prob vs estimated 45% - 7% edge')",
      "relevantMarket": "specific market name"
    }
  ]
}

Be analytical and data-driven. Explain the EDGE, not just the outcome.`;

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
        model: "google/gemini-2.5-flash", // Using standard flash for better reasoning
        messages,
        temperature: 0.3, // Lower temp for more analytical responses
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
    } catch (e) {
      console.error("Failed to parse AI response:", content);
      parsedContent = {
        message: content,
        results: []
      };
    }

    return new Response(
      JSON.stringify(parsedContent),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in ai-betting-search:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
