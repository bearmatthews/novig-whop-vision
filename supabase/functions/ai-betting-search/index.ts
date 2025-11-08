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

    // Prepare events summary for AI context
    const eventsSummary = events.map((event: any) => ({
      id: event.id,
      description: event.description,
      league: event.game.league,
      status: event.status,
      scheduled_start: event.game.scheduled_start,
      markets: event.markets?.map((m: any) => ({
        description: m.description,
        outcomes: m.outcomes.map((o: any) => ({
          description: o.description,
          available: o.available,
          last: o.last
        }))
      }))
    }));

    const systemPrompt = `You are an expert sports betting assistant. Your job is to help users find betting opportunities based on their natural language queries.

Available Events Data:
${JSON.stringify(eventsSummary, null, 2)}

When a user asks about betting opportunities:
1. Analyze their query to understand what they're looking for (specific teams, leagues, bet types, odds ranges, etc.)
2. Search through the available events and markets to find relevant matches
3. Return event IDs that match their criteria
4. Provide a friendly, conversational response explaining what you found

Return your response in this JSON format:
{
  "message": "Your conversational response to the user",
  "eventIds": ["event_id_1", "event_id_2"],
  "reasoning": "Brief explanation of why you selected these events"
}

Examples:
- "Show me NBA games with good underdog odds" -> Find NBA events where underdogs have attractive odds
- "Find high-scoring games" -> Look for events with high over/under lines
- "What are the best bets for tonight?" -> Show events happening today with interesting odds
- "Lakers games" -> Filter for events involving the Lakers

Be helpful, concise, and focus on actionable betting insights.`;

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
        temperature: 0.7,
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
    } catch (e) {
      console.error("Failed to parse AI response:", content);
      parsedContent = {
        message: content,
        eventIds: [],
        reasoning: ""
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
