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
import TrustProjectCallout from "@/components/TrustProjectCallout";
import { type ArticleTheme } from "@/lib/firestore";
import { Article } from "@/types/article";
import { useSearchParams } from "next/navigation";
import styles from "./ArticleContent.module.css";
import { ArticleSummary } from "./ArticleSummary";
import { ArticleThemeList } from "./ArticleThemes";
import { useLogger } from '@/hooks/useLogger';
import { useEffect, useState } from 'react';

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
    summary: string
  };
  showExplainBox: boolean;
  explainBoxValue: string;
  version: string;
  comments: {
    id: string;
    name: string;
    content: string;
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
      timestamp: string;
      replies: {
        parentId: string;
        id: string;
        name: string;
        content: string;
        upvotes: number;
        downvotes: number;
        timestamp: string;
      }[];
    }[];
  }[];
  userId: string;
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
}: ArticleContentProps) {
  const searchParams = useSearchParams();
  const author_bio = searchParams?.get("author_bio") || "basic";
  const shouldShowExplainBox = showExplainBox && explainBoxValue !== "none";
  const { logPageView, logPageViewTime, logClick, logComment } = useLogger();
  const [timeWhenPageOpened, setTimeWhenPageOpened] = useState<number>(Date.now());

  // Log page view when component mounts
  useEffect(() => {
    setTimeWhenPageOpened(Date.now());
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const totalTimeSpentOnPage = Date.now() - timeWhenPageOpened;
      logPageViewTime(
        article.title,
        article.id,
        totalTimeSpentOnPage,
        userId,
      );
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    logPageView(
      article.title,
      article.id, // using article.id as identifier
      userId // or you could pass userId as a prop if you have user authentication
    );

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [article.title, article.id, logPageView]);

  // Handle link clicks within article content
  const handleArticleLinkClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'A') {
      const linkText = target.textContent || '';
      const url = target.getAttribute('href') || '';
      logClick(
        `Article Link: ${linkText}`,
        url,
        article.id,
        userId
      );
    }
  };

  return (
    <main id="content" className="container" role="main">
      <article className={styles.article}>
        <ArticleHeader article={article} />

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

        {shouldShowExplainBox ? (
          <div className={styles.articleWrapped}>
            <div
              className={styles.articleText}
              dangerouslySetInnerHTML={{ __html: article.content }}
              onClick={handleArticleLinkClick}
            />
            <div className={styles.articleExplanation}>
              <BehindTheStory
                explainBox={article.explain_box}
                article={article.metadata || {}}
              />
            </div>
          </div>
        ) : (
          <div 
            dangerouslySetInnerHTML={{ __html: article.content }}
            onClick={handleArticleLinkClick}
          />
        )}

        <TrustProjectCallout />
        { article.summary && (version === '2' || version === '3') &&
          <ArticleSummary articleSummary={article.summary}/>
        }

        { article.themes && (version === '3' || version == '4') && 
          <ArticleThemeList articleThemes={article.themes}/>
        }

        {article.comments_display && (
          <Comments
            comments={comments.map((comment) => ({
              id: comment.id,
              name: comment.name,
              content: comment.content,
              createdAt: comment.timestamp,
              upvotes: comment.upvotes,
              downvotes: comment.downvotes,
              replies: comment.replies.map((reply) => ({
                parentId: comment.id,
                id: reply.id,
                name: reply.name,
                content: reply.content,
                upvotes: reply.upvotes,
                downvotes: reply.downvotes,
                createdAt: reply.timestamp,
                replies: reply.replies.map((subReply) => ({
                  parentId: reply.id,
                  id: subReply.id,
                  name: subReply.name,
                  content: subReply.content,
                  upvotes: subReply.upvotes,
                  downvotes: subReply.downvotes,
                  createdAt: subReply.timestamp,
                })),
              })),
            }))}
            anonymous={article.anonymous}
            identifier={article.id}
            onCommentSubmit={(name, content) => {
              logComment(
                name,
                content,
                article.id,
                userId
              );
            }}
            userId={userId}
          />
        )}
      </article>
    </main>
  );
}
