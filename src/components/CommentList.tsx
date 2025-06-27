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
import { CommentReplyForm } from "@/components/CommentReplyForm";
import { createCookie, deleteCookie } from "@/components/Comments";
import { CommentVoteSection } from "@/components/CommentVoteSection";
import { useLogger } from '@/hooks/useLogger';
import { deleteComment, saveComment, type Comment } from "@/lib/firestore";
import DOMPurify from "dompurify";
import React, { useState } from "react";
import styles from "./Comments.module.css";

interface CommentListProps {
  /** Array of comments to display, including their replies and vote counts */
  comments: Comment[];
  /** Whether the article is anonymous, which affects how user information is displayed */
  anonymous: boolean;
  /** Unique identifier for the article, used for database operations and cookie management */
  identifier: string;
    /** Title for the article, used for tracking */
  articleTitle: string;
  /** Unique identifier for the user */
  userId: string;
    /** Callback function called when a new comment is removed, used to update parent component state */
  onCommentRemoved: (commentId: string) => void;
  /** Callback function called when a reply is submitted to a comment, updates parent component state */
  onReply: (commentId: string, reply: Comment) => void;
}

const INIT_REPLIES_REVEAL_COUNT = 20;
const REPLIES_REVEAL_COUNT = 5;

const CommentNode: React.FC<{
  /** The comment data to display, including content, author, and metadata */
  comment: Comment;
  /** Callback function called when a comment is submitted, used to update parent state */
  /** Callback function called when a comment is removed, used to update parent state */
  onCommentRemoved: (commentId: string) => void;
  /** Optional flag to control whether user information is displayed anonymously */
  anonymous?: boolean;
  /** Unique identifier for the article, used for database operations */
  identifier: string;
  /** Title for the article, used for tracking */
  articleTitle: string;
  /** Unique identifier for the user */
  userId: string;
  /** Callback function for handling replies to this comment */
  onReply: (commentId: string, reply: Comment) => void;
  /** Maximum number of replies to show at once */
  maxReplies: number;
  /** Function to set the maximum number of replies to show */
  setMaxReplies: React.Dispatch<React.SetStateAction<number>>;
  /** Object mapping comment IDs to the maximum number of sub-replies to show */
  maxSubReplies: { [replyId: string]: number };
  /** Function to set the maximum number of sub-replies to show for a specific comment */
  setMaxSubReplies: React.Dispatch<React.SetStateAction<{ [replyId: string]: number }>>;
  /** Current depth in the comment tree, used to limit reply functionality for deeper levels */
  depth?: number;
}> = ({ comment, onCommentRemoved, identifier, articleTitle, userId, onReply, maxReplies, setMaxReplies, maxSubReplies, setMaxSubReplies, depth = 0 }) => {
  const [replying, setReplying] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { logComment } = useLogger();

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    setIsSubmitting(true);
    try {
      const replyId = await saveComment(identifier, {
        content: replyContent,
        parentId: comment.id,
        grandParentId: depth > 1 ? comment.parentId : undefined,
      });

      const newReply: Comment = {
        id: replyId,
        parentId: comment.id,
        content: replyContent,
        name: 'Anonymous',
        createdAt: new Date().toISOString(),
        upvotes: 0,
        downvotes: 0,
      };

      onReply(comment.id!, newReply);
      setReplyContent("");
      setReplying(false);

      // Log the reply event
      logComment(
        articleTitle || identifier,
        newReply.name,
        newReply.content,
        identifier,
        localStorage.getItem("userId") || "Anonymous",
        true
      );
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
        onCommentRemoved(comment.id);
        // Optionally clean cookies here if needed
      } catch (err) {
        console.error("Failed to delete comment:", err);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <div className={styles.comment}>
      <div className={styles.commentHeader}>
        <div className={styles.commentHeader__info}>
          <span className={styles.commentAuthor}>{comment.name}</span>
          <span className={styles.commentDate}>
            {comment.createdAt
              ? new Date(comment.createdAt).toLocaleString()
              : "Unknown date"}
          </span>
        </div>
        {process.env.NODE_ENV === "development" && comment.id && (
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className={styles.deleteButton}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        )}
      </div>
      <p
        className={styles.commentContent}
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(comment.content) }}
      />
      <div className={styles.commentFooter}>
        {(depth < 3) && (
          <button
            className={styles.replyButton}
            onClick={() => setReplying((v) => !v)}
          >
            {replying ? "Cancel Reply" : "Reply"}
          </button>
        )}
        <CommentVoteSection
          commentId={comment.id!}
          parentId={comment.parentId!}
          identifier={identifier}
          comment={comment}
          userId={userId}
        />
      </div>
      {replying && (
        <CommentReplyForm
          handleReply={handleReply}
          setReplyContent={setReplyContent}
          replyContent={replyContent}
          isSubmitting={isSubmitting}
        />
      )}
      {comment.replies && comment.replies.length > 0 && (
        <div className={styles.replies}>
          {comment.replies.slice(0, maxReplies).map((reply) => (
            <CommentNode
              key={reply.id}
              comment={reply}
              identifier={identifier}
              articleTitle={articleTitle}
              userId={userId}
              onCommentRemoved={onCommentRemoved}
              onReply={onReply}
              maxReplies={maxReplies}
              setMaxReplies={setMaxReplies}
              maxSubReplies={maxSubReplies}
              setMaxSubReplies={setMaxSubReplies}
              depth={depth + 1}
            />
          ))}
          {comment.replies.length > maxReplies && (
            <button
              className={styles.readMore}
              onClick={() => setMaxReplies(maxReplies + REPLIES_REVEAL_COUNT)}
            >
              Read more replies...
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export const CommentList: React.FC<CommentListProps> = ({
  comments,
  anonymous,
  identifier,
  articleTitle,
  userId,
  onCommentRemoved,
  onReply,
}) => {
  const COMMENTS_REVEAL_COUNT = 20;
  const [maxRevealLength, setMaxRevealLength] = useState(COMMENTS_REVEAL_COUNT);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [maxReplies, setMaxReplies] = useState(REPLIES_REVEAL_COUNT);
  const [maxSubReplies, setMaxSubReplies] = useState<{ [replyId: string]: number }>({});

  if (comments.length === 0) {
    return null;
  }

  const allCommentsVisible = comments.length <= maxRevealLength;
  const shownComments = allCommentsVisible
    ? comments
    : comments.slice(0, maxRevealLength);

  return (
    <div className={styles.commentList}>
      {shownComments.map((comment) => (
        <CommentNode
          key={comment.id}
          comment={comment}
          identifier={identifier}
          articleTitle={articleTitle}
          userId={userId}
          onCommentRemoved={onCommentRemoved}
          onReply={onReply}
          maxReplies={maxReplies}
          setMaxReplies={setMaxReplies}
          maxSubReplies={maxSubReplies}
          setMaxSubReplies={setMaxSubReplies}
        />
      ))}
      {allCommentsVisible ? null : (
        <button
          className={styles.readMore}
          onClick={() =>
            setMaxRevealLength(maxRevealLength + COMMENTS_REVEAL_COUNT)
          }
        >
          Read more comments...
        </button>
      )}
    </div>
  );
};