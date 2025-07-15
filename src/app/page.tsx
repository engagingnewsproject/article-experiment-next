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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Articles</h1>
        <div className="flex space-x-2">
        <Link
          href="/admin"
          className="bg-blue-300 px-4 py-2 rounded hover:bg-blue-600 transition-colors"
        >
          <span className="text-white"
          >
            Admin Dashboard
          </span>
        </Link>
        <Link
          href="/admin/add-default-comments"
          className="bg-green-600 px-4 py-2 rounded hover:bg-green-700 transition-colors"
        >
          <span className="text-white"
          >
            Admin: Add Default Comments
          </span>
        </Link>
        </div>
      </div>
      <AddArticleForm />
      <ul className="space-y-4">
        {articles.map((article) => (
          <li key={article.id} className="border-b pb-4">
            <div className="space-y-2">
              <div className="text-sm text-gray-500 mb-2">
                ID: {article.id}
              </div>
              <Link
                href={`/articles/${article.slug}`}
                className="text-blue-600 hover:underline"
              >
                {article.title}
              </Link>
              <br />
              {/* <Link
                href={`/articles/${article.slug}`}
                className="text-blue-600 hover:underline"
              >
                {article.title} — Explanation box
              </Link> */}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
} 