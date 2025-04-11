import { useRouter } from 'next/router';
import { defaultConfig } from './config';
import { getAuthors } from './firestore';
import { useEffect, useState } from 'react';
import { Author } from './firestore';

export const useAuthorVariations = () => {
  const router = useRouter();
  const { author_photo, author_bio } = router.query;
  const [author, setAuthor] = useState<Author | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAuthor = async () => {
      try {
        const authors = await getAuthors();
        if (authors.length > 0) {
          setAuthor(authors[0]); // Using the first author for now
        }
      } catch (error) {
        console.error('Error fetching author:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAuthor();
  }, []);

  const getAuthorBio = () => {
    if (loading) return '';
    if (!author) return defaultConfig.author.bio.basic;
    
    if (author_bio === 'personal') {
      return author.bio.personal;
    }
    if (author_bio === 'basic') {
      return author.bio.basic;
    }
    return author.bio.basic; // Default to basic bio
  };

  const getAuthorPhoto = () => {
    if (loading) return null;
    if (!author) return defaultConfig.author.image;
    
    if (author_photo === 'none') {
      return null;
    }
    if (author_photo === 'true') {
      return author.image;
    }
    return author.image; // Default to showing photo
  };

  return {
    loading,
    authorName: loading ? '' : (author?.name || defaultConfig.author.name),
    authorBio: getAuthorBio(),
    authorPhoto: getAuthorPhoto(),
    pubdate: loading ? '' : (author?.createdAt || defaultConfig.pubdate),
    siteName: defaultConfig.siteName
  };
}; 