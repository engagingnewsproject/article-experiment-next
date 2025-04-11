import React from 'react';
import styles from './Footer.module.css';

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