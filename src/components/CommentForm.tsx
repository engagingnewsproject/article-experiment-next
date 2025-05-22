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
import React, { useState } from "react";
import styles from "./Comments.module.css";
import { saveComment } from "@/lib/firestore";
import { type Comment } from "@/lib/firestore";

interface CommentFormProps {
  anonymous?: boolean;
  identifier: string;
  onCommentSubmitted: () => void;
}

export const CommentForm: React.FC<CommentFormProps> = ({
  anonymous = false,
  identifier,
  onCommentSubmitted,
}) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const commentData = {
        name: name || "Anonymous",
        email: email || "",
        content,
        upvotes: 0,
        downvotes: 0,
      };

      await saveComment(identifier, commentData);
      setName("");
      setEmail("");
      setContent("");
      onCommentSubmitted();
    } catch (err) {
      setError("Failed to submit comment. Please try again.");
      console.log(err);
      console.log(name);
      console.log(email);
      console.log(content);
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
