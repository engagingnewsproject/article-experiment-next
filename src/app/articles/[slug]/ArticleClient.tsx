'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { type Article, type Comment } from '@/lib/firestore';
import { useAuthorVariations } from '@/lib/useAuthorVariations';
import { ArticleContent } from '@/components/ArticleContent';

interface ArticleClientProps {
  article: Article;
  comments: Comment[];
}

function ArticleContentWithParams({ article, comments }: ArticleClientProps) {
  const searchParams = useSearchParams();
  const explain_box = searchParams?.get('explain_box') || '';
  const author_bio = searchParams?.get('author_bio') || 'basic';
  const { 
    loading: authorLoading, 
    authorName, 
    authorBio, 
    authorPhoto,
    pubdate,
    siteName 
  } = useAuthorVariations();

  if (authorLoading) return <div className="p-4">Loading...</div>;

  // Format comments for display
  const formattedComments = comments.map(comment => ({
    id: comment.id || '',
    name: comment.name || 'Anonymous',
    content: comment.content,
    timestamp: comment.createdAt ? new Date(comment.createdAt).toLocaleString() : 'Unknown date',
    upvotes: comment.upvotes || 0,
    downvotes: comment.downvotes || 0,
    replies: comment.replies?.map(reply => ({
      id: reply.id || '',
      name: reply.name || 'Anonymous',
      content: reply.content,
      upvotes: reply.upvotes || 0,
      downvotes: reply.downvotes || 0,
      timestamp: reply.createdAt ? new Date(reply.createdAt).toLocaleString() : 'Unknown date'
    })) || []
  }));

  return (
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
        createdAt: article.createdAt,
        updatedAt: article.updatedAt,
        comments_display: article.comments_display || true
      }} 
      showExplainBox={!!explain_box} 
      explainBoxValue={explain_box || ''}
      comments={formattedComments}
    />
  );
}

export default function ArticleClient(props: ArticleClientProps) {
  return (
    <Suspense fallback={<div className="p-4">Loading article content...</div>}>
      <ArticleContentWithParams {...props} />
    </Suspense>
  );
} 