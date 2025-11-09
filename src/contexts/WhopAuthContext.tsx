import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface WhopUser {
  id: string;
  email?: string;
  username?: string;
  profile_picture_url?: string;
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

export const WhopAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<WhopUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const authenticateUser = async () => {
      try {
        const isInIframe = window.self !== window.top;
        
        // For development/preview outside Whop: Use mock user
        if (!isInIframe) {
          console.log('Not in iframe: Using mock Whop user');
          setUser({
            id: 'dev-user-123',
            username: 'TestUser',
            email: 'test@whop.com',
            profile_picture_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=TestUser',
          });
          setLoading(false);
          return;
        }

        console.log('In Whop iframe: Attempting authentication...');
        
        // Call Vercel proxy endpoint which will forward with x-whop-user-token
        try {
          const vercelUrl = 'https://novig-whop-vision.vercel.app/whop-auth';
          const res = await fetch(vercelUrl, {
            method: 'POST',
            credentials: 'include',
          });

          if (res.ok) {
            const payload = await res.json().catch(() => null);
            if (payload?.user) {
              console.log('Whop user via Vercel proxy:', payload.user);
              setUser(payload.user);
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
          setUser(data.user);
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