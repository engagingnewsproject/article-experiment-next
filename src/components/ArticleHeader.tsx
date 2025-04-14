/**
 * ArticleHeader component that displays the header section of an article.
 * 
 * This component:
 * - Shows the article title
 * - Displays author information
 * - Provides consistent styling for article headers
 * 
 * @component
 * @param {Object} props - Component props
 * @param {Article} props.article - The article data containing title and author information
 * @returns {JSX.Element} The article header layout
 */
import { Article } from '@/types/article';
import styles from './ArticleHeader.module.css';

/**
 * Props interface for the ArticleHeader component.
 * 
 * @interface ArticleHeaderProps
 * @property {Article} article - The article data containing title and author information
 */
interface ArticleHeaderProps {
  article: Article;
}

/**
 * ArticleHeader component that renders the header section of an article.
 * 
 * This component:
 * - Displays the article title in a prominent position
 * - Shows author information including name and publication
 * - Uses CSS modules for styling
 * - Falls back to 'Staff Reports' if author name is not available
 * 
 * @param {ArticleHeaderProps} props - Component props
 * @returns {JSX.Element} The rendered article header
 */
export function ArticleHeader({ article }: ArticleHeaderProps) {
  return (
    <header className={styles.header}>
      <h2 className={styles.title}>{article.title}</h2>
      <div className={styles.extraHeaderInfo}>
        <div className={styles.author}>
          <p className={styles.author__name}>{article.author?.name || 'Staff Reports'}</p>
          <p className={styles.author__job}>The Gazette Star</p>
        </div>
      </div>
    </header>
  );
} 