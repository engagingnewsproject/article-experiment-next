import { Comment, updateCommentVotes } from "@/lib/firestore";
import Cookies from "js-cookie";
import React, { useState } from "react";
import styles from "./Comments.module.css";

const CommentVoteSection: React.FC<{
  commentId: string;
  identifier: string;
  comment: Comment;
}> = ({ commentId, identifier, comment }) => {
  const [upvotes, setUpvotes] = useState(comment.upvotes || 0);
  const [downvotes, setDownvotes] = useState(comment.downvotes || 0);
  const [voted, setVoted] = useState(() => {
    return {
      upvotes: Cookies.get(`upvotes_${identifier}_${commentId}`) === "true",
      downvotes: Cookies.get(`downvotes_${identifier}_${commentId}`) === "true",
    };
  });

  const handleCommentVote = async (voteType: "upvotes" | "downvotes") => {
    const isVoted = voted[voteType];
    const value = isVoted ? -1 : 1;
    const newVotedState = { ...voted };

    try {
      if (isVoted) {
        Cookies.remove(`${voteType}_${identifier}_${commentId}`);
        newVotedState[voteType] = false;
      } else {
        const otherVoteType = voteType === "upvotes" ? "downvotes" : "upvotes";
        if (voted[otherVoteType]) {
          Cookies.remove(`${otherVoteType}_${identifier}_${commentId}`);
          await updateCommentVotes(identifier, commentId, otherVoteType, -1);
          newVotedState[otherVoteType] = false;
          voteType === "upvotes"
            ? setDownvotes(downvotes - 1)
            : setUpvotes(upvotes - 1);
        }
        Cookies.set(`${voteType}_${identifier}_${commentId}`, "true");
        newVotedState[voteType] = true;
      }

      voteType === "upvotes"
        ? setUpvotes(upvotes + value)
        : setDownvotes(downvotes + value);

      setVoted(newVotedState);
      await updateCommentVotes(identifier, commentId, voteType, value);
    } catch (err) {
      console.error("Failed to vote:", err);
    }
  };

  return (
    <>
      <button
        className={styles.voteButton}
        onClick={() => handleCommentVote("upvotes")}
      >
        <span>{upvotes}</span>
        <span>Upvotes</span>
      </button>
      <button
        className={styles.voteButton}
        onClick={() => handleCommentVote("downvotes")}
      >
        <span>{downvotes}</span>
        <span>Downvotes</span>
      </button>
    </>
  );
};

export default CommentVoteSection;
