/**
 * ArticleContent component that displays the main content of an article.
 *
 * This component:
 * - Renders the article header, content, and author bio
 * - Handles explanation box display based on URL parameters
 * - Integrates with Trust Project callout
 * - Manages comments section
 *
 * @component
 * @param {Object} props - Component props
 * @param {Article} props.article - The article data to display
 * @param {boolean} [props.showExplainBox=false] - Whether to show the explanation box
 * @param {string} [props.explainBoxValue] - The value for the explanation box
 * @param {Comment[]} [props.comments=[]] - Array of comments for the article
 * @returns {JSX.Element} The article content layout
 */
import { ArticleHeader } from "@/components/ArticleHeader";
import { AuthorBio } from "@/components/AuthorBio";
import BehindTheStory from "@/components/BehindTheStory";
import { Comments } from "@/components/Comments";
import { LikeShareButtons } from "@/components/LikeShareButtons";
import TrustProjectCallout from "@/components/TrustProjectCallout";
import { useLogger } from '@/hooks/useLogger';
import { type QualtricsData } from '@/hooks/useQualtrics';
import { type ArticleTheme } from "@/lib/firestore";
import { Article } from "@/types/article";
import DOMPurify from 'dompurify';
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from 'react';
import styles from "./ArticleContent.module.css";
import { ArticleSummary } from "./ArticleSummary";
import { ArticleThemeList } from "./ArticleThemes";

/**
 * Props interface for the ArticleContent component.
 *
 * @interface ArticleContentProps
 * @property {Article} article - The article data to display
 * @property {boolean} [showExplainBox=false] - Whether to show the explanation box
 * @property {string} [explainBoxValue] - The value for the explanation box
 * @property {Comment[]} [comments=[]] - Array of comments for the article
 */
interface ArticleContentProps {
  article: {
    id: string;
    title: string;
    content: string;
    author: {
      name: string;
      bio: {
        personal: string;
        basic: string;
      };
      photo?: string;
    };
    anonymous: boolean;
    createdAt?: any;
    updatedAt?: any;
    comments_display: boolean;
    pubdate: string;
    explain_box?: string[];
    metadata?: {
      who_spoke_to?: string[];
      where_written?: string;
      editor?: string;
      corrections?: string;
      version_history?: string;
      category?: string;
      tags?: string[];
    };
    themes: ArticleTheme[],
    summary: string;
    studyId?: string; // Study ID from article document (for logging)
    siteName?: string; // Site name from project config
    showLikeShare?: boolean; // Whether to show like and share icons
  };
  showExplainBox: boolean;
  explainBoxValue: string;
  version: string;
  comments: {
    id: string;
    name: string;
    content: string;
    datePosted: string;
    timestamp: string;
    upvotes: number;
    downvotes: number;
    replies: {
      parentId: string;
      id: string;
      name: string;
      content: string;
      upvotes: number;
      downvotes: number;
      datePosted: string;
      timestamp: string;
      replies: {
        parentId: string;
        id: string;
        name: string;
        content: string;
        upvotes: number;
        downvotes: number;
        datePosted: string;
        timestamp: string;
      }[];
    }[];
  }[];
  userId: string;
  qualtricsData?: QualtricsData;
  isAuthenticated?: boolean;
}

/**
 * Main article content component that orchestrates the display of article elements.
 *
 * This component:
 * - Renders the article header with title and metadata
 * - Displays the author bio with configurable bio type
 * - Shows article content with optional explanation box
 * - Includes Trust Project callout
 * - Manages the comments section
 *
 * @param {ArticleContentProps} props - Component props
 * @returns {JSX.Element} The complete article content layout
 */
