"use client";

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

import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { getSessionFromStorage } from '@/lib/auth';
import { getArticle, getArticleBySlug, getArticles, getComments, type Article, type Comment } from '@/lib/firestore';
import { Timestamp } from 'firebase/firestore';
import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import ArticleClient from './ArticleClient';
import { useStudyId } from '@/hooks/useStudyId';

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
function ArticlePageContent({ params }: { params: { slug: string } }) {
  const [article, setArticle] = useState<Article | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const searchParams = useSearchParams();
  const studyParam = searchParams?.get('study');
  // Only use studyId if explicitly provided in URL, otherwise treat as "no filter" (undefined)
  // This ensures backward compatibility - articles without studyId will be found when no URL param
  const { studyId: defaultStudyId } = useStudyId();
  const studyId = studyParam ? defaultStudyId : undefined;

  useEffect(() => {
    const fetchData = async () => {
      if (!params.slug) return;

      try {
        // If studyId is provided, use it; otherwise fetch without filter (for backward compatibility)
        let articleData = await getArticleBySlug(params.slug, studyId);

        if (articleData) {
          // Expose article ID to parent window for Qualtrics
          if (typeof window !== 'undefined') {
            (window as any).articleId = articleData.id;
          }
          setArticle(convertToPlainObject(articleData));
          const commentsData = await getComments(articleData.id || '');
          // Convert comments, handling nested replies recursively
          const convertComment = (comment: any): any => {
            const converted = convertToPlainObject(comment);
            if (converted.replies && Array.isArray(converted.replies)) {
              converted.replies = converted.replies.map(convertComment);
            }
            return converted;
          };
          const convertedComments = commentsData?.map(convertComment) || [];
          setComments(convertedComments);
        } else {
          console.warn(`Article not found: slug="${params.slug}", studyId="${studyId || 'none'}"`);
        }
      } catch (err) {
        console.error('Error fetching article:', err);
      }
    };

    fetchData();
  }, [params.slug, studyId]);

  useEffect(() => {
    const session = getSessionFromStorage();
    setIsAuthenticated(!!(session && session.isAuthenticated));
  }, []);

  if (!params.slug) {
    return <div className="p-4">Slug is not available</div>;
  }
  if (!article) {
    return <div className="p-4"></div>;
  }

  // Get siteName from article (stored from project config at creation) or fallback
  const siteName = (article as any)?.siteName || 'The Gazette Star';

  return (
    <div className="max-w-4xl p-4 mx-auto" data-article-id={article?.id}>
      { article && 
        <>
          <Header siteName={siteName} />
          <Suspense fallback={<div className="p-4">Loading article content...</div>}>
            <ArticleClient 
              article={article}
              comments={comments}
              isAuthenticated={isAuthenticated}
            />
          </Suspense>
        </>
        }
    </div>
  );
}

export default function ArticlePage({ params }: { params: { slug: string } }) {
  return (
    <Suspense fallback={<div className="p-4">Loading...</div>}>
      <ArticlePageContent params={params} />
    </Suspense>
  );
}