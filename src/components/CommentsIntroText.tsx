/**
 * CommentsIntroText component that displays study-specific text before the comments section.
 * 
 * This component:
 * - Displays text configured at the study level
 * - Preserves whitespace and line breaks
 * - Only renders if text is provided
 * 
 * @component
 * @param {Object} props - Component props
 * @param {string} props.text - The intro text to display
 * @returns {JSX.Element | null} The intro text element or null if no text
 */

interface CommentsIntroTextProps {
  text: string;
}

export function CommentsIntroText({ text }: CommentsIntroTextProps) {
  if (!text) {
    return null;
  }

  return (
    <div className="mt-4 text-gray-700" style={{ whiteSpace: 'pre-wrap' }}>
      {text}
    </div>
  );
}
