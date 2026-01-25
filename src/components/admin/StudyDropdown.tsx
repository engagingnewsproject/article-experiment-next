/**
 * Reusable Study Dropdown Component
 * 
 * Displays a dropdown for selecting studies, with support for "All Studies" option
 * and dynamic loading of studies from Firestore.
 */

'use client';

import { StudyDefinition } from '@/lib/studies';

interface StudyDropdownProps {
  /** Current selected study ID ('all' for all studies) */
  value: string;
  /** Callback when selection changes */
  onChange: (studyId: string) => void;
  /** Array of available studies */
  studies: StudyDefinition[];
  /** Optional label text */
  label?: string;
  /** Optional className for styling */
  className?: string;
  /** Whether to show "All Studies" option (default: true) */
  showAllOption?: boolean;
}

/**
 * Study dropdown component for filtering by study.
 * 
 * @param props - Component props
 * @returns Study dropdown select element
 */
export function StudyDropdown({
  value,
  onChange,
  studies,
  label = 'Study',
  className = 'w-full px-3 py-2 border border-gray-300 rounded-md',
  showAllOption = true,
}: StudyDropdownProps) {
  return (
    <div>
      <label htmlFor="study-select" className="sr-only">{label}</label>
      <select
        id="study-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={className}
      >
        {showAllOption && <option value="all">Study</option>}
        {studies.map(study => (
          <option key={study.id} value={study.id}>
            {study.name} ({study.id.toUpperCase()})
          </option>
        ))}
      </select>
    </div>
  );
}

