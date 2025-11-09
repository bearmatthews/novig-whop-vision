import { useEffect } from 'react';

/**
 * Hook to sync Whop's theme with the app's dark mode
 * Whop sends theme information via postMessage to iframes
 */
export function useWhopTheme() {
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Whop sends messages about theme changes
      if (event.data?.type === 'theme' || event.data?.theme) {
        const theme = event.data.theme || event.data.value;
        const html = document.documentElement;
        
        if (theme === 'dark') {
          html.classList.add('dark');
        } else if (theme === 'light') {
          html.classList.remove('dark');
        }
      }
    };

    // Listen for messages from Whop parent
    window.addEventListener('message', handleMessage);

    // Check if we're in an iframe and request initial theme
    if (window.self !== window.top) {
      window.parent.postMessage({ type: 'getTheme' }, '*');
    }

    // Check for initial dark mode preference from system
    // This serves as a fallback if Whop doesn't provide theme info
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark');
    }

    // Listen for system theme changes as fallback
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };
    mediaQuery.addEventListener('change', handleSystemThemeChange);

    return () => {
      window.removeEventListener('message', handleMessage);
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, []);
}
