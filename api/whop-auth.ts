/**
 * Vercel Edge Function for Whop Authentication
 * 
 * This function:
 * 1. Receives requests with x-whop-user-token from Whop
 * 2. Forwards the token to your Supabase edge function
 * 3. Returns user data to the frontend
 */

export const config = {
  runtime: 'edge',
};

const SUPABASE_FUNCTION_URL = 'https://pxyzuhgqcgaljkcvnmel.supabase.co/functions/v1/whop-auth';

export default async function handler(request: Request) {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, x-whop-user-token',
      },
    });
  }

  // Only handle POST requests
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Extract Whop token from headers
    const whopToken = request.headers.get('x-whop-user-token');
    
    console.log('Proxying /whop-auth to Supabase');
    console.log('Has x-whop-user-token:', !!whopToken);

    // Forward to Supabase edge function with token
    const supabaseResponse = await fetch(SUPABASE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-whop-user-token': whopToken || '',
      },
    });

    const data = await supabaseResponse.json();

    return new Response(JSON.stringify(data), {
      status: supabaseResponse.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Authentication proxy failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}
