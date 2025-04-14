/**
 * Footer component that displays copyright information and legal notices.
 * 
 * This component:
 * - Shows copyright information with the current year
 * - Displays legal notices about content usage
 * - Uses CSS modules for consistent styling
 * - Provides a consistent footer across all pages
 * 
 * @component
 * @returns {JSX.Element} The footer section
 */
import React from 'react';
import styles from './Footer.module.css';

/**
 * Footer component that renders the application's footer section.
 * 
 * This component:
 * - Dynamically updates the copyright year
 * - Displays legal notices about content usage
 * - Uses CSS modules for styling
 * - Maintains consistent layout across the application
 * 
 * @returns {JSX.Element} The rendered footer section
 */
export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.row}>
        <p className={styles.copyright}>
          This material may not be published, broadcast, rewritten, or redistributed.
          <br />
          &copy; {currentYear} The Gazette Star, LLC. All Rights Reserved.
        </p>
      </div>
    </footer>
  );
}; 