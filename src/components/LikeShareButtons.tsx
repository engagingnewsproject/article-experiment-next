/**
 * LikeShareButtons component that displays like and share buttons for articles.
 * 
 * This component:
 * - Displays like and share buttons when enabled
 * - Tracks user interactions via logging (share button is for logging only, not actual sharing)
 * - Provides visual feedback when like and share buttons are clicked
 * - Sends postMessage events to parent window when embedded in an iframe (for external click tracking)
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
  onLikeClick: () => void | Promise<void>;
  onShareClick: () => void | Promise<void>;
}

export function LikeShareButtons({ onLikeClick, onShareClick }: LikeShareButtonsProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [isShared, setIsShared] = useState(false);

  /**
   * Sends a postMessage to the parent window to notify about click events.
   * This allows parent pages (like Qualtrics) to track clicks for external systems (like Prolific).
   * 
   * @param buttonType - The type of button that was clicked ('like' or 'share')
   */
  const notifyParentWindow = (buttonType: 'like' | 'share') => {
    // Only send message if we're in an iframe
    if (typeof window !== 'undefined' && window.parent !== window) {
      window.parent.postMessage(
        {
          type: 'ARTICLE_BUTTON_CLICK',
          buttonType: buttonType,
          timestamp: Date.now(),
        },
        '*' // In production, consider restricting to specific origins for security
      );
      console.log(`[LikeShareButtons] Sent ${buttonType} click notification to parent window`);
    }
  };

  const handleLikeClick = async () => {
    setIsLiked(true);
    // Await the callback to ensure logging completes before notifying parent
    await onLikeClick();
    notifyParentWindow('like');
  };

  const handleShareClick = async () => {
    setIsShared(true);
    // Await the callback to ensure logging completes before notifying parent
    await onShareClick();
    notifyParentWindow('share');
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
