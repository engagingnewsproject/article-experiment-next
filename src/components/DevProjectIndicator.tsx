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
import { usePathname } from 'next/navigation';
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
 * Checks if the current path should show the indicator.
 * 
 * Only shows on:
 * - Development (localhost)
 * - Admin pages (if somehow on live site)
 * 
 * Never shows on:
 * - Article pages (/articles/*)
 * - Public pages on live sites
 * 
 * @param {string} pathname - Current pathname
 * @param {boolean} isDev - Whether in development mode
 * @returns {boolean} True if indicator should be shown
 */
function shouldShow(pathname: string, isDev: boolean): boolean {
  // Always show in development
  if (isDev) return true;
  
  // On live sites, only show on admin pages
  // Never show on article pages
  if (pathname.startsWith('/articles/')) {
    return false;
  }
  
  // Only show on admin pages for live sites
  return pathname.startsWith('/admin');
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
  const pathname = usePathname();
  const [isDev, setIsDev] = useState(false);
  const [projectId, setProjectId] = useState<string | undefined>(undefined);
  const [isEmulator, setIsEmulator] = useState(false);
  const [shouldDisplay, setShouldDisplay] = useState(false);

  useEffect(() => {
    const dev = isDevelopment();
    setIsDev(dev);
    
    // Get project ID from environment variable
    const envProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    setProjectId(envProjectId);

    // Check if using emulator (NEXT_PUBLIC_USE_LIVE_FIRESTORE not set or false)
    const useLiveFirestore = process.env.NEXT_PUBLIC_USE_LIVE_FIRESTORE === 'true';
    setIsEmulator(!useLiveFirestore);
    
    // Determine if we should show the indicator
    setShouldDisplay(shouldShow(pathname, dev));
  }, [pathname]);

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
