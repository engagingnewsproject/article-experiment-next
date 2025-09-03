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
import { getSessionFromStorage } from '@/lib/auth';
import { Article } from '@/types/article';
import { useEffect, useState } from 'react';
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
const [isAuthenticated, setIsAuthenticated] = useState(false);

useEffect(() => {
  const session = getSessionFromStorage();
  setIsAuthenticated(!!(session && session.isAuthenticated));
}, []);
  return (
    <header className={styles.header}>
      <div className="flex items-center justify-center gap-4">
        <h2 className={styles.title}>{article.title}</h2>
      </div>
      <p className={styles.author__job}>The Gazette Star</p>
      {isAuthenticated && article.id && (
        <a
          href={`/admin/edit-article/${article.id}`}
          className="inline-block px-3 py-1 text-sm text-white transition-colors bg-yellow-500 border border-yellow-600 rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          style={{ minWidth: '80px', textAlign: 'center', color: 'white' }}
        >
          Edit Article
        </a>
      )}
    </header>
  );
}