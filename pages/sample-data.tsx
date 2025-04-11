import { useEffect, useState } from 'react';
import { getArticle, getComments, type Article, type Comment } from '../lib/firestore';

export default function SampleData() {
  const [article, setArticle] = useState<Article | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get the article ID from the URL or use the one we just created
        const articleId = 'gacYTE8kdckSvrsZe0oV'; // Replace with dynamic ID if needed
        const articleData = await getArticle(articleId);
        const commentsData = await getComments(articleId);

        setArticle(articleData);
        setComments(commentsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;
  if (!article) return <div className="p-4">No article found</div>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <article className="mb-8">
        <h1 className="text-3xl font-bold mb-4">{article.title}</h1>
        <div className="text-gray-600 mb-4">
          By {article.metadata.author} • {article.metadata.category}
        </div>
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