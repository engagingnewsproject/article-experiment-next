/**
 * Select component - A reusable select dropdown with consistent styling.
 * 
 * This component provides a standardized select dropdown that can be used
 * throughout the admin section for consistent UI and behavior.
 * 
 * @component
 */

'use client';

interface SelectOption {
  /** Option value */
  value: string;
  /** Option display text */
  label: string;
}

interface SelectProps {
  /** Unique identifier for the select */
  id: string;
  /** Current selected value */
  value: string;
  /** Callback when the selection changes */
  onChange: (value: string) => void;
  /** Array of options to display */
  options: SelectOption[];
  /** Label text (hidden by default, shown for screen readers) */
  label?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Select component that provides a consistent select dropdown.
 * 
 * @param {SelectProps} props - Component props
 * @returns {JSX.Element} The select dropdown
 */
export function Select({
  id,
  value,
  onChange,
  options,
  label,
  className = '',
}: SelectProps) {
  const baseClasses = 'w-full px-3 py-2 border border-gray-300 rounded-md';
  const combinedClasses = `${baseClasses} ${className}`.trim();

  return (
    <>
      {label && (
        <label htmlFor={id} className="sr-only">
          {label}
        </label>
      )}
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={combinedClasses}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </>
  );
}
