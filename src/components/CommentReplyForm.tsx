import React from "react";
import styles from "./Comments.module.css";

interface CommentReplyFormProps {
  handleReply: (e: React.FormEvent) => void;
  replyContent: string;
  setReplyContent: (value: string) => void;
  isSubmitting: boolean;
  replyName: string;
  setReplyName: (value: string) => void;
}

export const CommentReplyForm: React.FC<CommentReplyFormProps> = ({
  handleReply,
  setReplyContent,
  replyContent,
  isSubmitting,
  replyName,
  setReplyName,
}) => {
  return (
    <form onSubmit={handleReply} className={styles.inlineReplyForm}>
      <input
        type="text"
        placeholder="Your Name"
        value={replyName}
        onChange={(e) => setReplyName(e.target.value)}
        className={styles.input}
      />
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
