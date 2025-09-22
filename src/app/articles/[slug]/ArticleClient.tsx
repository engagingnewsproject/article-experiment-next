'use client';

import { ArticleContent } from '@/components/ArticleContent';
import { type Article, type Comment } from '@/lib/firestore';
import { useAuthorVariations } from '@/lib/useAuthorVariations';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

interface ArticleClientProps {
  article: Article;
  comments: Comment[];
  isAuthenticated?: boolean;
}

function ArticleContentWithParams({ article, comments, isAuthenticated }: ArticleClientProps) {
  const [userId, setUserId] = useState('anonymous')
  const searchParams = useSearchParams();
  let version = searchParams?.get('version') || '3';
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

  function generateUUID(): string {
  const prefix = "user";
  const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, "");
  const randomString = Math.random().toString(36).substring(2, 10);
  return `${prefix}_${timestamp}_${randomString}`;
}

  useEffect(() => {
    const existingUserId = localStorage.getItem("userId");
    if (existingUserId) {
      setUserId(existingUserId);
    } else {
      const newUserId = generateUUID();
      localStorage.setItem("userId", newUserId);
      setUserId(newUserId);
    }
  }, [])

  if (authorLoading) return <div className="p-4">Loading...</div>;

  // Format comments for display
  const formattedComments = comments.map(comment => ({
    id: comment.id || '',
    name: comment.name || 'Anonymous',
    content: comment.content,
    datePosted: comment.datePosted || "1 day ago",
    timestamp: comment.createdAt ? new Date(comment.createdAt).toLocaleString() : 'Unknown date',
    upvotes: comment.upvotes || 0,
    downvotes: comment.downvotes || 0,
    replies: comment.replies?.map(reply => ({
      parentId: comment.id || '',
      id: reply.id || '',
      name: reply.name || 'Anonymous',
      content: reply.content,
      upvotes: reply.upvotes || 0,
      downvotes: reply.downvotes || 0,
      datePosted: reply.datePosted || "1 day ago",
      timestamp: reply.createdAt ? new Date(reply.createdAt).toLocaleString() : 'Unknown date',
      replies: reply.replies?.map(subReply => ({
        parentId: reply.id || '',
        id: subReply.id || '',
        name: subReply.name || 'Anonymous',
        content: subReply.content,
        upvotes: subReply.upvotes || 0,
        downvotes: subReply.downvotes || 0,
        datePosted: subReply.datePosted || "1 day ago",
        timestamp: subReply.createdAt ? new Date(subReply.createdAt).toLocaleString() : 'Unknown date',
      })) || []
    })) || []
  }));

  // Helper to generate edit article link with version=3 if not present
  function getEditArticleLink(articleId: string) {
    const params = new URLSearchParams(searchParams?.toString() || '');
    if (!params.has('version')) {
      params.set('version', '3');
    }
    return `/admin/edit-article/${articleId}?${params.toString()}`;
  }

  return (
    <div>
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
          comments_display: article.comments_display || true,
          themes: article.themes || [],
          summary: article.summary || ''
        }} 
        version={version}
        showExplainBox={!!explain_box} 
        explainBoxValue={explain_box || ''}
        comments={formattedComments}
        userId={userId || 'anonymous'}
      />
    </div>
  );
}

export default function ArticleClient(props: ArticleClientProps) {
  return (
    <Suspense fallback={<div className="p-4">Loading article content...</div>}>
      <ArticleContentWithParams {...props} />
    </Suspense>
  );
}