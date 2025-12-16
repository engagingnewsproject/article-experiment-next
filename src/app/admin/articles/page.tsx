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

  /**
   * Generates article URL with optional variant parameters.
   * 
   * @param article - The article object
   * @param variant - Optional variant configuration
   * @returns Complete article URL with variant parameters
   */
  const getArticleUrl = (
    article: Article, 
    variant?: {
      authorBio?: 'personal' | 'basic';
      explainBox?: boolean;
    }
  ): string => {
    const baseUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/articles/${article.slug}`;
    const params = new URLSearchParams();
    
    // Always include study
    params.set('study', studyId);
    
    // Add variant parameters
    if (variant?.authorBio) {
      params.set('author_bio', variant.authorBio);
    }
    
    if (variant?.explainBox !== undefined) {
      const hasExplainBox = article.explain_box && article.explain_box.length > 0;
      if (variant.explainBox && hasExplainBox) {
        params.set('explain_box', 'show');
      }
      // If explainBox is false, don't add the parameter (defaults to not showing)
    } else {
      // Default behavior: include explain_box if article has it
      const hasExplainBox = article.explain_box && article.explain_box.length > 0;
      if (hasExplainBox) {
        params.set('explain_box', 'show');
      }
    }
    
    return `${baseUrl}?${params.toString()}`;
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
            <p className="text-sm text-blue-800 !mb-0">
              <strong>Study:</strong> {studyId}
            </p>
          </div>
        )}
        <ul className="space-y-6 mb-8">
          {articles.map((article) => {
            const hasExplainBox = article.explain_box && article.explain_box.length > 0;
            
            return (
              <li key={article.id} className="border-b pb-4">
                <div className="space-y-3">
                  {/* Article Header Row */}
                  <div className="flex items-center gap-3">
                    <div>
                      <Link
                        href={`/articles/${article.slug}?study=${studyId}`}
                        className="text-blue-600 hover:underline font-medium"
                      >
                        {article.title}
                      </Link>
                      <div className="text-sm text-gray-500 mb-2">ID: {article.id}</div>
                    </div>
                    {hasExplainBox ? (
                      <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded">
                        With explanation
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded">
                        No explanation
                      </span>
                    )}
                  </div>
                  
                  {/* Variant Buttons Section */}
                  <div className="pl-4 border-l-2 border-gray-200">
                    <p className="text-xs font-medium text-gray-600 !mb-2">Article Variants:</p>
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Default */}
                      <CopyUrlButton
                        url={getArticleUrl(article)}
                        title="Copy default URL"
                        label="Default"
                        size="small"
                      />
                      
                      {/* Author Bio Variants */}
                      <CopyUrlButton
                        url={getArticleUrl(article, { authorBio: 'personal' })}
                        title="Copy URL with personal bio"
                        label="Personal Bio"
                        size="small"
                      />
                      <CopyUrlButton
                        url={getArticleUrl(article, { authorBio: 'basic' })}
                        title="Copy URL with basic bio"
                        label="Basic Bio"
                        size="small"
                      />
                      
                      {/* Explanation Box Variants (only if article has explain_box) */}
                      {hasExplainBox && (
                        <>
                          <CopyUrlButton
                            url={getArticleUrl(article, { explainBox: true })}
                            title="Copy URL with explanation box"
                            label="With Explanation"
                            size="small"
                          />
                          <CopyUrlButton
                            url={getArticleUrl(article, { explainBox: false })}
                            title="Copy URL without explanation box"
                            label="No Explanation"
                            size="small"
                          />
                        </>
                      )}
                      
                      {/* Combined Variants */}
                      {hasExplainBox && (
                        <>
                          <CopyUrlButton
                            url={getArticleUrl(article, { authorBio: 'personal', explainBox: true })}
                            title="Copy URL with personal bio and explanation"
                            label="Personal + Explanation"
                            size="small"
                          />
                          <CopyUrlButton
                            url={getArticleUrl(article, { authorBio: 'basic', explainBox: true })}
                            title="Copy URL with basic bio and explanation"
                            label="Basic + Explanation"
                            size="small"
                          />
                        </>
                      )}
                      
                      {/* Edit Button - pushed to the right */}
                      <Link
                        href={`/admin/edit-article/${article.id}`}
                        className="ml-auto px-3 py-1 text-sm text-white bg-yellow-500 rounded hover:bg-yellow-700"
                        style={{color: 'white'}}
                      >
                        Edit
                      </Link>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
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