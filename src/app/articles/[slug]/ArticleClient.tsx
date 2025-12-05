'use client';

import { ArticleContent } from '@/components/ArticleContent';
import { type Article, type Comment } from '@/lib/firestore';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { useQualtrics } from '@/hooks/useQualtrics';
import { getProjectConfig } from '@/lib/projectConfig';
import { useStudyId } from '@/hooks/useStudyId';

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
  const { qualtricsData } = useQualtrics(); // ✅ Added Qualtrics data hook
  const { studyId } = useStudyId();
  
  // Get project config for fallback values (pubdate, siteName, author)
  const projectConfig = getProjectConfig(studyId);
  
  // Use the article's stored author data (from project config at creation time)
  // This ensures custom project configs are reflected in the rendered article
  // Fall back to project config if article doesn't have author data
  const authorName = article.author?.name || projectConfig.articleConfig.author.name || 'Staff Reporter';
  const authorBio = {
    personal: article.author?.bio?.personal || projectConfig.articleConfig.author.bio.personal || '',
    basic: article.author?.bio?.basic || projectConfig.articleConfig.author.bio.basic || ''
  };
  const authorPhoto = article.author?.photo ? { src: article.author.photo, alt: authorName } : projectConfig.articleConfig.author.image;
  // Use article's pubdate, or fall back to project config's default pubdate
  const pubdate = article.pubdate || projectConfig.articleConfig.pubdate || '';
  const siteName = (article as any).siteName || projectConfig.siteName || 'The Gazette Star';

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
  }, []);

  // Format comments for display
  // Helper to safely convert createdAt to string
  const formatTimestamp = (createdAt: any): string => {
    if (!createdAt) return 'Unknown date';
    // If it's already a string (from convertToPlainObject), use it
    if (typeof createdAt === 'string') {
      try {
        return new Date(createdAt).toLocaleString();
      } catch {
        return createdAt;
      }
    }
    // If it's a Firestore Timestamp object
    if (createdAt && typeof createdAt === 'object' && createdAt.toDate) {
      return createdAt.toDate().toLocaleString();
    }
    // If it has _seconds (from JSON export)
    if (createdAt && typeof createdAt === 'object' && createdAt._seconds) {
      return new Date(createdAt._seconds * 1000).toLocaleString();
    }
    // Try to convert as Date
    try {
      return new Date(createdAt).toLocaleString();
    } catch {
      return 'Unknown date';
    }
  };

  const formattedComments = comments.map((comment, index) => {
    try {
      return {
        id: comment.id || `comment_${index}`,
        name: comment.name || 'Anonymous',
        content: comment.content || '',
        datePosted: comment.datePosted || "1 day ago",
        timestamp: formatTimestamp(comment.createdAt),
        upvotes: typeof comment.upvotes === 'string' ? parseInt(comment.upvotes) || 0 : (comment.upvotes || 0),
        downvotes: typeof comment.downvotes === 'string' ? parseInt(comment.downvotes) || 0 : (comment.downvotes || 0),
        replies: (comment.replies || []).map((reply, replyIndex) => ({
          parentId: comment.id || '',
          id: reply.id || `reply_${index}_${replyIndex}`,
          name: reply.name || 'Anonymous',
          content: reply.content || '',
          upvotes: typeof reply.upvotes === 'string' ? parseInt(reply.upvotes) || 0 : (reply.upvotes || 0),
          downvotes: typeof reply.downvotes === 'string' ? parseInt(reply.downvotes) || 0 : (reply.downvotes || 0),
          datePosted: reply.datePosted || "1 day ago",
          timestamp: formatTimestamp(reply.createdAt),
          replies: (reply.replies || []).map((subReply, subReplyIndex) => ({
            parentId: reply.id || '',
            id: subReply.id || `subreply_${index}_${replyIndex}_${subReplyIndex}`,
            name: subReply.name || 'Anonymous',
            content: subReply.content || '',
            upvotes: typeof subReply.upvotes === 'string' ? parseInt(subReply.upvotes) || 0 : (subReply.upvotes || 0),
            downvotes: typeof subReply.downvotes === 'string' ? parseInt(subReply.downvotes) || 0 : (subReply.downvotes || 0),
            datePosted: subReply.datePosted || "1 day ago",
            timestamp: formatTimestamp(subReply.createdAt),
          }))
        }))
      };
    } catch (error) {
      console.error(`Error formatting comment ${index}:`, error, comment);
      return null;
    }
  }).filter((c): c is NonNullable<typeof c> => c !== null);

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
          pubdate: pubdate,
          siteName: siteName,
          anonymous: article.anonymous || false,
          createdAt: article.createdAt,
          updatedAt: article.updatedAt,
          comments_display: article.comments_display || true,
          themes: article.themes || [],
          summary: article.summary || '',
          explain_box: article.explain_box || [],
          metadata: article.metadata
        }} 
        version={version}
        showExplainBox={!!explain_box} 
        explainBoxValue={explain_box || ''}
        comments={formattedComments}
        userId={userId || 'anonymous'}
        qualtricsData={qualtricsData} // ✅ Pass Qualtrics data to ArticleContent
        isAuthenticated={isAuthenticated} // ✅ Pass authentication status to ArticleContent
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