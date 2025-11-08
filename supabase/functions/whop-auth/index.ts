import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-whop-user-token',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the x-whop-user-token from the request headers
    // This is automatically added by Whop to requests made to our domain
    const whopToken = req.headers.get('x-whop-user-token');
    
    console.log('Whop auth request received');
    console.log('Has whop token:', !!whopToken);
    
    if (!whopToken) {
      console.log('No Whop token in headers');
      return new Response(
        JSON.stringify({ error: 'No Whop token provided', user: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    console.log('Calling Whop API to verify token...');
    
    // Call Whop API to verify token and get user info
    const whopApiKey = Deno.env.get('WHOP_API_KEY');
    const response = await fetch('https://api.whop.com/api/v2/me', {
      headers: {
        'Authorization': `Bearer ${whopToken}`,
        'X-Whop-Api-Key': whopApiKey || '',
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
    console.log('Whop user data retrieved:', userData.id);
    
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