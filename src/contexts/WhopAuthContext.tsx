import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface WhopUser {
  id: string;
  email?: string;
  username?: string;
  profile_pic_url?: string;
}

interface WhopAuthContextType {
  user: WhopUser | null;
  loading: boolean;
  error: string | null;
}

const WhopAuthContext = createContext<WhopAuthContextType>({
  user: null,
  loading: true,
  error: null,
});

export const useWhopAuth = () => {
  const context = useContext(WhopAuthContext);
  if (!context) {
    throw new Error('useWhopAuth must be used within WhopAuthProvider');
  }
  return context;
};

const normalizeWhopUser = (raw: any): WhopUser => {
  const profilePicUrl = raw?.profile_picture?.url ?? raw?.profile_pic_url ?? raw?.profile_picture_url;
  console.log('Normalizing user - profile_picture object:', raw?.profile_picture);
  console.log('Extracted profile_pic_url:', profilePicUrl);
  
  return {
    id: raw?.id,
    email: raw?.email ?? undefined,
    username: raw?.username ?? raw?.name ?? undefined,
    profile_pic_url: profilePicUrl ?? undefined,
  };
};

export const WhopAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<WhopUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const authenticateUser = async () => {
      try {
        const isInIframe = window.self !== window.top;
        const host = window.location.hostname;
        const ref = document.referrer || '';
        const isLovablePreview = host.includes('lovableproject.com') || host.includes('lovable.app');
        const isWhopEmbed = isInIframe && (
          ref.includes('apps.whop.com') ||
          ref.includes('whop.com') ||
          host.endsWith('.apps.whop.com')
        );
        
        // For development/preview outside Whop: Use mock user
        if (!isWhopEmbed || isLovablePreview) {
          console.log('Not in Whop embed: Using mock Whop user');
          setUser({
            id: 'dev-user-123',
            username: 'TestUser',
            email: 'test@whop.com',
            profile_pic_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=TestUser',
          });
          setLoading(false);
          return;
        }

        console.log('In Whop iframe: Attempting authentication...');
        
        // Call Vercel proxy endpoint which will forward with x-whop-user-token
        try {
          const vercelUrl = '/whop-auth';
          const res = await fetch(vercelUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          });

          if (res.ok) {
            const payload = await res.json().catch(() => null);
            if (payload?.user) {
              console.log('Whop user via Vercel proxy:', payload.user);
              console.log('Raw user data:', JSON.stringify(payload.user, null, 2));
              const normalized = normalizeWhopUser(payload.user);
              console.log('Normalized user:', normalized);
              setUser(normalized);
              setLoading(false);
              return;
            }
            console.log('Vercel proxy returned no user:', payload);
          } else {
            console.log('Vercel proxy non-200:', res.status);
          }
        } catch (e) {
          console.log('Vercel proxy failed:', e);
        }

        // Fallback to Supabase edge function
        const { data, error: authError } = await supabase.functions.invoke('whop-auth', {
          method: 'POST',
        });

        if (authError) {
          console.error('Authentication error:', authError);
          setError(authError.message);
        } else if (data?.user) {
          console.log('User authenticated via fallback:', data.user);
          console.log('Raw fallback user data:', JSON.stringify(data.user, null, 2));
          const normalized = normalizeWhopUser(data.user);
          console.log('Normalized fallback user:', normalized);
          setUser(normalized);
        } else {
          console.log('No user data received');
          setError('Authentication incomplete - check Whop app configuration');
        }
      } catch (err) {
        console.error('Authentication exception:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed');
      } finally {
        setLoading(false);
      }
    };

    authenticateUser();
  }, []);

  return (
    <WhopAuthContext.Provider value={{ user, loading, error }}>
      {children}
    </WhopAuthContext.Provider>
  );
};