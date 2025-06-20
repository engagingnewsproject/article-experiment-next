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
import { createCookie, deleteCookie } from "./Comments";
import DOMPurify from "dompurify";
import { useLogger } from '@/hooks/useLogger';

interface CommentListProps {
  /** Array of comments to display, including their replies and vote counts */
  comments: Comment[];
  /** Whether the article is anonymous, which affects how user information is displayed */
  anonymous: boolean;
  /** Unique identifier for the article, used for database operations and cookie management */
  identifier: string;
  /** Unique identifier for the user */
  userId: string;
    /** Callback function called when a new comment is removed, used to update parent component state */
  onCommentRemoved: (commentId: string) => void;
  /** Callback function called when a reply is submitted to a comment, updates parent component state */
  onReply: (commentId: string, reply: Comment) => void;
}

const REPLIES_REVEAL_COUNT = 5;

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
  /** Unique identifier for the user */
  userId: string;
  /** Callback function for handling replies to this comment */
  onReply: (commentId: string, reply: Comment) => void;
}> = ({ comment, onCommentRemoved, identifier, userId, onReply }) => {
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { logComment } = useLogger();

  const [maxReplies, setMaxReplies] = useState(REPLIES_REVEAL_COUNT);
  const [maxSubReplies, setMaxSubReplies] = useState<{ [replyId: string]: number }>({});

  const handleReply = async (e: React.FormEvent, parentId?: string, grandParentId?: string) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    setIsSubmitting(true);
    try {
      const replyId = await saveComment(identifier, {
        content: replyContent,
        parentId: parentId,
        grandParentId: grandParentId
      });

      const newReply: Comment = {
        id: replyId,
        parentId: parentId,
        content: replyContent,
        name: 'Anonymous',
        createdAt: new Date().toISOString(),
        upvotes: 0,
        downvotes: 0
      };

      onReply(parentId!, newReply);
      createCookie(grandParentId ? "subReply" : "reply", identifier, replyId);

      // Log the reply event with Firestore reference
      logComment(
        newReply.name,
        `Reply content: "${newReply.content}" | parentCommentId: ${parentId} | replyId: ${replyId}`,
        identifier,
        localStorage.getItem("userId") || "Anonymous"
      );

      setReplyContent("");
      setReplyingToId(null);
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
        cleanCookieData("comment", identifier, comment.id);
      } catch (err) {
        console.error("Failed to delete comment:", err);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const cleanCookieData = (type: string, articleId: string, commentId: string) => {
    deleteCookie(type, identifier, commentId);
    deleteCookie("upvotes", articleId, commentId);
    deleteCookie("downvotes", articleId, commentId);

    comment.replies?.map(reply => {
      deleteCookie("reply", articleId, reply.id!);
      deleteCookie("upvotes", articleId, reply.id!);
      deleteCookie("downvotes", articleId, reply.id!);
      
      reply.replies?.map(subReply => {
        deleteCookie("subReply", articleId, subReply.id!);
        deleteCookie("upvotes", articleId, subReply.id!);
        deleteCookie("downvotes", articleId, subReply.id!);
      })
    });
  }

  const handleDeleteReply = async (replyId: string, parentId: string, grandParentId?: string) => {
    if (!comment.id || !replyId) return;

    if (window.confirm("Are you sure you want to delete this reply?")) {
      try {
        await deleteComment(identifier, replyId, parentId, grandParentId);
        onCommentRemoved(replyId);
        cleanCookieData("reply", identifier, replyId);
      } catch (err) {
        console.error("Failed to delete reply:", err);
      }
    }
  };

  // console.log('Rendering CommentVoteSection:', {
  //   commentId: comment.id,
  //   comment,
  // });

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
      <p 
      className={styles.commentContent}
      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(comment.content) }}
      />
      <div className={styles.commentFooter}>
        <button
          className={styles.replyButton}
          onClick={() => setReplyingToId(replyingToId === comment.id ? null : comment.id!)}
        >
          {replyingToId === comment.id ? "Cancel Reply" : "Reply"}
        </button>
        <CommentVoteSection 
          commentId={comment.id!}
          identifier={identifier}
          comment={comment}
          userId={userId}
        />
      </div>

      {replyingToId === comment.id && (
        <CommentReplyForm 
          handleReply={(e) => handleReply(e, comment.id)}
          setReplyContent={setReplyContent}
          replyContent={replyContent}
          isSubmitting={isSubmitting}
        />
      )}

      {comment.replies && comment.replies.length > 0 && (
        <div className={styles.replies}>
          {comment.replies
            .slice(0, maxReplies)
            .map((reply, replyIndex) => (
            <div key={reply.id || replyIndex} className={styles.reply}>
              <div className={styles.commentHeader}>
                <div className={styles.commentHeader__info}>
                  <span className={styles.commentAuthor}>{reply.name}</span>
                  <span className={styles.commentDate}>
                    {reply.createdAt
                      ? new Date(reply.createdAt).toLocaleString()
                      : "Unknown date"}
                  </span>
                </div>
                {process.env.NODE_ENV === "development" && reply.id && (
                  <button
                    onClick={() => handleDeleteReply(reply.id!, comment.id!)}
                    className={styles.deleteButton}
                  >
                    Delete
                  </button>
                )}
              </div>
              <p 
                className={styles.commentContent}
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(reply.content) }}
              />
              <div className={styles.commentFooter}>
                { reply.parentId === comment.id && (
                  <button
                    className={styles.replyButton}
                    onClick={() => setReplyingToId(replyingToId === reply.id ? null : reply.id!) }
                  >
                    {replyingToId === reply.id ? "Cancel Reply" : "Reply"}
                  </button>
                )}
                <CommentVoteSection 
                  commentId={reply.id!}
                  parentId={reply.parentId!}
                  identifier={identifier}
                  comment={reply}
                  userId={userId}
                />
              </div>
              
              {replyingToId === reply.id && (
                <CommentReplyForm
                  handleReply={(e) => handleReply(e, reply.id, reply.parentId)} 
                  setReplyContent={setReplyContent}
                  replyContent={replyContent}
                  isSubmitting={isSubmitting}
                />
              )}

              {reply.replies && reply.replies.length > 0 && (
                <div className={styles.replies}>
                  {reply.replies
                    .slice(
                      0,
                      maxSubReplies[reply.id!] !== undefined
                        ? maxSubReplies[reply.id!]
                        : REPLIES_REVEAL_COUNT
                    )
                    .map((subReply, subReplyIndex) => (
                    <div key={subReply.id || subReplyIndex} className={styles.reply}>
                      <div className={styles.commentHeader}>
                        <div className={styles.commentHeader__info}>
                          <span className={styles.commentAuthor}>{subReply.name}</span>
                          <span className={styles.commentDate}>
                            {subReply.createdAt
                              ? new Date(subReply.createdAt).toLocaleString()
                              : "Unknown date"
                            }
                          </span>
                        </div>
                        {process.env.NODE_ENV === "development" && reply.id && (
                          <button
                            onClick={() => handleDeleteReply(subReply.id!, reply.id!, comment.id!)}
                            className={styles.deleteButton}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                      <p 
                        className={styles.commentContent}
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(subReply.content) }}
                      />
                      <div className={styles.commentFooter}>
                        <CommentVoteSection 
                          commentId={subReply.id!}
                          parentId={reply.id!}
                          grandParentId={comment.id}
                          identifier={identifier}
                          comment={subReply}
                          userId={userId}
                        />
                      </div>
                    </div>
                  ))}
                  {reply.replies.length >
                    (maxSubReplies[reply.id!] !== undefined
                      ? maxSubReplies[reply.id!]
                      : REPLIES_REVEAL_COUNT) && (
                    <button
                      className={styles.readMore}
                      onClick={() =>
                        setMaxSubReplies((prev) => ({
                          ...prev,
                          [reply.id!]:
                            (prev[reply.id!] || REPLIES_REVEAL_COUNT) +
                            REPLIES_REVEAL_COUNT,
                        }))
                      }
                    >
                      Read more replies...
                    </button>
                  )}
                </div>
              )}
            </div>
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
  userId,
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
          userId={userId}
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
          Read more comments...
        </button>
      )}
    </div>
  );
};

interface CommentReplyFormProps {
  handleReply: (e: React.FormEvent) => void;
  replyContent: string;
  setReplyContent: (value: string) => void;
  isSubmitting: boolean;
}

export const CommentReplyForm: React.FC<CommentReplyFormProps> = ({
  handleReply,
  setReplyContent,
  replyContent,
  isSubmitting
}) => {
  return (
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
  );
};