import { Comment, updateCommentVotes } from "@/lib/firestore";
import React, { useState } from "react";
import styles from "./Comments.module.css";
import { createCookie, deleteCookie } from "./Comments";
import { BiDislike, BiLike, BiSolidDislike, BiSolidLike } from "react-icons/bi";
import { useLogger } from '@/hooks/useLogger';
import { type QualtricsData } from '@/hooks/useQualtrics';
import { VoteButton } from './VoteButton';

/**
 * Props for the CommentVoteSection component.
 * 
 * @property commentId - The unique ID of the comment or reply being voted on.
 * @property parentId - (Optional) The IDs of the reply's ancestors
 * @property identifier - The article ID (used for database paths and cookies).
 * @property comment - The full comment object (for initial vote counts).
 */
interface CommentVoteSectionProps {
  commentId: string;
  ancestorIds: string[];
  identifier: string;
  comment: Comment;
  userId: string;
  articleTitle?: string;
  qualtricsData?: QualtricsData;
  studyId?: string; // Article's studyId
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
  ancestorIds,
  identifier, 
  comment,
  userId,
  articleTitle,
  qualtricsData,
  studyId,
}) => {
  const { log } = useLogger(qualtricsData || {}, studyId);

  // Default vote counts from the article's default comments (baseline)
  const defaultUpvotes = Number(comment.upvotes) || 0;
  const defaultDownvotes = Number(comment.downvotes) || 0;
  
  // Session vote deltas (changes made in this viewing session)
  const [sessionUpvoteDelta, setSessionUpvoteDelta] = useState(0);
  const [sessionDownvoteDelta, setSessionDownvoteDelta] = useState(0);
  
  // Local state for this user's vote status
  const [voted, setVoted] = useState<{ upvotes: boolean; downvotes: boolean }>({
    upvotes: false,
    downvotes: false,
  });
  
  // Displayed counts = defaults + session changes
  const upvotes = defaultUpvotes + sessionUpvoteDelta;
  const downvotes = defaultDownvotes + sessionDownvoteDelta;

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
      // Decrement the other vote's session delta
      await updateCommentVotes(identifier, commentId, otherVoteType, -1, ancestorIds);
      if (otherVoteType === 'upvotes') {
        setSessionUpvoteDelta((n) => n - 1);
      } else {
        setSessionDownvoteDelta((n) => n - 1);
      }
    }

    // Add the new vote (update session delta)
    if (voteType === 'upvotes') {
      setSessionUpvoteDelta((n) => n + 1);
    } else {
      setSessionDownvoteDelta((n) => n + 1);
    }

    // Update voted state: only the new vote is true
    setVoted({
      upvotes: voteType === 'upvotes',
      downvotes: voteType === 'downvotes',
    });

    // Save vote to Firebase for research data (but it won't affect future page loads)
    await updateCommentVotes(identifier, commentId, voteType, 1, ancestorIds);

    // Log the vote event
    await log(
      voteType === 'upvotes' ? 'Upvote ' : 'Downvote ',
      voteType === 'upvotes' ? 'Upvote' : 'Downvote',
      `Voted on commentId: ${commentId}`,
      identifier,
      userId,
      articleTitle
    );
  };

  return (
    <>
      {/* Upvote button */}
      <VoteButton
        onClick={() => handleVote('upvotes')}
        disabled={voted.upvotes}
        isActive={voted.upvotes}
        count={upvotes}
        iconActive={BiSolidLike}
        iconInactive={BiLike}
        ariaLabel="Upvote this comment"
      />
      {/* Downvote button */}
      <VoteButton
        onClick={() => handleVote('downvotes')}
        disabled={voted.downvotes}
        isActive={voted.downvotes}
        count={downvotes}
        iconActive={BiSolidDislike}
        iconInactive={BiDislike}
        ariaLabel="Downvote this comment"
      />
    </>
  );
};
