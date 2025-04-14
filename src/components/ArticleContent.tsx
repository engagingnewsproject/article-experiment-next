/**
 * ArticleContent component that displays the main content of an article.
 * 
 * This component:
 * - Renders the article header, content, and author bio
 * - Handles explanation box display based on URL parameters
 * - Integrates with Trust Project callout
 * - Manages comments section
 * 
 * @component
 * @param {Object} props - Component props
 * @param {Article} props.article - The article data to display
 * @param {boolean} [props.showExplainBox=false] - Whether to show the explanation box
 * @param {string} [props.explainBoxValue] - The value for the explanation box
 * @param {Comment[]} [props.comments=[]] - Array of comments for the article
 * @returns {JSX.Element} The article content layout
 */
import { Article } from '@/types/article';
import { Comment } from '@/lib/firestore';
import BehindTheStory from '@/components/BehindTheStory';
import TrustProjectCallout from '@/components/TrustProjectCallout';
import { ArticleHeader } from '@/components/ArticleHeader';
import { AuthorBio } from '@/components/AuthorBio';
import { Comments } from '@/components/Comments';
import styles from './ArticleContent.module.css';
import { useSearchParams } from 'next/navigation';

/**
 * Props interface for the ArticleContent component.
 * 
 * @interface ArticleContentProps
 * @property {Article} article - The article data to display
 * @property {boolean} [showExplainBox=false] - Whether to show the explanation box
 * @property {string} [explainBoxValue] - The value for the explanation box
 * @property {Comment[]} [comments=[]] - Array of comments for the article
 */
interface ArticleContentProps {
  article: Article;
  showExplainBox?: boolean;
  explainBoxValue?: string;
  comments?: Comment[];
}

/**
 * Main article content component that orchestrates the display of article elements.
 * 
 * This component:
 * - Renders the article header with title and metadata
 * - Displays the author bio with configurable bio type
 * - Shows article content with optional explanation box
 * - Includes Trust Project callout
 * - Manages the comments section
 * 
 * @param {ArticleContentProps} props - Component props
 * @returns {JSX.Element} The complete article content layout
 */
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
              <BehindTheStory explainBox={article.explain_box} article={article.metadata || {}} />
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