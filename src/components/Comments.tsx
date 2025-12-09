/**
 * Comments component that orchestrates the display and submission of article comments.
 * 
 * This component:
 * - Manages the comments section layout
 * - Coordinates between comment form and list
 * - Handles comment data fetching
 * 
 * @component
 * @param {Object} props - Component props
 * @param {Comment[]} props.comments - Array of existing comments
 * @param {boolean} props.anonymous - Whether the article is anonymous
 * @param {string} props.identifier - Unique identifier for the article
 * @returns {JSX.Element} The comments section
 */
import Cookies from "js-cookie";
import React, { useState } from "react";
import { type Comment } from "@/lib/firestore";
import { CommentForm } from "@/components/CommentForm";
import { CommentList } from "@/components/CommentList";
import { type QualtricsData } from '@/hooks/useQualtrics';
import styles from "@/components/Comments.module.css";

/**
 * Props interface for the Comments component.
 * 
 * @interface CommentsProps
 * @property {Comment[]} comments - Array of existing comments
 * @property {boolean} anonymous - Whether the article is anonymous
 * @property {string} identifier - Unique identifier for the article
 * @property {string} articleTitle - Title for the article
 * @property {string} userId - Unique identifier for the user
 * @property {(name: string, content: string) => void} [onCommentSubmit] - Callback for comment submission
 */
interface CommentsProps {
  comments: Comment[];
  anonymous: boolean;
  identifier: string;
  articleTitle: string;
  userId: string;
  qualtricsData?: QualtricsData;
  studyId?: string; // Article's studyId
  isAuthenticated?: boolean;
  onCommentSubmit?: (name: string, content: string) => void;
}

/**
 * Comments component that manages the display and submission of article comments.
 * 
 * This component:
 * - Renders existing comments with user information
 * - Provides a form for new comment submission
 * - Handles different form fields based on anonymous status
 * - Manages form state and submission
 * - Uses CSS modules for styling
 * 
 * IMPORTANT: Comments display behavior:
 * - Page loads show ONLY default comments (from article.default_comments)
 * - User interactions (comments, replies, votes) are shown only in the current session
 * - All user interactions are saved to Firebase for research data collection
 * - On page refresh, the article resets to its default state
 * - Each survey participant sees the article in its original form
 * 
 * @param {CommentsProps} props - Component props
 * @returns {JSX.Element} The rendered comments section
 */
export const Comments: React.FC<CommentsProps> = ({
  comments = [],
  anonymous,
  identifier,
  articleTitle,
  userId,
  qualtricsData,
  studyId, // Article's studyId
  isAuthenticated = false,
  onCommentSubmit,
}) => {
  // Default comments are the baseline - always start fresh with these on page load
  const [defaultComments, setDefaultComments] = useState<Comment[]>(comments);
  
  // Local comments include defaults + user's session interactions (comments, replies)
  // This is what gets displayed and modified during the session
  const [localComments, setLocalComments] = useState<Comment[]>(comments);

  // When comments prop changes (page load/refresh), reset to defaults only
  // This ensures each viewer sees the article in its original state
  React.useEffect(() => {
    // Deep clone to create a fresh copy of default comments
    const clonedDefaults = JSON.parse(JSON.stringify(comments));
    setDefaultComments(clonedDefaults);
    setLocalComments(clonedDefaults);
  }, [comments]);

  const handleCommentSubmitted = async (newComment: Comment) => {
    setLocalComments((prev) => [newComment, ...prev]);
  }
  
  const removeCommentById = (comments: Comment[], commentId: string): Comment[] => {
    return comments
      .filter(comment => comment.id !== commentId)
      .map(comment => ({
        ...comment,
        replies: comment.replies ? removeCommentById(comment.replies, commentId) : []
      }));
  }

  const handleCommentRemoved = async (commentId: string) => {
    setLocalComments(prevComments => removeCommentById(prevComments, commentId));
  }

  const addReplyById = (comments: Comment[], commentId: string, reply: Comment): Comment[] => {
    return comments.map(comment => {
      if (comment.id === commentId) {
        return {
          ...comment,
          replies: [reply, ...(comment.replies || [])]
        };
      }
      return {
        ...comment,
        replies: comment.replies ? addReplyById(comment.replies, commentId, reply) : []
      };
    });
  }

  const handleReply = (commentId: string, reply: Comment) => {
    setLocalComments(prev => addReplyById(prev, commentId, reply));
  }

  // Helper function to count all comments including nested replies
  const countAllComments = (comments: Comment[]): number => {
    return comments.reduce((total, comment) => {
      const replyCount = comment.replies ? countAllComments(comment.replies) : 0;
      return total + 1 + replyCount;
    }, 0);
  };

  return (
    <section className={styles.commentsSection}>
        <CommentForm 
          anonymous={anonymous}
          identifier={identifier}
          onCommentSubmitted={handleCommentSubmitted}
          onCommentSubmit={onCommentSubmit}
          qualtricsResponseId={qualtricsData?.responseId}
        />
      <div className={styles.commentsContainer}>
        {/* Comment count */}
        <div className={styles.commentCount}>
          Comments ({countAllComments(localComments)}):        
        </div>
        <CommentList 
          comments={localComments}
          onCommentRemoved={handleCommentRemoved}
          onReply={handleReply}
          anonymous={anonymous}
          identifier={identifier}
          studyId={studyId}
          articleTitle={articleTitle}
          userId={userId}
          qualtricsData={qualtricsData}
          isAuthenticated={isAuthenticated}
        />
      </div>
    </section>
  );
}; 

export const readCookie = (
  type: string,
  articleId: string,
  commentId: string
) => {
  return Cookies.get(`${type}_${articleId}_${commentId}`);
};

export const createCookie = (
  type: string,
  articleId: string,
  commentId: string
) => {
  return Cookies.set(`${type}_${articleId}_${commentId}`, "true");
};

export const deleteCookie = (
  type: string,
  articleId: string,
  commentId: string
) => {
  Cookies.remove(`${type}_${articleId}_${commentId}`);
};
