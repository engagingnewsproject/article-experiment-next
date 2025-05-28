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
import React, { useState } from 'react';
import styles from './Comments.module.css';
import { CommentForm } from './CommentForm';
import { CommentList } from './CommentList';
import { type Comment } from '@/lib/firestore';

/**
 * Props interface for the Comments component.
 * 
 * @interface CommentsProps
 * @property {Comment[]} comments - Array of existing comments
 * @property {boolean} anonymous - Whether the article is anonymous
 * @property {string} identifier - Unique identifier for the article
 */
interface CommentsProps {
  comments: Comment[];
  anonymous: boolean;
  identifier: string;
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
export const Comments: React.FC<CommentsProps> = ({ comments = [], anonymous, identifier }) => {
  // Keep default comments in state
  const [defaultComments, setDefaultComments] = useState<Comment[]>(comments);
  // Track temporary user interactions
  const [localComments, setLocalComments] = useState<Comment[]>(comments);

  const handleCommentSubmitted = async (newComment: Comment) => {
    // Add the new comment to local state only
    setLocalComments(prev => [...prev, newComment]);
  };
  
  const handleCommentRemoved = async (commentId: string) => {
    setLocalComments(prevComments => {
      return prevComments
      .filter(comment => comment.id !== commentId)
      .map(comment => ({
        ...comment,
        replies: comment.replies
        ? comment.replies.filter(reply => reply.id !== commentId)
        : []
      }));
    });
  }

  const handleReply = (commentId: string, reply: Comment) => {
    // Add reply to local state only
    setLocalComments(prev => prev.map(comment => {
      if (comment.id === commentId) {
        return {
          ...comment,
          replies: [...(comment.replies || []), reply]
        };
      }
      return comment;
    }));
  };

  // Reset to default comments when component mounts
  React.useEffect(() => {
    setLocalComments(defaultComments);
  }, [defaultComments]);

  return (
    <section className={styles.commentsSection}>
      <div className={styles.commentsContainer}>
        <CommentList 
          comments={localComments} 
          onCommentRemoved={handleCommentRemoved}
          onReply={handleReply}
          anonymous={anonymous}
          identifier={identifier}
        />
        <CommentForm 
          anonymous={anonymous}
          identifier={identifier}
          onCommentSubmitted={handleCommentSubmitted}
        />
      </div>
    </section>
  );
}; 