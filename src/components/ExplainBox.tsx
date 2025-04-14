/**
 * ExplainBox component that displays additional explanatory content for an article.
 * 
 * This component:
 * - Shows supplementary information about the article
 * - Uses consistent styling with the application
 * - Provides a visually distinct section for explanations
 * - Handles empty content gracefully
 * 
 * @component
 * @param {Object} props - Component props
 * @param {string} [props.content] - The explanatory content to display
 * @returns {JSX.Element} The explanation box or null if no content
 */

/**
 * Props interface for the ExplainBox component.
 * 
 * @interface ExplainBoxProps
 * @property {string} [content] - The explanatory content to display
 */
interface ExplainBoxProps {
  content?: string;
}

/**
 * ExplainBox component that renders additional explanatory content.
 * 
 * This component:
 * - Renders explanatory content in a styled container
 * - Returns null if no content is provided
 * - Uses Tailwind CSS for styling
 * - Maintains consistent typography with the application
 * 
 * @param {ExplainBoxProps} props - Component props
 * @returns {JSX.Element | null} The rendered explanation box or null
 */
export function ExplainBox({ content }: ExplainBoxProps) {
  if (!content) return null;

  return (
    <div className="mt-8 p-6 bg-gray-100 rounded-lg">
      <h2 className="text-xl font-bold mb-4">Explanation</h2>
      <div className="prose max-w-none">
        {content}
      </div>
    </div>
  );
}
