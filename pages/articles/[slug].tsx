import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { getArticleBySlug, getArticle, getComments, type Article, type Comment } from '../../lib/firestore';

export default function ArticlePage() {
  const router = useRouter();
  console.log('Router query:', router.query);
  const { slug, explain_box } = router.query;
  const [article, setArticle] = useState<Article | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('Component mounted, slug:', slug);
    const fetchData = async () => {
      if (!slug || typeof slug !== 'string') {
        console.log('Slug is not available or not a string:', slug);
        return;
      }

      try {
        console.log('Fetching article with slug:', slug);
        // First try to get article by ID (for backward compatibility)
        let articleData = await getArticle(slug);
        console.log('Article by ID result:', articleData);
        
        // If not found by ID, try to get by slug
        if (!articleData) {
          console.log('Trying to fetch by slug');
          articleData = await getArticleBySlug(slug);
          console.log('Article by slug result:', articleData);
        }

        if (articleData && articleData.id) {
          const commentsData = await getComments(articleData.id);
          setArticle(articleData);
          if (commentsData) {
            setComments(commentsData);
          }
        }
      } catch (err) {
        console.error('Error fetching article:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug]);

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;
  if (!article) return <div className="p-4">Article not found</div>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <article className="mb-8">
        <h1 className="text-3xl font-bold mb-4">{article.title}</h1>
        <div className="text-gray-600 mb-4">
          By {article.metadata.author} • {article.metadata.category}
        </div>
        
        {explain_box !== 'none' && (
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <h3 className="font-semibold mb-2">Explanation Box</h3>
            <p>This is the explanation box content for {slug}.</p>
          </div>
        )}

        <div className="prose max-w-none">
          {article.content}
        </div>
        <div className="mt-4">
          {article.metadata.tags.map(tag => (
            <span key={tag} className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2">
              {tag}
            </span>
          ))}
        </div>
      </article>

      <section className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Comments</h2>
        {comments.length === 0 ? (
          <p>No comments yet</p>
        ) : (
          <div className="space-y-4">
            {comments.map(comment => (
              <div key={comment.id} className="border rounded-lg p-4">
                <p className="text-gray-700">{comment.content}</p>
                <div className="mt-2 text-sm text-gray-500">
                  Status: {comment.status}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
} 