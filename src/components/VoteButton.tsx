// src/components/VoteButton.tsx
import React from 'react';
import { IconType } from 'react-icons';
import styles from './Comments.module.css';

/**
 * Props for the VoteButton component.
 * 
 * @property onClick - Handler function when the button is clicked
 * @property disabled - Whether the button is disabled (defaults to false)
 * @property isActive - Whether the vote is currently active (determines icon)
 * @property count - The vote count to display (number or React.ReactNode for text)
 * @property iconActive - Icon to display when vote is active
 * @property iconInactive - Icon to display when vote is inactive
 * @property ariaLabel - Accessibility label for the button
 * @property className - Optional custom CSS class name
 */
interface VoteButtonProps {
  onClick: () => void;
  disabled?: boolean;
  isActive?: boolean;
  count: number | React.ReactNode;
  iconActive: IconType;
  iconInactive: IconType;
  ariaLabel?: string;
  className?: string;
}

/**
 * Reusable vote button component that displays an icon, count/text, and handles click events.
 * 
 * @component
 */
export const VoteButton: React.FC<VoteButtonProps> = ({
  onClick,
  disabled = false,
  isActive = false,
  count,
  iconActive: IconActive,
  iconInactive: IconInactive,
  ariaLabel,
  className,
}) => {
  return (
    <button
      onClick={onClick}
      className={className || styles.voteButton}
      disabled={disabled}
      aria-label={ariaLabel}
      type="button"
    >
      {isActive ? <IconActive /> : <IconInactive />}
      <span>{count}</span>
    </button>
  );
};