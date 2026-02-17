'use client';

/**
 * Client wrapper for the article page when data is pre-fetched on the server.
 * Handles auth (client-only), Header, and passes article/comments/studyDefaults to ArticleClient.
 * No data fetching — all data comes from server so first paint shows full article in iframe.
 */

import { Header } from '@/components/Header';
import { getCurrentSession } from '@/lib/auth';
import type { Article, Comment } from '@/lib/firestore';
import type { ArticleConfig } from '@/lib/config';
import { Suspense, useEffect, useState } from 'react';
import ArticleClient from './ArticleClient';

export interface ArticlePageClientProps {
  article: Article;
  comments: Comment[];
  studyDefaults: ArticleConfig;
  slug: string;
}

export default function ArticlePageClient({
  article,
  comments,
  studyDefaults,
  slug,
}: ArticlePageClientProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const session = getCurrentSession();
    setIsAuthenticated(!!(session && session.isAuthenticated));
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && article?.id) {
      (window as unknown as { articleId?: string }).articleId = article.id;
    }
  }, [article?.id]);

  const siteName =
    (article as Article & { siteName?: string })?.siteName ||
    studyDefaults?.siteName ||
    'The Gazette Star';

  return (
    <div className="max-w-5xl p-4 mx-auto" data-article-id={article?.id}>
      <Header siteName={siteName} />
      <Suspense fallback={<div className="p-4">Loading article content...</div>}>
        <ArticleClient
          article={article}
          comments={comments}
          isAuthenticated={isAuthenticated}
          studyDefaults={studyDefaults}
        />
      </Suspense>
    </div>
  );
}
