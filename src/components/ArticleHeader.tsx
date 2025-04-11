import { Article } from '@/types/article';
import styles from './ArticleHeader.module.css';

interface ArticleHeaderProps {
  article: Article;
}

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