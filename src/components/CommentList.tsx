/**
 * CommentList component that displays a list of comments.
 * 
 * This component:
 * - Displays existing comments with user information and timestamps
 * - Includes reaction buttons (thumbs up/down)
 * - Shows a message when there are no comments
 * 
 * @component
 * @param {Object} props - Component props
 * @param {Comment[]} props.comments - Array of comments to display
 * @param {Function} props.onCommentSubmitted - Function to handle comment submission
 * @param {boolean} props.anonymous - Whether the comments are anonymous
 * @param {string} props.identifier - Article identifier
 * @returns {JSX.Element} The comments list
 */
import React, { useState } from 'react';
import { type Comment } from '@/lib/firestore';
import styles from './Comments.module.css';
import { saveComment, deleteComment } from '@/lib/firestore';

interface CommentListProps {
  comments: Comment[];
  onCommentSubmitted: () => void;
  anonymous?: boolean;
  identifier: string;
}

const CommentItem: React.FC<{ 
  comment: Comment; 
  onCommentSubmitted: () => void;
  anonymous?: boolean;
  identifier: string;
}> = ({ comment, onCommentSubmitted, anonymous, identifier }) => {
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    setIsSubmitting(true);
    try {
      await saveComment(identifier, {
        content: replyContent,
        parentId: comment.id
      });
      setReplyContent('');
      setIsReplying(false);
      onCommentSubmitted();
    } catch (err) {
      console.error('Failed to submit reply:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!comment.id) return;
    
    if (window.confirm('Are you sure you want to delete this comment?')) {
      setIsDeleting(true);
      try {
        await deleteComment(identifier, comment.id);
        await onCommentSubmitted();
      } catch (err) {
        console.error('Failed to delete comment:', err);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleDeleteReply = async (replyId: string) => {
    if (!comment.id || !replyId) return;
    
    if (window.confirm('Are you sure you want to delete this reply?')) {
      try {
        await deleteComment(identifier, replyId, comment.id);
        await onCommentSubmitted();
      } catch (err) {
        console.error('Failed to delete reply:', err);
      }
    }
  };

  return (
    <div className={styles.comment}>
      <div className={styles.commentHeader}>
        <span className={styles.commentAuthor}>{comment.name}</span>
        <span className={styles.commentDate}>
          {comment.createdAt ? new Date(comment.createdAt).toLocaleString() : 'Unknown date'}
        </span>
        {process.env.NODE_ENV === 'development' && (
          <button 
            onClick={handleDelete}
            disabled={isDeleting}
            className={styles.deleteButton}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        )}
      </div>
      <p className={styles.commentContent}>{comment.content}</p>
      <button 
        className={styles.replyButton}
        onClick={() => setIsReplying(!isReplying)}
      >
        {isReplying ? 'Cancel Reply' : 'Reply'}
      </button>
      
      {isReplying && (
        <form onSubmit={handleReply} className={styles.inlineReplyForm}>
          <textarea
            placeholder="Write your reply..."
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            className={styles.inlineTextarea}
            required
          />
          <button 
            type="submit" 
            className={styles.inlineSubmitButton}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Reply'}
          </button>
        </form>
      )}

      {comment.replies && comment.replies.length > 0 && (
        <div className={styles.replies}>
          {comment.replies.map((reply) => (
            <div key={reply.id} className={styles.reply}>
              <div className={styles.commentHeader}>
                <span className={styles.commentAuthor}>{reply.name}</span>
                <span className={styles.commentDate}>
                  {reply.createdAt ? new Date(reply.createdAt).toLocaleString() : 'Unknown date'}
                </span>
                {process.env.NODE_ENV === 'development' && reply.id && (
                  <button 
                    onClick={() => handleDeleteReply(reply.id!)}
                    className={styles.deleteButton}
                  >
                    Delete
                  </button>
                )}
              </div>
              <p className={styles.commentContent}>{reply.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const CommentList: React.FC<CommentListProps> = ({ 
  comments, 
  onCommentSubmitted,
  anonymous,
  identifier
}) => {
  if (comments.length === 0) {
    return null;
  }

  return (
    <div className={styles.commentList}>
      {comments.map((comment) => (
        <CommentItem 
          key={comment.id} 
          comment={comment} 
          onCommentSubmitted={onCommentSubmitted}
          anonymous={anonymous}
          identifier={identifier}
        />
      ))}
    </div>
  );
}; 