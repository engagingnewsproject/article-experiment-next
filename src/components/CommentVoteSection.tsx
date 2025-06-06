import { Comment, updateCommentVotes } from "@/lib/firestore";
import React, { useState } from "react";
import styles from "./Comments.module.css";
import { createCookie, deleteCookie } from "./Comments";
import { BiDislike, BiLike, BiSolidDislike, BiSolidLike } from "react-icons/bi";

// TODO: User should only be able to vote once.
interface CommentVoteSectionProps {
  commentId: string;
  parentId?: string;
  grandParentId?: string;
  identifier: string;
  comment: Comment;
}

export const CommentVoteSection: React.FC<CommentVoteSectionProps> = ({ 
  commentId, 
  parentId,
  grandParentId,
  identifier, 
  comment,
}) => {
  const [upvotes, setUpvotes] = useState(comment.upvotes || 0);
  const [downvotes, setDownvotes] = useState(comment.downvotes || 0);
  const [isVoting, setIsVoting] = useState(false);
  const [voted, setVoted] = useState(() => {
    return {
      upvotes: false,
      downvotes: false,
    };
  });

  const handleVote = async (voteType: 'upvotes' | 'downvotes') => {
    if (isVoting) return;
    setIsVoting(true);

    const otherVoteType = voteType === "upvotes" ? "downvotes" : "upvotes";
    const isOtherVoted = voted[otherVoteType];
    const isVoted = voted[voteType];
    const newVotedState = { ...voted };

    try {
      if (isVoted) {
        deleteCookie(voteType, identifier, commentId);
        newVotedState[voteType] = false;

        voteType === "upvotes"
          ? setUpvotes((upvotes) => upvotes - 1)
          : setDownvotes((downvotes) => downvotes - 1);

        await updateCommentVotes(identifier, commentId, voteType, -1, parentId, grandParentId);
      } else {
        createCookie(voteType, identifier, commentId);
        newVotedState[voteType] = true;

        voteType === "upvotes"
          ? setUpvotes((upvotes) => upvotes + 1)
          : setDownvotes((downvotes) => downvotes + 1);

        if (isOtherVoted) {
          deleteCookie(otherVoteType, identifier, commentId);
          newVotedState[otherVoteType] = false;

          otherVoteType === "upvotes"
            ? setUpvotes((upvotes) => upvotes - 1)
            : setDownvotes((downvotes) => downvotes - 1);
          
          await updateCommentVotes(identifier, commentId, otherVoteType, -1, parentId, grandParentId);
        }

        await updateCommentVotes(identifier, commentId, voteType, 1, parentId, grandParentId);
      }
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
        {voted.upvotes ? <BiSolidLike /> : <BiLike />}
        <span>{upvotes}</span>
      </button>
      <button 
        onClick={() => handleVote('downvotes')}
        className={styles.voteButton}
        disabled={isVoting}
      >
        {voted.downvotes ? <BiSolidDislike /> : <BiDislike />}
        <span>{downvotes}</span>
      </button>
    </>
  );
};