export function ArticleContent({
  article,
  version,
  showExplainBox = false,
  explainBoxValue,
  comments = [],
  userId,
  qualtricsData,
  isAuthenticated = false,
}: ArticleContentProps) {
  const searchParams = useSearchParams();
  const author_bio = searchParams?.get("author_bio");
  const shouldShowAuthorBio = author_bio === "personal" || author_bio === "basic";
  const shouldShowExplainBox = showExplainBox && explainBoxValue !== "none";
  // Get studyId from article if available, otherwise it will use URL-based studyId
  const articleStudyId = article.studyId;
  
  // Debug: Log when Qualtrics data changes
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[ArticleContent] Qualtrics data updated:', qualtricsData);
    }
  }, [qualtricsData]);
  
  const { logPageView, logPageViewTime, logClick, logComment } = useLogger(qualtricsData || {}, articleStudyId);
  const timeWhenPageOpened = useRef<number>(Date.now());
  const lastLoggedArticleId = useRef<string | null>(null);

  // Log page view when component mounts (only once per article).
  // When embedded in Qualtrics, wait for qualtricsData.responseId so the page view is tied to the survey response.
  useEffect(() => {
    if (lastLoggedArticleId.current === article.id) return;

    const inIframe = typeof window !== 'undefined' && window.parent !== window;
    if (inIframe && !qualtricsData?.responseId) return; // wait for Qualtrics so dashboard can filter by QT Response ID

    timeWhenPageOpened.current = Date.now();
    lastLoggedArticleId.current = article.id;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const totalTimeSpentOnPage = Date.now() - timeWhenPageOpened.current;
      logPageViewTime(
        article.title,
        article.id,
        totalTimeSpentOnPage,
        userId,
        article.title
      );
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    logPageView(
      article.title,
      article.id,
      userId,
      article.title
    );

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      console.log('beforeunload');
      logPageViewTime(
        article.title,
        article.id,
        Date.now() - timeWhenPageOpened.current,
        userId,
        article.title
      );
    };
  }, [article.title, article.id, userId, qualtricsData?.responseId]);

  // Handle clicks within article content (links, images, etc.)
  const handleArticleContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    
    // Handle link clicks
    if (target.tagName === 'A' || target.closest('a')) {
      const linkElement = target.tagName === 'A' ? target : target.closest('a');
      if (linkElement) {
        const linkText = linkElement.textContent || '';
        const url = linkElement.getAttribute('href') || '';
        logClick(
          `Article Link: ${linkText}`,
          url,
          article.id,
          userId,
          article.title
        );
      }
      return;
    }
    // Handle image clicks
    else if (target.tagName === 'IMG' || target.closest('img')) {
      const imgElement = target.tagName === 'IMG' ? target : target.closest('img');
      if (imgElement) {
        const imgSrc = imgElement.getAttribute('src') || '';
        const imgAlt = imgElement.getAttribute('alt') || 'Image';
        const caption = imgElement.closest('figure')?.querySelector('figcaption')?.textContent || '';
        logClick(
          `Article Image: ${imgAlt}`,
          `Image source: ${imgSrc}${caption ? ` | Caption: ${caption}` : ''}`,
          article.id,
          userId,
          article.title
        );
      }
    }
  };

  // Handle title clicks
  const handleTitleClick = () => {
    logClick(
      'Article Title',
      `Clicked on article title: ${article.title}`,
      article.id,
      userId,
      article.title
    );
  };

  // Helper to convert [img src="..." caption="..."] to <figure><img ... /><figcaption style="...">...</figcaption></figure>
  function processImagesWithCaptions(content: string) {
    return content.replace(
      /\[img\s+src="([^"]+)"\s+caption="((?:[^\[]|\[(?!img\s+src=))*?)"\s*\]/g,
      (_match, src, caption) =>
        `<figure style="text-align:start;"><img src="${src}" alt="${caption}" style="max-width:100%;margin:auto;" /><figcaption style=\"display:block;margin-top:0.5em;font-size:0.75rem;color:#666;text-align:center;font-style:italic;line-height:1.4;\">${caption}</figcaption></figure>`
    );
  }

  const processedContent = processImagesWithCaptions(
    article.content.replace(/\n/g, '<br />')
  );

  return (
    <main id="content" className="container" role="main" data-article-id={article.id}>
      <article className={styles.article}>
        <ArticleHeader article={article} onTitleClick={handleTitleClick} />

        {shouldShowAuthorBio && (
          <AuthorBio
            author={{
              name: article.author.name,
              bio: {
                personal: article.author.bio?.personal || "",
                basic: article.author.bio?.basic || "",
              },
              image: article.author.photo
                ? { src: article.author.photo, alt: article.author.name }
                : undefined,
            }}
            bioType={author_bio as "personal" | "basic"}
          />
        )}
        
        <div 
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(processedContent) }}
            onClick={handleArticleContentClick}
          />

        {shouldShowExplainBox && (
          <BehindTheStory 
            explainBox={article.explain_box}
            article={{
              who_spoke_to: article.metadata?.who_spoke_to,
              where_written: article.metadata?.where_written,
              editor: article.metadata?.editor,
              corrections: article.metadata?.corrections,
              version_history: article.metadata?.version_history,
            }}
          />
        )}

        {(version === '2' || version === '3' || version === '4')&& (
          <>
            <div className={styles.summaryThemesSection}>
              { article.summary && (version === '2' || version === '3') &&
                <ArticleSummary articleSummary={article.summary}/>
              }

              { article.themes && article.themes.length > 0 && (version === '3' || version == '4') && 
                <>
                  <h4 style={{marginTop: '2rem', marginBottom: '1rem', fontWeight: 600}}>Comment Highlights:</h4>
                  <ArticleThemeList articleThemes={article.themes}/>
                </>
              }
            </div>
          </>
        )}

        {/* Like and Share buttons */}
        {article.showLikeShare && (
          <LikeShareButtons
            onLikeClick={() => {
              // Debug: Log Qualtrics data when button is clicked
              if (process.env.NODE_ENV === 'development') {
                console.log('[ArticleContent] Like button clicked - Qualtrics data:', qualtricsData);
              }
              logClick(
                'Like Article',
                'User clicked like button',
                article.id,
                userId,
                article.title
              );
            }}
            onShareClick={() => {
              // Debug: Log Qualtrics data when button is clicked
              if (process.env.NODE_ENV === 'development') {
                console.log('[ArticleContent] Share button clicked - Qualtrics data:', qualtricsData);
              }
              logClick(
                'Share Article',
                'User clicked share button',
                article.id,
                userId,
                article.title
              );
              // Note: Share button is for logging only, not actual sharing
            }}
          />
        )}

        {/* Comments section: transforms comment list data structure and renders Comments component when enabled */}
        {article.comments_display && (
          <Comments
            comments={comments.length > 0 ? comments.map((comment) => ({
              id: comment.id,
              name: comment.name,
              content: comment.content,
              datePosted: comment.datePosted,
              createdAt: comment.timestamp,
              upvotes: comment.upvotes,
              downvotes: comment.downvotes,
              replies: (comment.replies || []).map((reply) => ({
                parentId: comment.id,
                id: reply.id,
                name: reply.name,
                content: reply.content,
                upvotes: reply.upvotes,
                downvotes: reply.downvotes,
                createdAt: reply.timestamp,
                replies: (reply.replies || []).map((subReply) => ({
                  parentId: reply.id,
                  id: subReply.id,
                  name: subReply.name,
                  content: subReply.content,
                  upvotes: subReply.upvotes,
                  downvotes: subReply.downvotes,
                  createdAt: subReply.timestamp,
                })),
              })),
            })) : []}
            anonymous={article.anonymous}
            identifier={article.id}
            articleTitle={article.title}
            onCommentSubmit={(name, content) => {
              logComment(
                article.title,
                name,
                content,
                article.id,
                userId,
                article.title
              );
            }}
            userId={userId}
            qualtricsData={qualtricsData}
            studyId={articleStudyId}
            isAuthenticated={isAuthenticated}
          />
        )}
      </article>
    </main>
  );
}
