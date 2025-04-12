'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getArticleBySlug, getArticle, getComments, getAuthors, type Article, type Comment, type Author } from '@/lib/firestore';
import { useAuthorVariations } from '@/lib/useAuthorVariations';
import { Header } from '@/components/Header';
import { ArticleContent } from '@/components/ArticleContent';
import { Footer } from '@/components/Footer';
import { Timestamp } from 'firebase/firestore';

export default function ArticlePage({ params }: { params: { slug: string } }) {
  const searchParams = useSearchParams();
  const explain_box = searchParams?.get('explain_box') || '';
  const author_bio = searchParams?.get('author_bio') || 'basic';
  const [article, setArticle] = useState<Article | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { 
    loading: authorLoading, 
    authorName, 
    authorBio, 
    authorPhoto,
    pubdate,
    siteName 
  } = useAuthorVariations();

  useEffect(() => {
    const fetchData = async () => {
      if (!params.slug) {
        console.log('Slug is not available:', params.slug);
        return;
      }

      try {
        let articleData = await getArticle(params.slug);
        
        if (!articleData) {
          articleData = await getArticleBySlug(params.slug);
        }

        if (articleData && articleData.id) {
          const commentsData = await getComments(articleData.id);
          setArticle(articleData);
          if (commentsData) {
            setComments(commentsData);
          }
        }
      } catch (err) {
        console.error('Error fetching article:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.slug]);

  if (loading || authorLoading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;
  if (!article) return <div className="p-4">Article not found</div>;

  return (
    <>
      <Header />
      <main>
        <ArticleContent 
          article={{ 
            ...article, 
            id: article.id || '',
            author: {
              name: authorName,
              bio: authorBio,
              photo: authorPhoto?.src
            },
            anonymous: article.anonymous || false,
            createdAt: article.createdAt instanceof Date ? Timestamp.fromDate(article.createdAt) : article.createdAt,
            updatedAt: article.updatedAt instanceof Date ? Timestamp.fromDate(article.updatedAt) : article.updatedAt
          }} 
          showExplainBox={!!explain_box} 
          explainBoxValue={explain_box || ''}
          comments={comments}
        />
      </main>
      <Footer />
    </>
  );
} 