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
import { PageHeader } from '@/components/admin/PageHeader';
import { getCurrentSession } from '@/lib/auth';
import { getArticles, type Article } from '@/lib/firestore';
import { loadStudies, type StudyDefinition } from '@/lib/studies';
import { getStudyBorderColor } from '@/lib/studyColors';
import { useStudyId } from '@/hooks/useStudyId';
import Link from 'next/link';
import { useEffect, useState, Suspense, useCallback } from 'react';

function ArticlesContent() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [studies, setStudies] = useState<StudyDefinition[]>([]);
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

  // Load studies for color assignment
  useEffect(() => {
    const loadStudiesData = async () => {
      try {
        const loadedStudies = await loadStudies();
        setStudies(loadedStudies);
      } catch (error) {
        console.error('Error loading studies:', error);
      }
    };
    loadStudiesData();
  }, []);

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
      <div className="max-w-4xl mx-auto p-4">
        <PageHeader title="Articles" />
        {studyId && (
          <div className={`mb-6 bg-white shadow border-l-4 p-5 ${
            studies.length > 0 ? getStudyBorderColor(studyId, studies) : 'border-blue-500'
          }`}>
            <h3 className="text-lg font-semibold text-gray-900 mb-0">
              {(() => {
                const study = studies.find(s => s.id === studyId || s.aliases?.includes(studyId));
                return study ? (
                  <>
                    {study.name} (<code className="text-sm font-mono bg-gray-100 px-1.5 py-0.5 rounded">{studyId}</code>)
                  </>
                ) : (
                  studyId
                );
              })()}
            </h3>
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

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h3 className="mb-2 text-sm font-semibold text-blue-900">About Article URLs</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Article URLs support query parameters to control content variants</li>
            <li>
              <code className="px-1 bg-blue-100 rounded">study</code> - Required parameter specifying the study ID (e.g., <code className="px-1 bg-blue-100 rounded">?study=eonc</code>)
            </li>
            <li>
              <code className="px-1 bg-blue-100 rounded">author_bio</code> - Optional parameter to control author bio display. Values: <code className="px-1 bg-blue-100 rounded">personal</code> or <code className="px-1 bg-blue-100 rounded">basic</code>
            </li>
            <li>
              <code className="px-1 bg-blue-100 rounded">explain_box</code> - Optional parameter to show/hide explanation boxes. Set to <code className="px-1 bg-blue-100 rounded">show</code> to display explanation boxes (only works if article has explanation content)
            </li>
            <li>Parameters can be combined (e.g., <code className="px-1 bg-blue-100 rounded">?study=eonc&author_bio=personal&explain_box=show</code>)</li>
          </ul>
        </div>
      </div>
  );
}

export default function ArticlesPage() {
  return (
    <Suspense fallback={<div className="p-4">Loading...</div>}>
      <ArticlesContent />
    </Suspense>
  );
}