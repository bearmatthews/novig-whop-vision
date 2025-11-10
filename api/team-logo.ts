export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  const { searchParams } = new URL(req.url);
  const team = searchParams.get('team');
  const league = searchParams.get('league');

  if (!team || !league) {
    return new Response('Missing parameters', { status: 400 });
  }

  const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  try {
    // Call edge function to fetch/cache logo
    const response = await fetch(`${SUPABASE_URL}/functions/v1/fetch-team-logo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY!,
      },
      body: JSON.stringify({ teamName: team, league }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch logo');
    }

    const data = await response.json();
    
    // Redirect to the cached logo URL
    return Response.redirect(data.url, 302);
  } catch (error) {
    console.error('Error fetching team logo:', error);
    // Return a transparent 1x1 pixel as fallback
    return new Response(
      Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64'),
      {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=31536000',
        },
      }
    );
  }
}
