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

        // When in Whop iframe: Try to get token from URL params or postMessage
        console.log('In Whop iframe: Attempting to authenticate...');
        
        // Check if Whop passed token via URL
        const urlParams = new URLSearchParams(window.location.search);
        const tokenFromUrl = urlParams.get('token');
        
        if (tokenFromUrl) {
          console.log('Found token in URL parameters');
          // Call edge function with the token
          const { data, error: fnError } = await supabase.functions.invoke('whop-auth', {
            method: 'POST',
            headers: {
              'x-whop-user-token': tokenFromUrl,
            },
          });

          if (fnError) {
            console.error('Whop auth error:', fnError);
            setError(fnError.message);
          } else if (data?.user) {
            console.log('Whop user authenticated via URL token:', data.user);
            setUser(data.user);
          } else {
            console.log('No Whop user data returned');
          }
        } else {
          console.log('No token found - Whop app may need additional configuration');
          setError('Unable to authenticate: No Whop token found');
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