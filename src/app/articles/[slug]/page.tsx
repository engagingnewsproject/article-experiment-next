'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getArticleBySlug, getArticle, getComments, getAuthors, type Article, type Comment, type Author } from '@/lib/firestore';
import { useAuthorVariations } from '@/lib/useAuthorVariations';
import { Header } from '@/components/Header';
import { ArticleContent } from '@/components/ArticleContent';
import { Comments } from '@/components/Comments';
import { Footer } from '@/components/Footer';

export default function ArticlePage({ params }: { params: { slug: string } }) {
  const searchParams = useSearchParams();
  const explain_box = searchParams?.get('explain_box') || '';
  const [article, setArticle] = useState<Article | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { loading: authorLoading } = useAuthorVariations();

  useEffect(() => {
    const fetchAuthors = async () => {
      try {
        const authorsData = await getAuthors();
        setAuthors(authorsData);
      } catch (err) {
        console.error('Error fetching authors:', err);
      }
    };

    fetchAuthors();
  }, []);

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
      <ArticleContent 
        article={article} 
        showExplainBox={!!explain_box} 
        explainBoxValue={explain_box || ''}
      />
      <Comments 
        comments={comments} 
        anonymous={article.anonymous} 
        identifier={article.id || ''} 
      />
      <Footer />
    </>
  );
} 