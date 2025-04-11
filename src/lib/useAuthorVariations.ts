'use client';

import { useState, useEffect } from 'react';
import { getAuthors, type Author } from './firestore';
import { defaultConfig } from './config';

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
    authorBio: getAuthorBio(currentAuthor),
    authorPhoto: getAuthorPhoto(currentAuthor),
    pubdate: loading ? '' : (currentAuthor?.createdAt || defaultConfig.pubdate),
    siteName: defaultConfig.siteName
  };
} 