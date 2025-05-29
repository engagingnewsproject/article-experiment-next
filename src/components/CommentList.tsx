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
 * @param {Function} props.onCommentRemoved - Function to handle comment removal
 * @param {boolean} props.anonymous - Whether the comments are anonymous
 * @param {string} props.identifier - Article identifier
 * @returns {JSX.Element} The comments list
 */
import { deleteComment, saveComment, type Comment } from "@/lib/firestore";
import React, { useState } from "react";
import styles from "./Comments.module.css";
import { CommentVoteSection } from "./CommentVoteSection";

interface CommentListProps {
  /** Array of comments to display, including their replies and vote counts */
  comments: Comment[];
  /** Whether the article is anonymous, which affects how user information is displayed */
  anonymous: boolean;
  /** Unique identifier for the article, used for database operations and cookie management */
  identifier: string;
    /** Callback function called when a new comment is removed, used to update parent component state */
  onCommentRemoved: (commentId: string) => void;
  /** Callback function called when a reply is submitted to a comment, updates parent component state */
  onReply: (commentId: string, reply: Comment) => void;
}

const CommentItem: React.FC<{
  /** The comment data to display, including content, author, and metadata */
  comment: Comment;
  /** Callback function called when a comment is submitted, used to update parent state */
  /** Callback function called when a comment is removed, used to update parent state */
  onCommentRemoved: (commentId: string) => void;
  /** Optional flag to control whether user information is displayed anonymously */
  anonymous?: boolean;
  /** Unique identifier for the article, used for database operations */
  identifier: string;
  /** Callback function for handling replies to this comment */
  onReply: (commentId: string, reply: Comment) => void;
}> = ({ comment, onCommentRemoved, identifier, onReply }) => {
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    setIsSubmitting(true);
    try {
      // Save to database
      const replyId = await saveComment(identifier, {
        content: replyContent,
        parentId: comment.id,
      });

      // Create local reply for immediate display
      const newReply: Comment = {
        id: replyId,
        parentId: comment.id,
        content: replyContent,
        name: 'Anonymous', // or get from form if available
        createdAt: new Date().toISOString(),
        upvotes: 0,
        downvotes: 0
      };

      onReply(comment.id!, newReply);
      setReplyContent("");
      setIsReplying(false);
    } catch (err) {
      console.error("Failed to submit reply:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!comment.id) return;

    if (window.confirm("Are you sure you want to delete this comment?")) {
      setIsDeleting(true);
      try {
        await deleteComment(identifier, comment.id);
        // Update parent component state after successful deletion
        onCommentRemoved(comment.id);
      } catch (err) {
        // Log error and allow UI to recover from failed deletion
        console.error("Failed to delete comment:", err);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleDeleteReply = async (replyId: string) => {
    if (!comment.id || !replyId) return;

    if (window.confirm("Are you sure you want to delete this reply?")) {
      try {
        await deleteComment(identifier, replyId, comment.id);
        onCommentRemoved(replyId);
      } catch (err) {
        console.error("Failed to delete reply:", err);
      }
    }
  };

  return (
    <div className={styles.comment}>
      <div className={styles.commentHeader}>
        <span className={styles.commentAuthor}>{comment.name}</span>
        <span className={styles.commentDate}>
          {comment.createdAt
            ? new Date(comment.createdAt).toLocaleString()
            : "Unknown date"}
        </span>
        {process.env.NODE_ENV === "development" && (
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className={styles.deleteButton}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        )}
      </div>
      <p className={styles.commentContent}>{comment.content}</p>
      <div className={styles.commentFooter}>
        <button
          className={styles.replyButton}
          onClick={() => setIsReplying(!isReplying)}
        >
          {isReplying ? "Cancel Reply" : "Reply"}
        </button>
        <CommentVoteSection 
          commentId={comment.id!}
          identifier={identifier}
          comment={comment}
        />
      </div>

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
            {isSubmitting ? "Submitting..." : "Submit Reply"}
          </button>
        </form>
      )}

      {comment.replies && comment.replies.length > 0 && (
        <div className={styles.replies}>
          {comment.replies.map((reply, replyIndex) => (
            <div key={reply.id || replyIndex} className={styles.reply}>
              <div className={styles.commentHeader}>
                <span className={styles.commentAuthor}>{reply.name}</span>
                <span className={styles.commentDate}>
                  {reply.createdAt
                    ? new Date(reply.createdAt).toLocaleString()
                    : "Unknown date"}
                </span>
                {process.env.NODE_ENV === "development" && reply.id && (
                  <button
                    onClick={() => handleDeleteReply(reply.id!)}
                    className={styles.deleteButton}
                  >
                    Delete
                  </button>
                )}
              </div>
              <p className={styles.commentContent}>{reply.content}</p>
              <div className={styles.commentFooter}>
                <button
                  className={styles.replyButton}
                  onClick={() => setIsReplying(!isReplying)}
                >
                  {isReplying ? "Cancel Reply" : "Reply"}
                </button>
                <CommentVoteSection 
                  commentId={reply.id!}
                  parentId={reply.parentId!}
                  identifier={identifier}
                  comment={reply}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const CommentList: React.FC<CommentListProps> = ({
  comments,
  anonymous,
  identifier,
  onCommentRemoved,
  onReply
}) => {
  const COMMENTS_REVEAL_COUNT = 20;
  const [maxRevealLength, setMaxRevealLength] = useState(COMMENTS_REVEAL_COUNT);

  if (comments.length === 0) {
    return null;
  }

  const allCommentsVisible = comments.length <= maxRevealLength;
  const shownComments = allCommentsVisible
    ? comments
    : comments.slice(0, maxRevealLength);

  return (
    <div className={styles.commentList}>
      {shownComments.map((comment, commentIndex) => (
        <CommentItem
          key={comment.id || commentIndex}
          comment={comment}
          onCommentRemoved={onCommentRemoved}
          anonymous={anonymous}
          identifier={identifier}
          onReply={onReply}
        />
      ))}
      {allCommentsVisible ? null : (
        <button
          className={styles.readMore}
          onClick={() =>
            setMaxRevealLength(maxRevealLength + COMMENTS_REVEAL_COUNT)
          }
        >
          Read more...
        </button>
      )}
    </div>
  );
};
