import React, { useState } from 'react';
import styles from './Comments.module.css';

interface Comment {
  id: string;
  name: string;
  content: string;
  timestamp: string;
}

interface CommentsProps {
  comments: Comment[];
  anonymous: boolean;
  identifier: string;
}

export const Comments: React.FC<CommentsProps> = ({ comments, anonymous, identifier }) => {
  const [newComment, setNewComment] = useState({
    name: '',
    email: '',
    content: ''
  });

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