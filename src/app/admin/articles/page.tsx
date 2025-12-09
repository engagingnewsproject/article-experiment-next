/**
 * Admin Articles page component that displays a list of articles for a study.
 * 
 * This component:
 * - Fetches article data from Firestore filtered by study
 * - Displays articles with Copy URL and Edit buttons for authenticated admins
 * - Supports adding new articles through AddArticleForm
 * - Requires authentication to access
 * 
 * @component
 */

'use client';

import AddArticleForm from '@/components/AddArticleForm';
import { CopyUrlButton } from '@/components/admin/CopyUrlButton';
import { Header } from '@/components/Header';
import { getCurrentSession } from '@/lib/auth';
import { getArticles, type Article } from '@/lib/firestore';
import { useStudyId } from '@/hooks/useStudyId';
import Link from 'next/link';
import { useEffect, useState, Suspense, useCallback } from 'react';

function ArticlesContent() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { studyId } = useStudyId();
  const [refreshKey, setRefreshKey] = useState(0); // Force refresh trigger

  const fetchArticles = useCallback(async () => {
    try {
      setLoading(true);
      const articlesData = await getArticles(studyId);
      setArticles(articlesData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [studyId]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles, refreshKey]);

  // Expose refresh function globally so AddArticleForm can trigger it
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).refreshArticleList = () => {
        setRefreshKey(prev => prev + 1);
      };
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).refreshArticleList;
      }
    };
  }, []);

  const getArticleUrl = (article: Article): string => {
    const hasExplainBox = article.explain_box && article.explain_box.length > 0;
    const explainBoxParam = hasExplainBox ? '&explain_box=show' : '';
    return `${typeof window !== 'undefined' ? window.location.origin : ''}/articles/${article.slug}?study=${studyId}${explainBoxParam}`;
  };

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

  return (
    <>
      <Header />
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Articles</h1>
          <div className="flex space-x-2">
            <Link
              href="/admin"
              className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              <span className="text-white">
                Admin Dashboard
              </span>
            </Link>
            <Link
              href="/admin/add-default-comments"
              className="bg-green-600 px-4 py-2 rounded hover:bg-green-700 transition-colors"
            >
              <span className="text-white">
                Add Default Comments
              </span>
            </Link>
          </div>
        </div>
        {studyId && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm text-blue-800">
              <strong>Study:</strong> {studyId}
            </p>
          </div>
        )}
        <ul className="space-y-4 mb-8">
          {articles.map((article) => (
            <li key={article.id} className="border-b pb-4">
              <div className="space-y-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <div className="text-sm text-gray-500 mb-2">ID: {article.id}</div>
                    <Link
                      href={`/articles/${article.slug}?study=${studyId}`}
                      className="text-blue-600 hover:underline"
                    >
                      {article.title}
                    </Link>
                  </div>
                  {article.explain_box && article.explain_box.length > 0 ? (
                    <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded">
                      With explanation
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded">
                      No explanation
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <CopyUrlButton
                    url={getArticleUrl(article)}
                    title="Copy article URL to clipboard"
                  />
                  <Link
                    href={`/admin/edit-article/${article.id}`}
                    className="px-3 py-1 text-sm text-white bg-yellow-500 rounded hover:bg-yellow-700"
                    style={{color: 'white'}}
                  >
                    Edit
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <AddArticleForm />
      </div>
    </>
  );
}

export default function ArticlesPage() {
  return (
    <Suspense fallback={<div className="p-4">Loading...</div>}>
      <ArticlesContent />
    </Suspense>
  );
}