export const config = {
  runtime: 'edge',
};

const SUPABASE_FUNCTION_URL = 'https://pxyzuhgqcgaljkcvnmel.supabase.co/functions/v1/whop-list-channels';

export default async function handler(request: Request) {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, x-whop-user-token',
      },
    });
  }

  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    // Extract the Whop user token from the incoming request
    const whopToken = request.headers.get('x-whop-user-token');
    
    console.log('Proxying whop-list-channels request, has token:', !!whopToken);

    // Forward the request to Supabase function with the Whop token
    const response = await fetch(SUPABASE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-whop-user-token': whopToken || '',
      },
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to proxy request' }),
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
