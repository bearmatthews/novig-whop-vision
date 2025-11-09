/**
 * Cloudflare Worker Proxy for Whop App
 * 
 * This worker:
 * 1. Intercepts POST /whop-auth requests
 * 2. Forwards them to Supabase edge function with x-whop-user-token header
 * 3. Proxies all other requests to your Lovable app
 * 
 * Deploy: wrangler deploy
 * Set as base_url in Whop app dashboard
 */

const SUPABASE_FUNCTION_URL = 'https://pxyzuhgqcgaljkcvnmel.supabase.co/functions/v1/whop-auth';
const LOVABLE_APP_URL = 'https://8c2962a5-84d3-461a-9ee6-6b646684606d.lovableproject.com';

export default {
  async fetch(request) {
    const url = new URL(request.url);
    
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

    // Intercept /whop-auth and forward to Supabase with token
    if (url.pathname === '/whop-auth' && request.method === 'POST') {
      const whopToken = request.headers.get('x-whop-user-token');
      
      console.log('Proxying /whop-auth to Supabase');
      console.log('Has x-whop-user-token:', !!whopToken);
      
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
    }

    // Proxy all other requests to Lovable app
    const lovableUrl = new URL(url.pathname + url.search, LOVABLE_APP_URL);
    const lovableRequest = new Request(lovableUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body,
      redirect: 'follow',
    });

    return fetch(lovableRequest);
  },
};
