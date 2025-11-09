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

    const systemPrompt = `You are an expert sports betting assistant. Find relevant betting opportunities from the provided events.

Events: ${JSON.stringify(events)}

CRITICAL: Each event contains markets with outcomes. The outcomes have odds stored in the "last" or "available" fields (these are decimal odds). 
- Higher decimal odds (e.g., 2.5, 3.0) = underdog = better payout
- Lower decimal odds (e.g., 1.5, 1.3) = favorite = worse payout

When users ask about:
- "Best underdog odds" → Look for outcomes with HIGHER decimal values (2.0+)
- "Favorites" → Look for outcomes with LOWER decimal values (1.8 or less)
- "High-scoring games" → Look for Over/Under markets with high totals
- Specific teams → Search event descriptions for team names

Response format (JSON):
{
  "message": "Brief explanation of what you found",
  "results": [
    {
      "eventId": "id1",
      "reasoning": "Short 1-sentence reason (max 15 words)",
      "relevantMarket": "market description if relevant"
    }
  ]
}

ALWAYS provide results if there are matching events. Use the odds data you have.`;

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
        model: "google/gemini-2.5-flash-lite", // Faster, cheaper model for this use case
        messages,
        temperature: 0.5,
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
