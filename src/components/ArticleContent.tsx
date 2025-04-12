import { Article } from '@/types/article';
import { Comment } from '@/lib/firestore';
import BehindTheStory from '@/components/BehindTheStory';
import TrustProjectCallout from '@/components/TrustProjectCallout';
import { ArticleHeader } from '@/components/ArticleHeader';
import { AuthorBio } from '@/components/AuthorBio';
import { Comments } from '@/components/Comments';
import styles from './ArticleContent.module.css';
import { useSearchParams } from 'next/navigation';

interface ArticleContentProps {
  article: Article;
  showExplainBox?: boolean;
  explainBoxValue?: string;
  comments?: Comment[];
}

export function ArticleContent({ article, showExplainBox = false, explainBoxValue, comments = [] }: ArticleContentProps) {
  const searchParams = useSearchParams();
  const author_bio = searchParams?.get('author_bio') || 'basic';
  const shouldShowExplainBox = showExplainBox && explainBoxValue !== 'none';

  return (
    <main id="content" className="container" role="main">
      <article className={styles.article}>
        <ArticleHeader article={article} />
        
        <AuthorBio 
          author={{
            name: article.author.name,
            bio: { 
              personal: article.author.bio?.personal || '',
              basic: article.author.bio?.basic || ''
            },
            image: article.author.photo ? { src: article.author.photo, alt: article.author.name } : undefined
          }} 
          bioType={author_bio as 'personal' | 'basic'} 
        />

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
        
        <Comments 
          comments={comments.map(comment => ({
            id: comment.id || '',
            name: 'Anonymous', // or get from user data if available
            content: comment.content,
            timestamp: comment.createdAt.toISOString()
          }))} 
          anonymous={article.anonymous || false} 
          identifier={article.id || ''} 
        />
      </article>
    </main>
  );
} 