import { useRouter } from 'next/router';
import { defaultConfig } from './config';

export const useAuthorVariations = () => {
  const router = useRouter();
  const { author_photo, author_bio } = router.query;

  const getAuthorBio = () => {
    if (author_bio === 'personal') {
      return defaultConfig.author.bio.personal;
    }
    if (author_bio === 'basic') {
      return defaultConfig.author.bio.basic;
    }
    return defaultConfig.author.bio.basic; // Default to basic bio
  };

  const getAuthorPhoto = () => {
    if (author_photo === 'none') {
      return null;
    }
    if (author_photo === 'true') {
      return defaultConfig.author.image;
    }
    return defaultConfig.author.image; // Default to showing photo
  };

  return {
    authorName: defaultConfig.author.name,
    authorBio: getAuthorBio(),
    authorPhoto: getAuthorPhoto(),
    pubdate: defaultConfig.pubdate,
    siteName: defaultConfig.siteName
  };
}; 