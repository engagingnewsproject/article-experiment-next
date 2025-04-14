/**
 * BehindTheStory component that displays additional context and metadata about an article.
 * 
 * This component:
 * - Shows the explanation of why the article was written
 * - Lists sources and people interviewed
 * - Displays article metadata (location, editor, corrections, version history)
 * - Provides transparency about the article's creation process
 * 
 * @component
 * @param {Object} props - Component props
 * @param {string|string[]} [props.explainBox] - Explanation of why the article was written
 * @param {Object} props.article - Article metadata
 * @returns {JSX.Element} The behind-the-story section
 */
import React from 'react';
import styles from './BehindTheStory.module.css';

/**
 * Props interface for the BehindTheStory component.
 * 
 * @interface BehindTheStoryProps
 * @property {string|string[]} [explainBox] - Explanation of why the article was written
 * @property {Object} article - Article metadata
 * @property {string[]} [article.who_spoke_to] - List of people interviewed
 * @property {string} [article.where_written] - Location where the article was written
 * @property {string} [article.editor] - Name of the editor
 * @property {string} [article.corrections] - Information about corrections made
 * @property {string} [article.version_history] - History of article versions
 */
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

/**
 * BehindTheStory component that renders additional context about an article.
 * 
 * This component:
 * - Displays the explanation box content if provided
 * - Shows a list of people interviewed
 * - Presents article metadata in organized sections
 * - Uses CSS modules for consistent styling
 * - Conditionally renders sections based on available data
 * 
 * @param {BehindTheStoryProps} props - Component props
 * @returns {JSX.Element} The rendered behind-the-story section
 */
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
