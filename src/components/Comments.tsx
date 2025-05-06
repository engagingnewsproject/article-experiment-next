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
import { getComments } from '@/lib/firestore';
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
  const [localComments, setLocalComments] = useState<Comment[]>(comments);

  const handleCommentSubmitted = async () => {
    try {
      // Fetch updated comments after submission
      const updatedComments = await getComments(identifier);
      setLocalComments(updatedComments);
    } catch (err) {
      console.error('Failed to fetch updated comments:', err);
    }
  };

  // Update local comments when props change
  React.useEffect(() => {
    setLocalComments(comments);
  }, [comments]);

  return (
    <section className={styles.commentsSection}>
      <div className={styles.commentsContainer}>
        <CommentList 
          comments={localComments} 
          onCommentSubmitted={handleCommentSubmitted}
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