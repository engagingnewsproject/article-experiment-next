/**
 * Project-specific configuration system.
 * 
 * This module:
 * - Defines configuration for different studies/projects
 * - Provides project-specific defaults
 * - Allows for easy extension of new projects
 * - Loads configs from Firestore (with code-defined fallback)
 * 
 * @module projectConfig
 */

import { ArticleConfig } from './config';
import { 
  getProjectConfigFirestore, 
  getAllProjectConfigsFirestore,
  ProjectConfigFirestore 
} from './firestore';

/**
 * Project configuration interface.
 */
export interface ProjectConfig {
  /** Display name of the project */
  name: string;
  /** Site name for this project */
  siteName: string;
  /** Default article configuration */
  articleConfig: ArticleConfig;
  /** Whether this project uses author variations */
  usesAuthorVariations?: boolean;
  /** Whether this project uses explanation boxes */
  usesExplainBox?: boolean;
  /** Whether this project uses comment variations */
  usesCommentVariations?: boolean;
  /** Whether this project uses summaries */
  usesSummaries?: boolean;
}

/**
 * Configuration for Ashwin's study (default/primary study).
 */
const ashwinConfig: ProjectConfig = {
  name: "Evaluating Online News Comments",
  siteName: "The Gazette Star",
  articleConfig: {
    author: {
      name: "Jim Phelps",
      bio: {
        personal: "Jim Phelps is a science reporter for The Gazette Star. His coverage of energy and the environment has appeared in the Dallas Morning News, The Atlantic and Newsweek. A Colorado native and life-long Broncos fan, he began his career at the Denver Post, where he was part of a team that won a Pulitzer Prize for their story about the pollution of popular hot springs in Aspen. He graduated with a journalism degree from Vanderbilt University where he served as the editor-in-chief of the student newspaper. His simple pleasures in life include hiking with his wife and two sons and the smell of barbecue on the lakefront after surviving a cold winter.",
        basic: "Jim Phelps is a science reporter for The Gazette Star. His coverage of energy and the environment has appeared in the Dallas Morning News, The Atlantic and Newsweek. He began his career at the Denver Post, where he was part of a team that won a Pulitzer Prize for their story about the pollution of popular hot springs in Aspen. He graduated with a journalism degree from Vanderbilt University and served as editor-in-chief of the student newspaper."
      },
      image: {
        src: "/images/author-image.jpg",
        alt: "Author Image"
      }
    },
    pubdate: "1 day ago",
    siteName: "The Gazette Star"
  },
  usesAuthorVariations: true,
  usesExplainBox: true,
  usesCommentVariations: false,
  usesSummaries: false
};

/**
 * Map of canonical study IDs to their code-defined configurations.
 * Code-defined configs take precedence over Firestore configs.
 */
const codeProjectConfigs: Record<string, ProjectConfig> = {
  eonc: ashwinConfig,  // Evaluating Online News Comments
};

/**
 * Cached Firestore configs (loaded asynchronously).
 */
let cachedFirestoreConfigs: Record<string, ProjectConfig> | null = null;
let configsLoadPromise: Promise<Record<string, ProjectConfig>> | null = null;

/**
 * Converts a Firestore ProjectConfig to the ProjectConfig interface.
 */
function firestoreConfigToProjectConfig(firestoreConfig: ProjectConfigFirestore): ProjectConfig {
  return {
    name: firestoreConfig.name,
    siteName: firestoreConfig.siteName,
    articleConfig: firestoreConfig.articleConfig,
    usesAuthorVariations: firestoreConfig.usesAuthorVariations,
    usesExplainBox: firestoreConfig.usesExplainBox,
    usesCommentVariations: firestoreConfig.usesCommentVariations,
    usesSummaries: firestoreConfig.usesSummaries,
  };
}

/**
 * Loads study configs from Firestore and caches them.
 * Uses caching to avoid multiple Firestore calls.
 * 
 * @returns Promise resolving to map of studyId -> ProjectConfig
 */
export async function loadProjectConfigs(): Promise<Record<string, ProjectConfig>> {
  // Return cached if available
  if (cachedFirestoreConfigs) {
    return cachedFirestoreConfigs;
  }

  // Return existing promise if already loading
  if (configsLoadPromise) {
    return configsLoadPromise;
  }

  // Load from Firestore
  configsLoadPromise = (async () => {
    try {
      const firestoreConfigs = await getAllProjectConfigsFirestore();
      const configMap: Record<string, ProjectConfig> = {};
      
      firestoreConfigs.forEach(config => {
        configMap[config.studyId] = firestoreConfigToProjectConfig(config);
      });
      
      cachedFirestoreConfigs = configMap;
      return configMap;
    } catch (error) {
      console.warn('Failed to load study configs from Firestore:', error);
      // Return empty map on error (will fall back to code-defined or default)
      cachedFirestoreConfigs = {};
      return {};
    } finally {
      configsLoadPromise = null;
    }
  })();

  return configsLoadPromise;
}

/**
 * Gets study configs synchronously (uses cache or empty).
 * For dynamic loading, use loadProjectConfigs() instead.
 * 
 * @returns Map of studyId -> ProjectConfig (may be incomplete if Firestore hasn't loaded yet)
 */
export function getProjectConfigsSync(): Record<string, ProjectConfig> {
  return cachedFirestoreConfigs || {};
}

/**
 * Clears the study configs cache (useful after adding/updating configs).
 */
export function clearProjectConfigsCache(): void {
  cachedFirestoreConfigs = null;
  configsLoadPromise = null;
}

/**
 * Gets the configuration for a specific study/project.
 * 
 * Priority order:
 * 1. Code-defined configs (highest priority)
 * 2. Firestore configs (if loaded)
 * 3. Default EONC config (fallback)
 * 
 * @param {string} studyId - The canonical study ID (e.g., 'eonc')
 * @returns {ProjectConfig} The project configuration
 */
export function getProjectConfig(studyId: string): ProjectConfig {
  // First, check code-defined configs (highest priority)
  if (codeProjectConfigs[studyId]) {
    return codeProjectConfigs[studyId];
  }
  
  // Then, check Firestore configs (if cached)
  const firestoreConfigs = getProjectConfigsSync();
  if (firestoreConfigs[studyId]) {
    return firestoreConfigs[studyId];
  }
  
  // Finally, fall back to default EONC config
  return ashwinConfig;
}

/**
 * Gets the configuration for a specific study/project (async, loads from Firestore if needed).
 * 
 * @param {string} studyId - The canonical study ID
 * @returns {Promise<ProjectConfig>} The project configuration
 */
export async function getProjectConfigAsync(studyId: string): Promise<ProjectConfig> {
  // First, check code-defined configs (highest priority)
  if (codeProjectConfigs[studyId]) {
    return codeProjectConfigs[studyId];
  }
  
  // Load Firestore configs if not cached
  await loadProjectConfigs();
  const firestoreConfigs = getProjectConfigsSync();
  if (firestoreConfigs[studyId]) {
    return firestoreConfigs[studyId];
  }
  
  // Fall back to default EONC config
  return ashwinConfig;
}

/**
 * Gets all available project configurations (code-defined only, synchronous).
 * For Firestore configs, use loadProjectConfigs() and getProjectConfigsSync().
 * 
 * @returns {Record<string, ProjectConfig>} Map of code-defined study configs
 */
export function getAllProjectConfigs(): Record<string, ProjectConfig> {
  return codeProjectConfigs;
}

