'use client';

import { useState, useEffect } from 'react';
import { getAuthors, type Author } from './firestore';

export function useAuthorVariations() {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return {
    authors,
    loading,
    error
  };
} 