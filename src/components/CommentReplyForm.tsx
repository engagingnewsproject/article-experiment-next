import React, { useState } from "react";
import styles from "./Comments.module.css";

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
  isSubmitting,
}) => {
  const [name, setName] = useState("");

  return (
    <form onSubmit={handleReply} className={styles.inlineReplyForm}>
      {/* <input
        type="text"
        placeholder="Your Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className={styles.input}
      /> */}
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
