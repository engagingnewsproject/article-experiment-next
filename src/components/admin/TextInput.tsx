/**
 * TextInput component - A reusable text input field with consistent styling.
 * 
 * This component provides a standardized text input that can be used throughout
 * the admin section for consistent UI and behavior.
 * 
 * @component
 */

'use client';

interface TextInputProps {
  /** Unique identifier for the input */
  id: string;
  /** Current value of the input */
  value: string;
  /** Callback when the value changes */
  onChange: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Label text (hidden by default, shown for screen readers) */
  label?: string;
  /** Additional CSS classes */
  className?: string;
  /** Input type (defaults to 'text') */
  type?: string;
}

/**
 * TextInput component that provides a consistent text input field.
 * 
 * @param {TextInputProps} props - Component props
 * @returns {JSX.Element} The text input field
 */
export function TextInput({
  id,
  value,
  onChange,
  placeholder,
  label,
  className = '',
  type = 'text',
}: TextInputProps) {
  const baseClasses = 'w-full px-3 py-2 border border-gray-300 rounded-md';
  const combinedClasses = `${baseClasses} ${className}`.trim();

  return (
    <>
      {label && (
        <label htmlFor={id} className="sr-only">
          {label}
        </label>
      )}
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={combinedClasses}
      />
    </>
  );
}
