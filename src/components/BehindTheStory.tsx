import React from 'react';
import styles from './BehindTheStory.module.css';

interface BehindTheStoryProps {
  explainBox?: string | string[];
  article: {
    who_spoke_to?: string[];
    where_written?: string;
    editor?: string;
    corrections?: string;
    version_history?: string;
  };
}

const BehindTheStory: React.FC<BehindTheStoryProps> = ({ explainBox, article }) => {
  const explainBoxArray = Array.isArray(explainBox) ? explainBox : explainBox ? [explainBox] : [];
  
  return (
    <section className={styles['behind-the-story']}>
      <h2 className={styles['behind-the-story__title']}>Behind the Story</h2>
      
      {explainBoxArray.length > 0 && (
        <div className={styles['behind-the-story__section']}>
          <h3 className={styles['behind-the-story__section-title']}>Why we wrote this</h3>
          <ul className={styles['behind-the-story__list']}>
            {explainBoxArray.map((item, index) => (
              <li key={index} className={styles['behind-the-story__list-item']}>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {article.who_spoke_to && article.who_spoke_to.length > 0 && (
        <div className={styles['behind-the-story__section']}>
          <h3 className={styles['behind-the-story__section-title']}>Who we spoke to</h3>
          <ul className={styles['behind-the-story__list']}>
            {article.who_spoke_to.map((person, index) => (
              <li key={index} className={styles['behind-the-story__list-item']}>
                {person}
              </li>
            ))}
          </ul>
        </div>
      )}

      {article.where_written && (
        <div className={styles['behind-the-story__section']}>
          <h3 className={styles['behind-the-story__section-title']}>Where this was written</h3>
          <p className={styles['behind-the-story__text']}>{article.where_written}</p>
        </div>
      )}

      {article.editor && (
        <div className={styles['behind-the-story__section']}>
          <h3 className={styles['behind-the-story__section-title']}>Editor</h3>
          <p className={styles['behind-the-story__text']}>{article.editor}</p>
        </div>
      )}

      {article.corrections && (
        <div className={styles['behind-the-story__section']}>
          <h3 className={styles['behind-the-story__section-title']}>Corrections</h3>
          <p className={styles['behind-the-story__text']}>{article.corrections}</p>
        </div>
      )}

      {article.version_history && (
        <div className={styles['behind-the-story__section']}>
          <h3 className={styles['behind-the-story__section-title']}>Version History</h3>
          <p className={styles['behind-the-story__text']}>{article.version_history}</p>
        </div>
      )}
    </section>
  );
};

export default BehindTheStory;
