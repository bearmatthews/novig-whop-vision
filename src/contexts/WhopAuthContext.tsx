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
        // Check if we're in an iframe (Whop context)
        const isInIframe = window.self !== window.top;
        
        if (!isInIframe) {
          console.log('Not in Whop iframe, skipping authentication');
          setLoading(false);
          return;
        }

        // Get the Whop token from headers (would be passed by Whop iframe)
        // For local development, you can mock this
        const whopToken = sessionStorage.getItem('whop-user-token');
        
        if (!whopToken) {
          console.log('No Whop token found');
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.functions.invoke('whop-auth', {
          headers: {
            'x-whop-user-token': whopToken,
          },
        });

        if (error) {
          console.error('Whop auth error:', error);
          setError(error.message);
        } else if (data?.user) {
          setUser(data.user);
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