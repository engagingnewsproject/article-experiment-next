/**
 * User ID generation and management utilities.
 * 
 * This module provides functions to generate and manage unique user IDs
 * for tracking user interactions across sessions.
 * 
 * @module userId
 */

/**
 * Generates a unique user ID with a prefix.
 * 
 * @param {string} prefix - The prefix to use for the user ID
 * @returns {string} A unique user ID
 */
export function generateUserId(prefix: string = 'trust_'): string {
  return `${prefix}${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Gets or creates a user ID from localStorage.
 * 
 * This function:
 * - Checks if a user ID already exists in localStorage
 * - If not found, generates a new one and stores it
 * - Returns the user ID for use in tracking
 * 
 * @param {string} prefix - The prefix to use when generating a new user ID
 * @returns {string} The user ID
 */
export function getOrCreateUserId(prefix: string = 'trust_'): string {
  if (typeof window === 'undefined') {
    // Server-side rendering - return a placeholder
    return 'anonymous';
  }

  let userId = localStorage.getItem('userID');
  
  if (!userId) {
    userId = generateUserId(prefix);
    localStorage.setItem('userID', userId);
  }
  
  return userId;
}

/**
 * Gets the current user ID without creating a new one.
 * 
 * @returns {string} The current user ID or 'anonymous' if not found
 */
export function getCurrentUserId(): string {
  if (typeof window === 'undefined') {
    return 'anonymous';
  }
  
  return localStorage.getItem('userID') || 'anonymous';
}

/**
 * Clears the stored user ID from localStorage.
 * This will cause a new user ID to be generated on the next visit.
 */
export function clearUserId(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('userID');
  }
} 