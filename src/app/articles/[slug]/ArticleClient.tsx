'use client';

import { ArticleContent } from '@/components/ArticleContent';
import { type Article, type Comment } from '@/lib/firestore';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { useQualtrics } from '@/hooks/useQualtrics';
import { getStudyDefaults } from '@/lib/studies';
import { type ArticleConfig } from '@/lib/config';
import { useStudyId } from '@/hooks/useStudyId';

interface ArticleClientProps {
  article: Article;
  comments: Comment[];
  isAuthenticated?: boolean;
}

function ArticleContentWithParams({ article, comments, isAuthenticated }: ArticleClientProps) {
  const [userId, setUserId] = useState('anonymous')
  const [studyDefaults, setStudyDefaults] = useState<ArticleConfig | null>(null);
  const searchParams = useSearchParams();
  let version = searchParams?.get('version') || '3';
  const explain_box = searchParams?.get('explain_box') || '';
  const author_bio = searchParams?.get('author_bio') || 'basic';
  const { qualtricsData } = useQualtrics();
  const { studyId } = useStudyId();
  
  // Load study defaults asynchronously
  useEffect(() => {
    async function loadDefaults() {
      const defaults = await getStudyDefaults(studyId);
      setStudyDefaults(defaults);
    }
    loadDefaults();
  }, [studyId]);
  
  // Priority: Article values first (if they exist), then fall back to study defaults
  // This maintains backward compatibility - articles with stored values keep them,
  // but articles without stored values use the study defaults
  const authorName = article.author?.name 
    || studyDefaults?.author.name 
    || 'Staff Reporter';
  
  const authorBio = {
    personal: article.author?.bio?.personal 
      || studyDefaults?.author.bio.personal 
      || '',
    basic: article.author?.bio?.basic 
      || studyDefaults?.author.bio.basic 
      || ''
  };
  
  // Handle both photo (string) and image (object) formats
  // Priority: article photo/image, then study defaults image, then default
  const authorPhoto = (article.author as any)?.photo 
    ? { src: (article.author as any).photo, alt: authorName } 
    : (article.author as any)?.image 
    ? (article.author as any).image 
    : studyDefaults?.author.image 
    || { src: '/images/author-image.jpg', alt: authorName };
  
  // Priority: article pubdate, then study defaults pubdate, then empty
  const pubdate = article.pubdate 
    || studyDefaults?.pubdate 
    || '';
  
  // Priority: article siteName, then study defaults siteName, then default
  const siteName = (article as any).siteName 
    || studyDefaults?.siteName 
    || 'The Gazette Star';

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
          metadata: article.metadata,
          studyId: (article as any).studyId,
        }} 
        version={version}
        showExplainBox={!!explain_box} 
        explainBoxValue={explain_box || ''}
        comments={formattedComments}
        userId={userId || 'anonymous'}
        qualtricsData={qualtricsData}
        isAuthenticated={isAuthenticated}
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