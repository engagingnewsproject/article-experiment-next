import { getArticle } from '@/lib/articles';
import { ArticleContent } from '@/components/ArticleContent';
import { ExplainBox } from '@/components/ExplainBox';
import { CommentSection } from '@/components/CommentSection';
import { Metadata } from 'next';

interface ArticlePageProps {
  params: {
    slug: string;
  };
  searchParams: {
    explain_box?: string;
  };
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const article = await getArticle(params.slug);
  return {
    title: article.title,
    description: article.content.substring(0, 160),
  };
}

export default async function ArticlePage({ params, searchParams }: ArticlePageProps) {
  const article = await getArticle(params.slug);
  const explainBoxEnabled = searchParams.explain_box === article.id;

  return (
    <main className="container mx-auto px-4 py-8">
      <ArticleContent article={article} />
      
      {explainBoxEnabled && article.explainBox?.enabled && (
        <ExplainBox content={article.explainBox.content} />
      )}

      {article.comments_display && (
        <CommentSection articleId={article.id} />
      )}
    </main>
  );
} 