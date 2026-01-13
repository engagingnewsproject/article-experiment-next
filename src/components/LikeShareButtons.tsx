/**
 * LikeShareButtons component that displays like and share buttons for articles.
 * 
 * This component:
 * - Displays like and share buttons when enabled
 * - Tracks user interactions via logging (share button is for logging only, not actual sharing)
 * 
 * @component
 * @param {Object} props - Component props
 * @param {Function} props.onLikeClick - Callback function when like button is clicked
 * @param {Function} props.onShareClick - Callback function when share button is clicked
 * @returns {JSX.Element | null} The like/share buttons or null if not enabled
 */

import styles from './LikeShareButtons.module.css';

interface LikeShareButtonsProps {
  onLikeClick: () => void;
  onShareClick: () => void;
}

export function LikeShareButtons({ onLikeClick, onShareClick }: LikeShareButtonsProps) {
  return (
    <div className={styles.likeShareSection}>
      <button
        type="button"
        className={styles.likeButton}
        onClick={onLikeClick}
        aria-label="Like this article"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M7 10v12M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-3.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z" />
        </svg>
        <span>Like</span>
      </button>
      <button
        type="button"
        className={styles.shareButton}
        onClick={onShareClick}
        aria-label="Share this article"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
        <span>Share</span>
      </button>
    </div>
  );
}
