/**
 * Custom hook to get the current study/project ID from URL parameters.
 * 
 * This hook:
 * - Reads the 'study' query parameter from the URL
 * - Provides a default study ID if not specified
 * - Allows for project-specific configurations and data filtering
 * 
 * @example
 * // Usage in a component:
 * const { studyId } = useStudyId();
 * console.log(studyId); // 'eonc' (Evaluating Online News Comments) or other study IDs
 * // Note: Also accepts 'ashwin' (maps to 'eonc') for backward compatibility
 * 
 * @returns {Object} Study identification data
 * @property {string} studyId - The current study ID
 */

'use client';

import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import { 
  DEFAULT_STUDY_ID, 
  normalizeStudyId, 
  getAllValidStudyIds 
} from '@/lib/studies';

/**
 * Valid study IDs (canonical + aliases) - exported for backward compatibility
 */
export const VALID_STUDY_IDS = getAllValidStudyIds() as readonly string[];

/**
 * Custom hook that extracts and validates the study ID from URL parameters.
 * 
 * Supports both canonical IDs (e.g., eonc) and aliases (e.g., ashwin) for backward compatibility.
 * Always returns the canonical ID internally for data consistency.
 * 
 * @returns {Object} Study identification
 * @property {string} studyId - The canonical study ID (defaults to 'eonc')
 */
export function useStudyId(): { studyId: string } {
  const searchParams = useSearchParams();
  
  const studyId = useMemo(() => {
    const studyParam = searchParams?.get('study');
    
    // If no study param, use default
    if (!studyParam) {
      return DEFAULT_STUDY_ID;
    }
    
    // Normalize to canonical ID (handles aliases like 'ashwin' -> 'eonc')
    const normalized = normalizeStudyId(studyParam);
    
    // If the input was invalid, log warning
    const validIds = getAllValidStudyIds();
    if (!validIds.includes(studyParam.toLowerCase())) {
      console.warn(`Invalid study ID "${studyParam}". Using default: ${DEFAULT_STUDY_ID}`);
      return DEFAULT_STUDY_ID;
    }
    
    return normalized;
  }, [searchParams]);
  
  return { studyId };
}

