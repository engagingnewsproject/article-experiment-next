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

// TODO: List all available articles with URL parameters.
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getArticles, type Article } from '@/lib/firestore';
import AddArticleForm from '@/components/AddArticleForm';

export default function Home() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const articlesData = await getArticles();
        setArticles(articlesData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Articles</h1>
      <AddArticleForm />
      <ul className="space-y-4">
        {articles.map((article) => (
          <li key={article.id}>
            <div className="space-y-2">
              <Link
                href={`/articles/${article.slug}?explain_box=none`}
                className="text-blue-600 hover:underline"
              >
                {article.title}: No explanation
              </Link>
              <br />
              <Link
                href={`/articles/${article.slug}?explain_box=${article.slug}`}
                className="text-blue-600 hover:underline"
              >
                {article.title}: Explanation box
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
} 