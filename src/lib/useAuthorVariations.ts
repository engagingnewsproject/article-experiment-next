/**
 * Custom hook for managing author variations and metadata.
 * 
 * This hook:
 * - Fetches author data from Firestore
 * - Provides author information with fallback values
 * - Handles different types of author biographies
 * - Manages author photo display
 * - Provides consistent author metadata across the application
 * 
 * @module useAuthorVariations
 */

'use client';

import { useState, useEffect } from 'react';
import { getAuthors, type Author } from './firestore';
import { defaultConfig } from './config';

/**
 * Custom hook that manages author variations and metadata.
 * 
 * This hook:
 * - Fetches authors from Firestore
 * - Provides loading and error states
 * - Returns author information with fallbacks
 * - Handles different bio types (personal/basic)
 * - Manages author photo display options
 * 
 * @returns {Object} Author variations and metadata
 * @property {Author[]} authors - Array of all authors
 * @property {boolean} loading - Loading state
 * @property {string | null} error - Error message if any
 * @property {string} authorName - Current author's name
 * @property {Object} authorBio - Author biography variations
 * @property {string} authorBio.personal - Personal biography
 * @property {string} authorBio.basic - Basic biography
 * @property {Object | null} authorPhoto - Author photo information
 * @property {string} pubdate - Publication date
 * @property {string} siteName - Site name
 */
export function useAuthorVariations() {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetches authors from Firestore and updates state.
   * 
   * This effect:
   * - Runs once on component mount
   * - Handles loading and error states
   * - Updates authors list on successful fetch
   */
  useEffect(() => {
    const fetchAuthors = async () => {
      try {
        const authorsData = await getAuthors();
        setAuthors(authorsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchAuthors();
  }, []);

  /**
   * Gets the appropriate author biography based on type.
   * 
   * @param {Author | null} author - The author object
   * @param {string} [bioType] - Type of biography to return
   * @returns {string} The requested biography text
   */
  const getAuthorBio = (author: Author | null, bioType?: string) => {
    if (loading) return '';
    if (!author?.bio) return defaultConfig.author.bio.basic;
    
    if (bioType === 'personal') {
      return author.bio.personal;
    }
    if (bioType === 'basic') {
      return author.bio.basic;
    }
    return author.bio.basic; // Default to basic bio
  };

  /**
   * Gets the author photo information based on display preference.
   * 
   * @param {Author | null} author - The author object
   * @param {boolean} [showPhoto] - Whether to show the photo
   * @returns {Object | null} Author photo information or null
   */
  const getAuthorPhoto = (author: Author | null, showPhoto?: boolean) => {
    if (loading) return null;
    if (!author) return defaultConfig.author.image;
    
    if (showPhoto === false) {
      return null;
    }
    return author.image;
  };

  const currentAuthor = authors[0] || null; // Using first author for now

  return {
    authors,
    loading,
    error,
    authorName: loading ? '' : (currentAuthor?.name || defaultConfig.author.name),
    authorBio: {
      personal: getAuthorBio(currentAuthor, 'personal'),
      basic: getAuthorBio(currentAuthor, 'basic')
    },
    authorPhoto: getAuthorPhoto(currentAuthor),
    pubdate: loading ? '' : (currentAuthor?.createdAt || defaultConfig.pubdate),
    siteName: defaultConfig.siteName
  };
} 