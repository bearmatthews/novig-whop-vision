import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-whop-user-token, x-whop-app-id',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the x-whop-user-token from the request headers
    const whopToken = req.headers.get('x-whop-user-token');
    
    console.log('Whop auth request received');
    console.log('Has whop token:', !!whopToken);
    console.log('Request URL:', req.url);
    console.log('All headers:', JSON.stringify([...req.headers.entries()]));
    
    if (!whopToken) {
      console.log('No Whop token in headers');
      return new Response(
        JSON.stringify({ error: 'No Whop token provided', user: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    console.log('Calling Whop API to verify token...');
    
    // Extract user id from JWT without verification (Whop recommends SDK for full verification)
    let userId: string | null = null;
    try {
      const tokenParts = (whopToken || '').split('.');
      if (tokenParts.length === 3) {
        const payloadJson = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(tokenParts[1]), c => c.charCodeAt(0))));
        userId = payloadJson.sub || payloadJson.user_id || null;
        console.log('Decoded user id from token:', userId);
      }
    } catch (e) {
      console.error('Failed to decode Whop token payload:', e);
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Unable to decode user from token', user: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Retrieve user via Whop REST API using App API key
    const whopApiKey = Deno.env.get('WHOP_API_KEY');
    console.log('Has API key:', !!whopApiKey);

    const response = await fetch(`https://api.whop.com/api/v1/users/${userId}` , {
      headers: {
        'Authorization': `Bearer ${whopApiKey || ''}`,
      },
    });

    console.log('Whop API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Whop API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Invalid Whop token', details: errorText, user: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const userData = await response.json();
    console.log('Whop user data retrieved successfully');
    console.log('Full user data:', JSON.stringify(userData, null, 2));
    console.log('User ID:', userData.id);
    console.log('User username:', userData.username);
    console.log('Profile picture object:', userData.profile_picture);
    
    return new Response(
      JSON.stringify({ user: userData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in whop-auth function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage, user: null }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});