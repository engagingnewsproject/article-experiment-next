/**
 * Centralized studies configuration.
 * 
 * This module defines all available studies/projects in the system.
 * Studies can be defined in code (for defaults) or added via the admin UI (stored in Firestore).
 * 
 * @module studies
 */

import { ProjectConfig, getProjectConfig } from './projectConfig';
import { getStudies as getFirestoreStudies } from './firestore';

/**
 * Study definition interface.
 */
export interface StudyDefinition {
  /** Canonical study ID (used internally and in URLs) */
  id: string;
  /** Display name for the study */
  name: string;
  /** Optional aliases for backward compatibility (e.g., 'ashwin' -> 'eonc') */
  aliases?: string[];
}

/**
 * Code-defined studies (defaults, cannot be deleted via UI).
 * These are the base studies that come with the system.
 */
export const CODE_STUDIES: StudyDefinition[] = [
  {
    id: 'eonc',
    name: 'Evaluating Online News Comments',
    aliases: ['ashwin'], // Backward compatibility
  },
];

/**
 * Cached studies (merged from code + Firestore).
 * This is populated asynchronously when needed.
 */
let cachedStudies: StudyDefinition[] | null = null;
let studiesLoadPromise: Promise<StudyDefinition[]> | null = null;

/**
 * Loads studies from Firestore and merges with code-defined studies.
 * Uses caching to avoid multiple Firestore calls.
 * 
 * @returns Promise resolving to array of all studies
 */
export async function loadStudies(): Promise<StudyDefinition[]> {
  // Return cached if available
  if (cachedStudies) {
    return cachedStudies;
  }

  // Return existing promise if already loading
  if (studiesLoadPromise) {
    return studiesLoadPromise;
  }

  // Load from Firestore and merge with code studies
  studiesLoadPromise = (async () => {
    try {
      const firestoreStudies = await getFirestoreStudies();
      
      // Merge: code studies take precedence, then add Firestore-only studies
      const codeStudyIds = new Set(CODE_STUDIES.map(s => s.id));
      const merged: StudyDefinition[] = [
        ...CODE_STUDIES,
        ...firestoreStudies
          .filter(s => !codeStudyIds.has(s.id))
          .map(s => ({
            id: s.id,
            name: s.name,
            aliases: s.aliases,
          })),
      ];

      cachedStudies = merged;
      return merged;
    } catch (error) {
      console.warn('Failed to load studies from Firestore, using code-defined only:', error);
      // Fallback to code-defined studies only
      cachedStudies = CODE_STUDIES;
      return CODE_STUDIES;
    } finally {
      studiesLoadPromise = null;
    }
  })();

  return studiesLoadPromise;
}

/**
 * Gets all studies (synchronous, uses cached or code-defined only).
 * For dynamic loading, use loadStudies() instead.
 * 
 * @returns Array of studies (may be incomplete if Firestore hasn't loaded yet)
 */
export function getStudiesSync(): StudyDefinition[] {
  return cachedStudies || CODE_STUDIES;
}

/**
 * Legacy export for backward compatibility.
 * Use getStudiesSync() or loadStudies() instead.
 */
export const STUDIES = CODE_STUDIES;

/**
 * Clears the studies cache (useful after adding/deleting studies).
 */
export function clearStudiesCache(): void {
  cachedStudies = null;
  studiesLoadPromise = null;
}

/**
 * Gets the full study definition including project config.
 * 
 * @param studyId - The study ID (canonical or alias)
 * @returns The study definition with config, or null if not found
 */
export function getStudyWithConfig(studyId: string): (StudyDefinition & { config: ProjectConfig }) | null {
  const study = getStudyById(studyId);
  if (!study) return null;
  
  return {
    ...study,
    config: getProjectConfig(study.id),
  };
}

/**
 * Default study ID (used when no study parameter is provided in URL).
 */
export const DEFAULT_STUDY_ID = 'eonc';

/**
 * Gets a study definition by its canonical ID or alias.
 * Uses cached studies or code-defined only (synchronous).
 * 
 * @param studyId - The study ID (canonical or alias)
 * @returns The study definition, or null if not found
 */
export function getStudyById(studyId: string): StudyDefinition | null {
  const normalized = studyId.toLowerCase();
  const studies = getStudiesSync();
  
  // First, try to find by canonical ID
  const byId = studies.find(s => s.id === normalized);
  if (byId) return byId;
  
  // Then, try to find by alias
  const byAlias = studies.find(s => 
    s.aliases?.some(alias => alias.toLowerCase() === normalized)
  );
  if (byAlias) return byAlias;
  
  return null;
}

/**
 * Gets all canonical study IDs.
 * Uses cached studies or code-defined only (synchronous).
 * 
 * @returns Array of canonical study IDs
 */
export function getCanonicalStudyIds(): string[] {
  return getStudiesSync().map(s => s.id);
}

/**
 * Gets all valid study IDs (canonical + aliases).
 * Uses cached studies or code-defined only (synchronous).
 * 
 * @returns Array of all valid study IDs
 */
export function getAllValidStudyIds(): string[] {
  const ids: string[] = [];
  getStudiesSync().forEach(study => {
    ids.push(study.id);
    if (study.aliases) {
      ids.push(...study.aliases);
    }
  });
  return ids;
}

/**
 * Normalizes a study ID to its canonical form.
 * 
 * @param studyId - The study ID (can be alias or canonical)
 * @returns The canonical study ID, or the default if not found
 */
export function normalizeStudyId(studyId: string): string {
  const study = getStudyById(studyId);
  return study?.id || DEFAULT_STUDY_ID;
}

/**
 * Gets all aliases for a canonical study ID.
 * Uses cached studies or code-defined only (synchronous).
 * 
 * @param canonicalId - The canonical study ID
 * @returns Array of all aliases (including the canonical ID itself)
 */
export function getStudyAliases(canonicalId: string): string[] {
  const studies = getStudiesSync();
  const study = studies.find(s => s.id === canonicalId);
  if (!study) return [canonicalId];
  
  return [study.id, ...(study.aliases || [])];
}

/**
 * Gets the display name for a study ID.
 * 
 * @param studyId - The study ID (canonical or alias)
 * @returns The display name, or the studyId if not found
 */
export function getStudyName(studyId: string): string {
  const study = getStudyById(studyId);
  return study?.name || studyId;
}

/**
 * Gets all studies with their full configurations.
 * Uses cached studies or code-defined only (synchronous).
 * 
 * @returns Array of study definitions with configs
 */
export function getAllStudiesWithConfigs(): (StudyDefinition & { config: ProjectConfig })[] {
  return getStudiesSync().map(study => ({
    ...study,
    config: getProjectConfig(study.id),
  }));
}

