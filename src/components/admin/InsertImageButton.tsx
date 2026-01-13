/**
 * Reusable component for inserting image template into textarea fields.
 * 
 * This component:
 * - Provides a button to insert an image template at the cursor position
 * - Works with any textarea element by ID
 * - Updates the textarea value and triggers onChange callback
 * 
 * @component
 * @param {Object} props - Component props
 * @param {string} props.textareaId - The ID of the textarea element
 * @param {Function} props.onInsert - Callback function called after insertion with new value
 * @returns {JSX.Element} The insert image button component
 */

"use client";

import React from 'react';

interface InsertImageButtonProps {
  /** The ID of the textarea element to insert into */
  textareaId: string;
  /** Callback function called after insertion with the new textarea value */
  onInsert?: (newValue: string) => void;
  /** Optional custom className for the button */
  className?: string;
  /** Optional custom className for the tip text */
  tipClassName?: string;
  /** Whether to show the tip text */
  showTip?: boolean;
}

/**
 * InsertImageButton component that inserts an image template into a textarea.
 * 
 * @param {InsertImageButtonProps} props - Component props
 * @returns {JSX.Element} The rendered button component
 */
export const InsertImageButton: React.FC<InsertImageButtonProps> = ({
  textareaId,
  onInsert,
  className = "px-2 py-1 text-xs font-semibold text-white bg-blue-500 rounded hover:bg-blue-600 focus:outline-none",
  tipClassName = "text-xs text-gray-500",
  showTip = true,
}) => {
  const handleInsert = () => {
    const textarea = document.getElementById(textareaId) as HTMLTextAreaElement;
    if (textarea) {
      const template = '[img src="" caption=""]';
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = textarea.value;
      const newValue = value.slice(0, start) + template + value.slice(end);
      
      // Update textarea value and cursor position
      textarea.value = newValue;
      textarea.selectionStart = textarea.selectionEnd = start + template.length;
      textarea.focus();
      
      // Call the callback to update React state
      // This is the primary way to update state in controlled components
      if (onInsert) {
        onInsert(newValue);
      } else {
        // Fallback: trigger input event if no callback provided
        const event = new Event('input', { bubbles: true });
        textarea.dispatchEvent(event);
      }
    }
  };

  return (
    <div className="flex items-center gap-2 mb-2">
      <button
        type="button"
        className={className}
        title="Insert image template at cursor"
        onClick={handleInsert}
      >
        + Insert Image
      </button>
      {showTip && (
        <span className={tipClassName}>
          Tip: Use the button to insert an image template at the cursor.
        </span>
      )}
    </div>
  );
};

