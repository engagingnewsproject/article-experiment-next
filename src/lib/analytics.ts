/**
 * Analytics utility functions for Google Analytics integration.
 * 
 * This module provides functions for tracking page views and custom events
 * using Google Analytics. It handles the initialization and configuration
 * of Google Analytics tracking.
 * 
 * @module analytics
 */

/**
 * Google Analytics Measurement ID.
 * 
 * This is the unique identifier for the Google Analytics property.
 * It can be configured through the NEXT_PUBLIC_GA_ID environment variable,
 * with a fallback to the default ID.
 * 
 * @constant {string}
 */
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID || 'G-M9XMXCYPQS';

/**
 * Tracks a page view in Google Analytics.
 * 
 * This function sends a page view event to Google Analytics with the
 * specified URL. It includes safety checks to ensure the gtag function
 * is available before attempting to track.
 * 
 * @param {string} url - The URL of the page being viewed
 * @returns {void}
 * 
 * @example
 * // Track a page view
 * pageview('/about');
 */
export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('config', GA_MEASUREMENT_ID, {
      page_path: url,
    });
  }
};

/**
 * Tracks a custom event in Google Analytics.
 * 
 * This function sends a custom event to Google Analytics with the
 * specified action and parameters. It includes safety checks to ensure
 * the gtag function is available before attempting to track.
 * 
 * @param {Object} params - Event parameters
 * @param {string} params.action - The name of the event
 * @param {Object} params.params - Additional parameters for the event
 * @returns {void}
 * 
 * @example
 * // Track a button click
 * event({
 *   action: 'button_click',
 *   params: {
 *     button_id: 'submit_button'
 *   }
 * });
 */
export const event = ({ action, params }: { action: string; params: any }) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', action, params);
  }
}; 