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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const studyParam = searchParams?.get('study');
  // Only use studyId if explicitly provided in URL, otherwise treat as "no filter" (undefined)
  // This ensures backward compatibility - articles without studyId will be found when no URL param
  const { studyId: defaultStudyId } = useStudyId();
  
  // If studyParam is provided, use it (even if invalid) to try to find the article
  // This handles cases where the study might exist but isn't in the validated list yet
  // If studyParam is invalid but article exists with that studyId, we'll still find it
  const studyId = studyParam ? studyParam : undefined;

  useEffect(() => {
    const fetchData = async () => {
      if (!params.slug) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Try fetching with the studyId from URL first (even if invalid)
        let articleData = await getArticleBySlug(params.slug, studyId);

        // If not found and studyId was provided, try without studyId filter as fallback
        // This handles cases where article exists but studyId validation failed
        if (!articleData && studyId) {
          console.warn(`Article not found with studyId="${studyId}", trying without study filter...`);
          articleData = await getArticleBySlug(params.slug, undefined);
        }

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
          setError(`Article not found with slug "${params.slug}"${studyId ? ` and study "${studyId}"` : ''}.`);
          console.warn(`Article not found: slug="${params.slug}", studyId="${studyId || 'none'}"`);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        setError(`Error loading article: ${errorMessage}`);
        console.error('Error fetching article:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.slug, studyId]);

  useEffect(() => {
    const session = getSessionFromStorage();
    setIsAuthenticated(!!(session && session.isAuthenticated));
  }, []);

  if (!params.slug) {
    return (
      <div className="max-w-4xl p-4 mx-auto">
        <Header />
        <div className="p-4 text-red-600">Slug is not available</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl p-4 mx-auto">
        <Header />
        <div className="p-4 text-center">
          <div className="inline-block w-8 h-8 border-b-2 border-blue-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading article...</p>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="max-w-4xl p-4 mx-auto">
        <Header />
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <h1 className="text-xl font-semibold text-red-800 mb-2">Article Not Found</h1>
          <p className="text-red-700">{error || 'The article you are looking for could not be found.'}</p>
          <p className="mt-4 text-sm text-red-600">
            Slug: <code className="bg-red-100 px-2 py-1 rounded">{params.slug}</code>
            {studyId && (
              <> | Study: <code className="bg-red-100 px-2 py-1 rounded">{studyId}</code></>
            )}
          </p>
        </div>
      </div>
    );
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