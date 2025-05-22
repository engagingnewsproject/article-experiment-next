import { Comment, updateCommentVotes } from "@/lib/firestore";
import Cookies from "js-cookie";
import React, { useState } from "react";
import styles from "./Comments.module.css";
// TODO: User should only be able to vote once.
interface CommentVoteSectionProps {
  commentId: string;
  identifier: string;
  comment: Comment;
  onVote: (type: 'upvotes' | 'downvotes', value: number) => void;
}

export const CommentVoteSection: React.FC<CommentVoteSectionProps> = ({ 
  commentId, 
  identifier, 
  comment,
  onVote 
}) => {
  const [voted, setVoted] = useState(() => {
    return {
      upvotes: Cookies.get(`upvotes_${identifier}_${commentId}`) === "true",
      downvotes: Cookies.get(`downvotes_${identifier}_${commentId}`) === "true",
    };
  });

  const handleVote = async (type: 'upvotes' | 'downvotes', value: number) => {
    const isVoted = voted[type];
    const voteValue = isVoted ? -1 : 1;
    const newVotedState = { ...voted };

    try {
      if (isVoted) {
        Cookies.remove(`${type}_${identifier}_${commentId}`);
        newVotedState[type] = false;
      } else {
        const otherVoteType = type === "upvotes" ? "downvotes" : "upvotes";
        if (voted[otherVoteType]) {
          Cookies.remove(`${otherVoteType}_${identifier}_${commentId}`);
          await updateCommentVotes(identifier, commentId, otherVoteType, -1);
          newVotedState[otherVoteType] = false;
        }
        Cookies.set(`${type}_${identifier}_${commentId}`, "true");
        newVotedState[type] = true;
      }

      // Update local state
      onVote(type, voteValue);
      
      // Save to database
      await updateCommentVotes(identifier, commentId, type, voteValue);
      
      setVoted(newVotedState);
    } catch (err) {
      console.error("Failed to vote:", err);
    }
  };

  return (
    <>
      <button 
        onClick={() => handleVote('upvotes', 1)}
        className={styles.voteButton}
      >
        <span>{comment.upvotes || 0}</span>
        <span>Upvotes</span>
      </button>
      <button 
        onClick={() => handleVote('downvotes', 1)}
        className={styles.voteButton}
      >
        <span>{comment.downvotes || 0}</span>
        <span>Downvotes</span>
      </button>
    </>
  );
};
