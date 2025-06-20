import { Comment, updateCommentVotes } from "@/lib/firestore";
import React, { useState } from "react";
import styles from "./Comments.module.css";
import { createCookie, deleteCookie } from "./Comments";
import { BiDislike, BiLike, BiSolidDislike, BiSolidLike } from "react-icons/bi";
import { useLogger } from '@/hooks/useLogger';

/**
 * Props for the CommentVoteSection component.
 * 
 * @property commentId - The unique ID of the comment or reply being voted on.
 * @property parentId - (Optional) The parent comment's ID if this is a reply.
 * @property grandParentId - (Optional) The grandparent comment's ID if this is a sub-reply.
 * @property identifier - The article ID (used for database paths and cookies).
 * @property comment - The full comment object (for initial vote counts).
 */
interface CommentVoteSectionProps {
  commentId: string;
  parentId?: string;
  grandParentId?: string;
  identifier: string;
  comment: Comment;
  userId: string;
}

/**
 * Renders upvote and downvote buttons for a comment or reply.
 * Handles vote state, UI, and updates Firestore and cookies when a user votes.
 * 
 * - Shows current upvote/downvote counts.
 * - Prevents multiple votes in a session using cookies.
 * - Handles switching between upvote and downvote.
 * - Disables buttons while a vote is being processed.
 */
export const CommentVoteSection: React.FC<CommentVoteSectionProps> = ({ 
  commentId, 
  parentId,
  grandParentId,
  identifier, 
  comment,
  userId,
}) => {
  const { log } = useLogger();

  // Local state for this user's vote and the displayed counts
  const [voted, setVoted] = useState<{ upvotes: boolean; downvotes: boolean }>({
    upvotes: false,
    downvotes: false,
  });
  const [upvotes, setUpvotes] = useState(Number(comment.upvotes) || 0);
  const [downvotes, setDownvotes] = useState(Number(comment.downvotes) || 0);

  /**
   * Handles voting logic when a user clicks upvote or downvote.
   * - Updates local state and Firestore.
   * - Uses cookies to prevent multiple votes.
   * - Handles switching between upvote and downvote.
   * 
   * @param voteType - 'upvotes' or 'downvotes'
   */
  const handleVote = async (voteType: 'upvotes' | 'downvotes') => {
    if (!commentId) {
      console.error('No commentId provided to log vote');
      return;
    }
    if (voted[voteType]) return; // Prevent double-voting

    const otherVoteType = voteType === 'upvotes' ? 'downvotes' : 'upvotes';

    // If the user already voted the other way, remove that vote
    if (voted[otherVoteType]) {
      // Decrement the other vote count
      if (otherVoteType === 'upvotes') setUpvotes((n) => n - 1);
      if (otherVoteType === 'downvotes') setDownvotes((n) => n - 1);
    }

    // Add the new vote
    if (voteType === 'upvotes') setUpvotes((n) => n + 1);
    if (voteType === 'downvotes') setDownvotes((n) => n + 1);

    // Update voted state: only the new vote is true
    setVoted({
      upvotes: voteType === 'upvotes',
      downvotes: voteType === 'downvotes',
    });

    // Log the vote event
    await log(
      'Vote',
      voteType === 'upvotes' ? 'Upvote' : 'Downvote',
      `Voted on commentId: ${commentId}` +
        (parentId ? `, parentId: ${parentId}` : '') +
        (grandParentId ? `, grandParentId: ${grandParentId}` : ''),
      identifier,
      userId
    );
  };

  return (
    <>
      {/* Upvote button */}
      <button 
        onClick={() => handleVote('upvotes')}
        className={styles.voteButton}
        disabled={voted.upvotes}
      >
        {voted.upvotes ? <BiSolidLike /> : <BiLike />}
        <span>{upvotes}</span>
      </button>
      {/* Downvote button */}
      <button 
        onClick={() => handleVote('downvotes')}
        className={styles.voteButton}
        disabled={voted.downvotes}
      >
        {voted.downvotes ? <BiSolidDislike /> : <BiDislike />}
        <span>{downvotes}</span>
      </button>
    </>
  );
};
