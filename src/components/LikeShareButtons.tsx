/**
 * LikeShareButtons component that displays like and share buttons for articles.
 * 
 * This component:
 * - Displays like and share buttons when enabled
 * - Tracks user interactions via logging (share button is for logging only, not actual sharing)
 * - Provides visual feedback when like and share buttons are clicked
 * 
 * @component
 * @param {Object} props - Component props
 * @param {Function} props.onLikeClick - Callback function when like button is clicked
 * @param {Function} props.onShareClick - Callback function when share button is clicked
 * @returns {JSX.Element | null} The like/share buttons or null if not enabled
 */

import { useState } from 'react';
import styles from './LikeShareButtons.module.css';
import { VoteButton } from './VoteButton';
import { BiLike, BiSolidLike, BiShare, BiSolidShare } from 'react-icons/bi';

interface LikeShareButtonsProps {
  onLikeClick: () => void;
  onShareClick: () => void;
}

export function LikeShareButtons({ onLikeClick, onShareClick }: LikeShareButtonsProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [isShared, setIsShared] = useState(false);

  const handleLikeClick = () => {
    setIsLiked(true);
    onLikeClick();
  };

  const handleShareClick = () => {
    setIsShared(true);
    onShareClick();
  };

  return (
    <div className={styles.likeShareSection}>
      <VoteButton
        onClick={handleLikeClick}
        disabled={isLiked}
        isActive={isLiked}
        count="Like"
        iconActive={BiSolidLike}
        iconInactive={BiLike}
        ariaLabel="Like this article"
        className={styles.likeButton}
      />
      <VoteButton
        onClick={handleShareClick}
        disabled={isShared}
        isActive={isShared}
        count="Share"
        iconActive={BiSolidShare}
        iconInactive={BiShare}
        ariaLabel="Share this article"
        className={styles.shareButton}
      />
    </div>
  );
}
