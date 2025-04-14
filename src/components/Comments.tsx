/**
 * Comments component that handles the display and submission of article comments.
 * 
 * This component:
 * - Displays existing comments with user information and timestamps
 * - Provides a form for submitting new comments
 * - Supports anonymous and authenticated comment modes
 * - Includes reaction buttons (thumbs up/down)
 * - Manages comment form state
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

/**
 * Interface for a single comment.
 * 
 * @interface Comment
 * @property {string} id - Unique identifier for the comment
 * @property {string} name - Name of the commenter
 * @property {string} content - The comment text
 * @property {string} timestamp - When the comment was posted
 */
interface Comment {
  id: string;
  name: string;
  content: string;
  timestamp: string;
}

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
export const Comments: React.FC<CommentsProps> = ({ comments, anonymous, identifier }) => {
  const [newComment, setNewComment] = useState({
    name: '',
    email: '',
    content: ''
  });

  /**
   * Handles the submission of a new comment.
   * 
   * @param {React.FormEvent} e - The form submission event
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle comment submission
  };

  return (
    <section className={styles.commentsSection}>
      <div className={styles.newComment}>
        <h3 className={styles.addCommentTitle}>Comments</h3>
        
        {comments.map((comment) => (
          <div key={comment.id} className={styles.comment}>
            <p className={styles.commentName}>{comment.name}</p>
            <p className={styles.commentInfo}>{comment.timestamp}</p>
            <div className={styles.commentFooter}>
              <button className={styles.thumbsUp}>👍</button>
              <button className={styles.thumbsDown}>👎</button>
              <p className={styles.toggle}>Reply</p>
            </div>
          </div>
        ))}

        <h3 className={styles.addCommentTitle}>Leave a Comment</h3>
        <div id="comment-form" className={styles.addComment}>
          {anonymous && (
            <h6 className={styles.smallCommentText}>
              This is an anonymous website. A user ID for your comment will be randomly generated.
            </h6>
          )}
          
          {!anonymous && (
            <>
              <label htmlFor="commenter-name">Name</label>
              <input
                type="text"
                className={styles.formControl}
                name="commenter-name"
                id="commenter-name"
                placeholder="Enter Full Name"
                value={newComment.name}
                onChange={(e) => setNewComment({ ...newComment, name: e.target.value })}
              />
              <label htmlFor="commenter-email">Email</label>
              <input
                type="email"
                className={styles.formControl}
                name="commenter-email"
                id="commenter-email"
                placeholder="Enter Email"
                value={newComment.email}
                onChange={(e) => setNewComment({ ...newComment, email: e.target.value })}
              />
            </>
          )}

          <label htmlFor="commenter-comment">Comment</label>
          <textarea
            className={styles.formControl}
            rows={3}
            name="commenter-comment"
            id="commenter-comment"
            placeholder="Enter Comment"
            value={newComment.content}
            onChange={(e) => setNewComment({ ...newComment, content: e.target.value })}
          />

          <input type="hidden" id="comment-identifier" name="comment-identifier" value={identifier} />
          <button id="submit-comment" className={styles.btnSubmit} onClick={handleSubmit}>
            Submit
          </button>
        </div>
      </div>
    </section>
  );
}; 