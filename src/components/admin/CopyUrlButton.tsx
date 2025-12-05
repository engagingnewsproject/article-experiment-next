/**
 * Reusable component for copying URLs to clipboard.
 * 
 * This component:
 * - Provides a button to copy a URL to the clipboard
 * - Shows visual feedback when the URL is copied
 * - Uses modern clipboard API with fallback for older browsers
 * 
 * @component
 * @param {Object} props - Component props
 * @param {string} props.url - The URL to copy
 * @param {string} [props.label="Copy URL"] - The button label
 * @param {string} [props.copiedLabel="Copied!"] - The label to show after copying
 * @param {string} [props.className] - Optional custom className for the button
 * @param {string} [props.title] - Optional title/tooltip for the button
 * @returns {JSX.Element} The copy URL button component
 */

"use client";

import React, { useState } from 'react';

interface CopyUrlButtonProps {
  /** The URL to copy to clipboard */
  url: string;
  /** The button label (default: "Copy URL") */
  label?: string;
  /** The label to show after copying (default: "Copied!") */
  copiedLabel?: string;
  /** Optional custom className for the button */
  className?: string;
  /** Optional title/tooltip for the button */
  title?: string;
  /** Duration in milliseconds to show the copied state (default: 2000) */
  copiedDuration?: number;
}

/**
 * CopyUrlButton component that copies a URL to the clipboard.
 * 
 * @param {CopyUrlButtonProps} props - Component props
 * @returns {JSX.Element} The rendered button component
 */
export const CopyUrlButton: React.FC<CopyUrlButtonProps> = ({
  url,
  label = 'Copy URL',
  copiedLabel = 'Copied!',
  className = 'px-3 py-1 text-sm text-white bg-blue-500 rounded hover:bg-blue-700',
  title = 'Copy URL to clipboard',
  copiedDuration = 2000,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      // Reset the copied state after the specified duration
      setTimeout(() => setCopied(false), copiedDuration);
    } catch (err) {
      console.error('Failed to copy URL:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = url;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), copiedDuration);
      } catch (fallbackErr) {
        console.error('Fallback copy failed:', fallbackErr);
      }
      document.body.removeChild(textArea);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={className}
      title={title}
      type="button"
    >
      {copied ? copiedLabel : label}
    </button>
  );
};

