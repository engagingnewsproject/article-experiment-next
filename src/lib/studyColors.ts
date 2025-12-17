/**
 * Utility functions for assigning consistent colors to studies.
 * 
 * This module provides a deterministic way to assign colors to studies
 * based on their ID, ensuring the same study always gets the same color
 * across different parts of the application. Colors are assigned sequentially
 * based on sorted study IDs to ensure no two studies share the same color.
 * 
 * @module studyColors
 */

/**
 * Color palette for study borders.
 * These colors are distinct and provide good visual differentiation.
 */
const STUDY_COLORS = [
  'border-green-500',
  'border-blue-500',
  'border-red-500',
  'border-yellow-500',
  'border-purple-500',
  'border-orange-500',
  'border-pink-500',
  'border-indigo-500',
  'border-teal-500',
  'border-amber-500',
];

/**
 * Study interface for color assignment.
 */
interface StudyForColor {
  id: string;
}

/**
 * Creates a color map for all studies, ensuring no two studies share the same color.
 * Studies are sorted by ID (deterministic) and colors are assigned sequentially.
 * 
 * @param studies - Array of studies (must have an 'id' property)
 * @returns Map of study ID to color class
 */
export function createStudyColorMap(studies: StudyForColor[]): Map<string, string> {
  // Sort studies by ID to ensure deterministic ordering
  const sortedStudies = [...studies].sort((a, b) => a.id.localeCompare(b.id));
  
  const colorMap = new Map<string, string>();
  
  sortedStudies.forEach((study, index) => {
    // Cycle through colors if there are more studies than colors
      const colorIndex = index % STUDY_COLORS.length;
    colorMap.set(study.id, STUDY_COLORS[colorIndex]);
    });
    
  return colorMap;
}

/**
 * Gets a consistent color class for a study based on its ID and all available studies.
 * This ensures no two studies share the same color by using sorted order.
 * 
 * @param studyId - The study ID to get color for
 * @param allStudies - Array of all studies (must have an 'id' property)
 * @returns Tailwind CSS border color class (e.g., 'border-green-500')
 */
export function getStudyBorderColor(studyId: string, allStudies: StudyForColor[]): string {
  const colorMap = createStudyColorMap(allStudies);
  return colorMap.get(studyId) || STUDY_COLORS[0]; // Fallback to first color if not found
}
