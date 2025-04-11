import { Article } from '@/types/article';
import BehindTheStory from '@/components/BehindTheStory';
import TrustProjectCallout from '@/components/TrustProjectCallout';
import { ArticleHeader } from '@/components/ArticleHeader';
import styles from './ArticleContent.module.css';

interface ArticleContentProps {
  article: Article;
  showExplainBox?: boolean;
  explainBoxValue?: string;
}

export function ArticleContent({ article, showExplainBox = false, explainBoxValue }: ArticleContentProps) {
  const shouldShowExplainBox = showExplainBox && explainBoxValue !== 'none';

  return (
    <main id="content" className="container" role="main">
      <article className={styles.article}>
        <ArticleHeader article={article} />

        {shouldShowExplainBox ? (
          <div className={styles.articleWrapped}>
            <div className={styles.articleText} dangerouslySetInnerHTML={{ __html: article.content }} />
            <div className={styles.articleExplanation}>
              <BehindTheStory explainBox={article.explain_box} article={article.metadata} />
            </div>
          </div>
        ) : (
          <div dangerouslySetInnerHTML={{ __html: article.content }} />
        )}

        <TrustProjectCallout />
      </article>
    </main>
  );
} 