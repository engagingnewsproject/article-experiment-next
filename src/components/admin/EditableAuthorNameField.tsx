/**
 * EditableAuthorNameField component for managing article author name.
 * 
 * This component:
 * - Provides a checkbox to show/hide the author name field
 * - Allows editing the author name value when enabled
 * - Handles value changes through a callback
 * 
 * @component
 */

'use client';

interface EditableAuthorNameFieldProps {
  /** Current author name value */
  value: string;
  /** Whether the field is currently enabled/visible */
  enabled: boolean;
  /** Callback when the enabled state changes */
  onEnabledChange: (enabled: boolean) => void;
  /** Callback when the value changes */
  onValueChange: (value: string) => void;
}

/**
 * EditableAuthorNameField component that provides a checkbox and input for author name.
 * 
 * @param {EditableAuthorNameFieldProps} props - Component props
 * @returns {JSX.Element} The author name field editor
 */
export function EditableAuthorNameField({
  value,
  enabled,
  onEnabledChange,
  onValueChange,
}: EditableAuthorNameFieldProps) {
  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onEnabledChange(!enabled);
  };

  return (
    <div className="space-y-2">
      <div 
        className="flex items-center gap-2 cursor-pointer"
        onClick={handleToggle}
      >
        <input
          type="checkbox"
          checked={enabled}
          readOnly
          className="w-4 h-4 pointer-events-none"
        />
        <span className="font-medium">Show & Edit Author Name</span>
      </div>
      {enabled && (
        <div>
          <label className="block mb-1 text-sm font-medium">Author Name:</label>
          <input
            type="text"
            value={value || ''}
            onChange={(e) => {
              e.stopPropagation();
              onValueChange(e.target.value);
            }}
            onFocus={(e) => {
              e.stopPropagation();
              // Prevent browser from auto-scrolling input into view
              e.target.scrollIntoView = () => {};
            }}
            onBlur={(e) => {
              e.stopPropagation();
            }}
            className="w-full px-3 py-2 border rounded"
            placeholder="e.g., John Doe, Staff Reporter, etc."
          />
        </div>
      )}
    </div>
  );
}
