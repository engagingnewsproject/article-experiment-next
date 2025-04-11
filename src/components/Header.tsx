import React from 'react';
import styles from './Header.module.css';

export const Header: React.FC = () => {
  return (
    <header className={`container container--wide ${styles.header}`} role="banner">
      <div className={styles.siteTitle}>The Gazette Star</div>
    </header>
  );
}; 