import { Comment, updateCommentVotes } from "@/lib/firestore";
import React, { useState } from "react";
import styles from "./Comments.module.css";
import { createCookie, deleteCookie, readCookie } from "./Comments";
// TODO: User should only be able to vote once.
interface CommentVoteSectionProps {
  commentId: string;
  identifier: string;
  comment: Comment;
}

export const CommentVoteSection: React.FC<CommentVoteSectionProps> = ({ 
  commentId, 
  identifier, 
  comment,
}) => {
  const [upvotes, setUpvotes] = useState(comment.upvotes || 0);
  const [downvotes, setDownvotes] = useState(comment.downvotes || 0);
  const [isVoting, setIsVoting] = useState(false);
  const [voted, setVoted] = useState(() => {
    return {
      upvotes: readCookie("upvotes", identifier, commentId) === "true",
      downvotes: readCookie("downvotes", identifier, commentId) === "true",
    };
  });

  const handleVote = async (voteType: 'upvotes' | 'downvotes') => {
    const isVoted = voted[voteType];
    const voteValue = isVoted ? -1 : 1;
    const newVotedState = { ...voted };

    try {
      if (isVoting) return;
      setIsVoting(true);
      
      // Update vote state
      if (isVoted) {
        deleteCookie(voteType, identifier, commentId);
        newVotedState[voteType] = false;
      } else {
        // Handle otherVoteType state
        const otherVoteType = voteType === "upvotes" ? "downvotes" : "upvotes";
        if (voted[otherVoteType]) {
          deleteCookie(otherVoteType, identifier, commentId);
          await updateCommentVotes(identifier, commentId, otherVoteType, -1);
          newVotedState[otherVoteType] = false;
          
          // Decrement locally
          voteType === "upvotes"
            ? setDownvotes(downvotes - 1)
            : setUpvotes(upvotes - 1);
        }
        createCookie(voteType, identifier, commentId);
        newVotedState[voteType] = true;
      }
      
      // Increment locally
      voteType === "upvotes"
      ? setUpvotes(upvotes + voteValue)
      : setDownvotes(downvotes + voteValue);
      
      // Save to database
      await updateCommentVotes(identifier, commentId, voteType, voteValue);
      setVoted(newVotedState);
    } catch (err) {
      console.error("Failed to vote:", err);
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => handleVote('upvotes')}
        className={styles.voteButton}
        disabled={isVoting}
      >
        <span>{upvotes}</span>
        <span>Upvotes</span>
      </button>
      <button 
        onClick={() => handleVote('downvotes')}
        className={styles.voteButton}
        disabled={isVoting}
      >
        <span>{downvotes}</span>
        <span>Downvotes</span>
      </button>
    </>
  );
};
