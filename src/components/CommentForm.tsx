/**
 * CommentForm component that handles the submission of new comments.
 *
 * This component:
 * - Provides a form for submitting new comments
 * - Supports anonymous and authenticated comment modes
 * - Manages form state and validation
 * - Handles submission to Firestore
 *
 * @component
 * @param {Object} props - Component props
 * @param {boolean} props.anonymous - Whether the article is anonymous
 * @param {string} props.identifier - Unique identifier for the article
 * @param {Function} props.onCommentSubmitted - Callback when a comment is submitted
 * @returns {JSX.Element} The comment form
 */
import { saveComment, type Comment } from "@/lib/firestore";
import React, { useState } from "react";
import styles from "./Comments.module.css";
import { createCookie } from "./Comments";

interface CommentFormProps {
  /** Whether the article is anonymous, which determines if name/email fields are shown */
  anonymous: boolean;
  /** Unique identifier for the article, used when saving comments to the database */
  identifier: string;
  /** Callback function that is called when a new comment is submitted, passing the comment data to the parent component */
  onCommentSubmitted: (comment: Comment) => void;
  /** Optional callback function that is called when a comment is submitted, passing the name and content of the comment to the parent component */
  onCommentSubmit?: (name: string, content: string) => void;
}

export const CommentForm: React.FC<CommentFormProps> = ({
  anonymous = false,
  identifier,
  onCommentSubmitted,
  onCommentSubmit,
}) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Prevent submission of empty comments or comments containing only whitespace
    if (!content.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Call onCommentSubmit if provided
      if (onCommentSubmit) {
        onCommentSubmit(name || 'Anonymous', content);
      }

      // Save to database
      const commentData = {
        name: name || "Anonymous",
        email: email || "",
        content,
        upvotes: 0,
        downvotes: 0,
      };

      // Save the comment and get the returned string (e.g., comment ID)
      const commentId = await saveComment(identifier, commentData);

      // Create local comment for immediate display
      const newComment: Comment = {
        id: commentId,
        content,
        name: name || 'Anonymous',
        createdAt: new Date().toISOString(),
        upvotes: 0,
        downvotes: 0
      };

      // Update parent component with new comment and reset form fields
      onCommentSubmitted(newComment);
      createCookie("comment", identifier, commentId);
      setContent('');
      setName('');
      setEmail('');
    } catch (err) {
      setError("Failed to submit comment. Please try again.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.commentForm}>
      <h3 className={styles.addCommentTitle}>Add a Comment</h3>
      {!anonymous && (
        <>
          <input
            type="text"
            placeholder="Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={styles.input}
          />
          <input
            type="email"
            placeholder="Your Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.input}
          />
        </>
      )}
      <textarea
        placeholder="Your Comment"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className={styles.textarea}
        required
      />
      {error && <p className={styles.error}>{error}</p>}
      <button
        type="submit"
        className={styles.submitButton}
        disabled={isSubmitting}
      >
        {isSubmitting ? "Submitting..." : "Submit Comment"}
      </button>
    </form>
  );
};
