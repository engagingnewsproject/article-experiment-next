/**
 * EditablePubdateField component for managing article publication date.
 * 
 * This component:
 * - Provides a checkbox to show/hide the pubdate field
 * - Allows editing the pubdate value when enabled
 * - Handles value changes through a callback
 * 
 * @component
 */

'use client';

interface EditablePubdateFieldProps {
  /** Current pubdate value */
  value: string;
  /** Whether the field is currently enabled/visible */
  enabled: boolean;
  /** Callback when the enabled state changes */
  onEnabledChange: (enabled: boolean) => void;
  /** Callback when the value changes */
  onValueChange: (value: string) => void;
}

/**
 * EditablePubdateField component that provides a checkbox and input for pubdate.
 * 
 * @param {EditablePubdateFieldProps} props - Component props
 * @returns {JSX.Element} The pubdate field editor
 */
export function EditablePubdateField({
  value,
  enabled,
  onEnabledChange,
  onValueChange,
}: EditablePubdateFieldProps) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onEnabledChange(e.target.checked)}
          className="w-4 h-4"
        />
        <span className="font-medium">Show & Edit Publication Date</span>
      </label>
      {enabled && (
        <div>
          <label className="block mb-1 text-sm font-medium">Publication Date:</label>
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onValueChange(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            placeholder="e.g., 1 day ago, Recently, etc."
          />
        </div>
      )}
    </div>
  );
}
