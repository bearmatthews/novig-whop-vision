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
    const verifyWhopToken = async () => {
      try {
        const isInIframe = window.self !== window.top;
        
        // For development/preview: Use mock user
        if (!isInIframe && import.meta.env.DEV) {
          console.log('Development mode: Using mock Whop user');
          setUser({
            id: 'dev-user-123',
            username: 'TestUser',
            email: 'test@whop.com',
            profile_picture_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=TestUser',
          });
          setLoading(false);
          return;
        }

        // 1) Try same-origin endpoint so Whop injects x-whop-user-token
        try {
          const res = await fetch('/whop-auth', { method: 'POST' });
          if (res.ok) {
            const data = await res.json();
            if (data?.user) {
              console.log('Whop user via same-origin endpoint');
              setUser(data.user);
              setLoading(false);
              return;
            }
          }
        } catch (e) {
          console.log('Same-origin whop-auth not available, falling back');
        }

        // 2) Fallback to edge function (header may not be present here)
        const { data, error: fnError } = await supabase.functions.invoke('whop-auth', {
          method: 'POST',
        });

        if (fnError) {
          console.error('Whop auth error:', fnError);
          setError(fnError.message);
          setLoading(false);
          return;
        }

        if (data?.user) {
          console.log('Whop user via edge function');
          setUser(data.user);
        } else {
          console.log('No Whop user data returned');
        }
      } catch (err) {
        console.error('Error verifying Whop token:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed');
      } finally {
        setLoading(false);
      }
    };

    verifyWhopToken();
  }, []);

  return (
    <WhopAuthContext.Provider value={{ user, loading, error }}>
      {children}
    </WhopAuthContext.Provider>
  );
};