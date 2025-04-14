/**
 * Custom hook for tracking page views in Google Analytics.
 * 
 * This hook automatically tracks page views whenever the URL changes,
 * including both the pathname and search parameters. It integrates with
 * the application's analytics setup to provide comprehensive page view tracking.
 * 
 * @example
 * // Usage in a component:
 * usePageTracking();
 * 
 * @returns {void} This hook does not return any value
 */
import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { pageview } from '@/lib/analytics';

/**
 * Tracks page views by combining the current pathname and search parameters
 * into a complete URL and sending it to Google Analytics.
 * 
 * The hook:
 * - Monitors changes to the pathname and search parameters
 * - Constructs a complete URL including query parameters
 * - Sends the page view event to Google Analytics
 * 
 * @function usePageTracking
 * @returns {void}
 */
export const usePageTracking = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname) {
      const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
      pageview(url);
    }
  }, [pathname, searchParams]);
}; 