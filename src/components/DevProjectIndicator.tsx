/**
 * Development project indicator component.
 * 
 * Displays a sticky footer showing which Firebase project (dev/prod) 
 * the application is currently connected to. Only visible in development mode.
 * 
 * @component
 */

'use client';

import { useEffect, useState } from 'react';
import styles from './DevProjectIndicator.module.css';

/**
 * Determines if the current environment is local development.
 * 
 * @returns {boolean} True if running on localhost in development mode
 */
function isDevelopment(): boolean {
  if (typeof window === 'undefined') return false;
  const hostname = window.location.hostname;
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

/**
 * Checks if the indicator should be shown.
 * 
 * Only shows when running locally (localhost / 127.0.0.1).
 * Never shows on deployed live sites (article-experiment-next-dev, article-experiment-next).
 * 
 * @param {boolean} isLocal - Whether running on localhost
 * @returns {boolean} True if indicator should be shown
 */
function shouldShow(isLocal: boolean): boolean {
  return isLocal;
}

/**
 * Gets the Firebase project name from the project ID.
 * 
 * @param {string} projectId - The Firebase project ID
 * @returns {string} The project name (dev/prod) or the full project ID
 */
function getProjectName(projectId: string | undefined): string {
  if (!projectId) return 'unknown';
  
  if (projectId.includes('-dev')) {
    return 'DEV';
  }
  
  if (projectId === 'article-experiment-next') {
    return 'PROD';
  }
  
  return projectId;
}

/**
 * Gets the color class based on the project type.
 * 
 * @param {string} projectId - The Firebase project ID
 * @returns {string} CSS class name for the project type
 */
function getProjectColorClass(projectId: string | undefined): string {
  if (!projectId) return styles.unknown;
  
  if (projectId.includes('-dev')) {
    return styles.dev;
  }
  
  if (projectId === 'article-experiment-next') {
    return styles.prod;
  }
  
  return styles.unknown;
}

export function DevProjectIndicator() {
  const [projectId, setProjectId] = useState<string | undefined>(undefined);
  const [isEmulator, setIsEmulator] = useState(false);
  const [shouldDisplay, setShouldDisplay] = useState(false);

  useEffect(() => {
    const local = isDevelopment();

    // Get project ID from environment variable
    const envProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    setProjectId(envProjectId);

    // Check if using emulator (NEXT_PUBLIC_USE_LIVE_FIRESTORE not set or false)
    const useLiveFirestore = process.env.NEXT_PUBLIC_USE_LIVE_FIRESTORE === 'true';
    setIsEmulator(!useLiveFirestore);

    // Only show when running locally (never on deployed live sites)
    setShouldDisplay(shouldShow(local));
  }, []);

  // Don't render if we shouldn't display
  if (!shouldDisplay) {
    return null;
  }

  const projectName = getProjectName(projectId);
  const colorClass = getProjectColorClass(projectId);

  return (
    <div className={`${styles.indicator} ${colorClass}`}>
      <div className={styles.content}>
        <span className={styles.label}>Firebase Project:</span>
        <span className={styles.projectName}>{projectName}</span>
        {projectId && (
          <span className={styles.projectId}>({projectId})</span>
        )}
        {isEmulator && (
          <span className={styles.emulator}>[Emulator]</span>
        )}
      </div>
    </div>
  );
}
