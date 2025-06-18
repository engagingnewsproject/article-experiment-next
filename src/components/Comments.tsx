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
import React, { useState } from "react";
import styles from "./Comments.module.css";
import { CommentForm } from "./CommentForm";
import { CommentList } from "./CommentList";
import { type Comment } from "@/lib/firestore";
import Cookies from "js-cookie";

/**
 * Props interface for the Comments component.
 * 
 * @interface CommentsProps
 * @property {Comment[]} comments - Array of existing comments
 * @property {boolean} anonymous - Whether the article is anonymous
 * @property {string} identifier - Unique identifier for the article
 * @property {(name: string, content: string) => void} [onCommentSubmit] - Callback for comment submission
 */
interface CommentsProps {
  comments: Comment[];
  anonymous: boolean;
  identifier: string;
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
 * @param {CommentsProps} props - Component props
 * @returns {JSX.Element} The rendered comments section
 */
export const Comments: React.FC<CommentsProps> = ({
  comments = [],
  anonymous,
  identifier,
  onCommentSubmit,
}) => {
  // Keep default comments in state
  const [defaultComments, setDefaultComments] = useState<Comment[]>(comments);
  // Track temporary user interactions
  const [localComments, setLocalComments] = useState<Comment[]>(comments);

  const handleCommentSubmitted = async (newComment: Comment) => {
    // Add the new comment to local state only
    setLocalComments((prev) => [...prev, newComment]);
  }
  
  // Recursively remove a comment or reply by id
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

  // Recursively add a reply to the correct comment or reply
  const addReplyById = (comments: Comment[], commentId: string, reply: Comment): Comment[] => {
    return comments.map(comment => {
      if (comment.id === commentId) {
        return {
          ...comment,
          replies: [...(comment.replies || []), reply]
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

  // Reset to default comments when component mounts
  React.useEffect(() => {
    setLocalComments(defaultComments);
  }, [defaultComments]);

  return (
    <section className={styles.commentsSection}>
        <CommentForm 
          anonymous={anonymous}
          identifier={identifier}
          onCommentSubmitted={handleCommentSubmitted}
          onCommentSubmit={onCommentSubmit}
        />
      <div className={styles.commentsContainer}>
        <CommentList 
          comments={localComments} 
          onCommentRemoved={handleCommentRemoved}
          onReply={handleReply}
          anonymous={anonymous}
          identifier={identifier}
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
