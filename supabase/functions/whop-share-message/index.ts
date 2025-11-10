const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { channel_id, content } = await req.json();

    if (!channel_id || !content) {
      return new Response(
        JSON.stringify({ error: 'channel_id and content are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const whopApiKey = Deno.env.get('WHOP_API_KEY');
    
    if (!whopApiKey) {
      console.error('WHOP_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Whop API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Sending message to channel:', channel_id);

    const whopResponse = await fetch('https://api.whop.com/api/v1/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${whopApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channel_id,
        content,
      }),
    });

    if (!whopResponse.ok) {
      const errorText = await whopResponse.text();
      console.error('Whop API error:', whopResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to send message', details: errorText }),
        { status: whopResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const message = await whopResponse.json();
    console.log('Message sent successfully:', message.id);

    return new Response(
      JSON.stringify({ success: true, message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in whop-share-message:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
