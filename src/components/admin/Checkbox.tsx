/**
 * Checkbox component - A reusable checkbox with label.
 * 
 * This component provides a standardized checkbox that can be used
 * throughout the admin section for consistent UI and behavior.
 * 
 * @component
 */

'use client';

import { ReactNode } from 'react';

interface CheckboxProps {
  /** Unique identifier for the checkbox */
  id?: string;
  /** Whether the checkbox is checked */
  checked: boolean;
  /** Callback when the checked state changes */
  onChange: (checked: boolean) => void;
  /** Label text or ReactNode displayed next to the checkbox */
  label: string | ReactNode;
  /** Additional CSS classes for the container */
  className?: string;
  /** Additional CSS classes for the checkbox input */
  inputClassName?: string;
}

/**
 * Checkbox component that provides a consistent checkbox with label.
 * 
 * @param {CheckboxProps} props - Component props
 * @returns {JSX.Element} The checkbox with label
 */
export function Checkbox({
  id,
  checked,
  onChange,
  label,
  className = '',
  inputClassName = '',
}: CheckboxProps) {
  const baseInputClasses = 'mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded';
  const combinedInputClasses = `${baseInputClasses} ${inputClassName}`.trim();
  const containerClasses = `flex items-center cursor-pointer ${className}`.trim();

  return (
    <label className={containerClasses}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className={combinedInputClasses}
      />
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  );
}
