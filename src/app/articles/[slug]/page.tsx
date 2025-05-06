/**
 * Article page component that displays a single article with optional explanation box
 * and author variations.
 * 
 * This component:
 * - Fetches article data and comments from Firestore
 * - Handles different author variations (name, bio, photo)
 * - Supports explanation box display based on URL parameters
 * - Manages loading and error states
 * 
 * @component
 * @param {Object} props - Component props
 * @param {Object} props.params - Route parameters
 * @param {string} props.params.slug - The article slug from the URL
 * @returns {JSX.Element} The article page layout with content and controls
 */

import { Suspense } from 'react';
import { getArticleBySlug, getArticle, getComments, getArticles, type Article, type Comment } from '@/lib/firestore';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import ArticleClient from './ArticleClient';
import { Timestamp } from 'firebase/firestore';

/**
 * Converts Firestore Timestamp to ISO string
 */
function convertTimestamp(timestamp: any): string {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toISOString();
  }
  if (typeof timestamp === 'string') {
    return timestamp;
  }
  return new Date().toISOString();
}

/**
 * Converts Firestore data to plain objects
 */
function convertToPlainObject(data: any): any {
  if (!data) return data;
  
  if (Array.isArray(data)) {
    return data.map(item => convertToPlainObject(item));
  }
  
  if (typeof data === 'object') {
    const result: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (value instanceof Timestamp) {
        result[key] = convertTimestamp(value);
      } else if (typeof value === 'object') {
        result[key] = convertToPlainObject(value);
      } else {
        result[key] = value;
      }
    }
    return result;
  }
  
  return data;
}

/**
 * Main article page component that manages article data and rendering.
 * 
 * @returns {JSX.Element} The rendered article page with content and controls
 */
export default async function ArticlePage({ params }: { params: { slug: string } }) {
  if (!params.slug) {
    return <div className="p-4">Slug is not available</div>;
  }

  try {
    let articleData = await getArticle(params.slug);
    
    if (!articleData) {
      articleData = await getArticleBySlug(params.slug);
    }

    if (!articleData) {
      return <div className="p-4">Article not found</div>;
    }

    const commentsData = await getComments(articleData.id || '');

    // Convert Firestore data to plain objects
    const plainArticle = convertToPlainObject(articleData);
    const plainComments = commentsData?.map(convertToPlainObject) || [];

    return (
      <>
        <Header />
        <main>
          <Suspense fallback={<div className="p-4">Loading article content...</div>}>
            <ArticleClient 
              article={plainArticle}
              comments={plainComments}
            />
          </Suspense>
        </main>
        <Footer />
      </>
    );
  } catch (err) {
    console.error('Error fetching article:', err);
    return <div className="p-4 text-red-500">Error: {err instanceof Error ? err.message : 'An error occurred'}</div>;
  }
} 