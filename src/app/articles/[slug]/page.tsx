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
import { getArticleBySlug, type Article, type Comment } from '@/lib/firestore';
import { Timestamp } from 'firebase/firestore';
import Link from 'next/link';
import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import ArticleClient from './ArticleClient';
import { useStudyId } from '@/hooks/useStudyId';
import { getStudyDefaults } from '@/lib/studies';
import { type ArticleConfig } from '@/lib/config';

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
 * Extracts Comment[] from article default_comments (avoids redundant Firestore read).
 * Mirrors getComments shape so ArticleClient receives the same structure.
 */
function commentsFromDefaultComments(raw: unknown): Comment[] {
  const comments: Comment[] = [];
  if (!raw) return comments;
  if (Array.isArray(raw)) {
    raw.forEach((comment: any, index: number) => {
      comments.push({
        id: comment.id || `default_${index}`,
        content: comment.content || '',
        name: comment.name || 'Anonymous',
        datePosted: comment.datePosted || 'Recently',
        createdAt: comment.createdAt,
        upvotes: comment.upvotes || 0,
        downvotes: comment.downvotes || 0,
        replies: comment.replies || [],
      } as Comment);
    });
  } else if (typeof raw === 'object') {
    Object.entries(raw).forEach(([key, comment]: [string, any]) => {
      comments.push({
        id: comment?.id || key,
        content: comment?.content || '',
        name: comment?.name || 'Anonymous',
        datePosted: comment?.datePosted || 'Recently',
        createdAt: comment?.createdAt,
        upvotes: comment?.upvotes || 0,
        downvotes: comment?.downvotes || 0,
        replies: comment?.replies || [],
      } as Comment);
    });
  }
  return comments;
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
  const [studyDefaults, setStudyDefaults] = useState<ArticleConfig | null>(null);
  const [loadTimeMs, setLoadTimeMs] = useState<number | undefined>(undefined);
  const loadStartRef = useRef<number | null>(null);
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
    let aborted = false;

    const fetchData = async () => {
      if (!params.slug) {
        if (!aborted) setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      setLoadTimeMs(undefined);
      loadStartRef.current = performance.now();

      try {
        let articleData = await getArticleBySlug(params.slug, studyId);

        if (!articleData && studyId) {
          console.warn(`Article not found with studyId="${studyId}", trying without study filter...`);
          articleData = await getArticleBySlug(params.slug, undefined);
        }

        if (aborted) return;

        if (articleData) {
          if (typeof window !== 'undefined') {
            (window as any).articleId = articleData.id;
          }
          const plain = convertToPlainObject(articleData);
          setArticle(plain);
          const rawComments = (articleData as any).default_comments;
          const baseComments = commentsFromDefaultComments(rawComments);
          const convertComment = (c: any): any => {
            const converted = convertToPlainObject(c);
            if (converted.replies && Array.isArray(converted.replies)) {
              converted.replies = converted.replies.map(convertComment);
            }
            return converted;
          };
          setComments(baseComments.map(convertComment));
        } else {
          setError(`Article not found with slug "${params.slug}"${studyId ? ` and study "${studyId}"` : ''}.`);
          console.warn(`Article not found: slug="${params.slug}", studyId="${studyId || 'none'}"`);
        }
      } catch (err) {
        if (aborted) return;
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        setError(`Error loading article: ${errorMessage}`);
        console.error('Error fetching article:', err);
      } finally {
        if (!aborted) {
          setLoading(false);
          if (loadStartRef.current != null) {
            setLoadTimeMs(Math.round(performance.now() - loadStartRef.current));
            loadStartRef.current = null;
          }
        }
      }
    };

    fetchData();
    return () => { aborted = true; };
  }, [params.slug, studyId]);

  useEffect(() => {
    const session = getSessionFromStorage();
    setIsAuthenticated(!!(session && session.isAuthenticated));
  }, []);

  // Load study defaults asynchronously
  useEffect(() => {
    async function loadDefaults() {
      const effectiveStudyId = studyId || defaultStudyId;
      const defaults = await getStudyDefaults(effectiveStudyId);
      setStudyDefaults(defaults);
    }
    loadDefaults();
  }, [studyId, defaultStudyId]);

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
        <Header loadTimeMs={loadTimeMs} />
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

  // Priority: article siteName first (if it exists), then study defaults siteName, then default
  // This maintains backward compatibility - articles with stored siteName keep it,
  // but articles without stored siteName use the study defaults
  const siteName = (article as any)?.siteName 
    || studyDefaults?.siteName 
    || 'The Gazette Star';

  return (
    <div className="max-w-4xl p-4 mx-auto" data-article-id={article?.id}>
      { article && 
        <>
          <Header siteName={siteName} loadTimeMs={loadTimeMs} />
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