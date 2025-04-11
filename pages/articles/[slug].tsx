import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { getArticleBySlug, getArticle, getComments, type Article, type Comment } from '../../lib/firestore';
import { useAuthorVariations } from '../../lib/useAuthorVariations';

export default function ArticlePage() {
  const router = useRouter();
  console.log('Router query:', router.query);
  const { slug, explain_box } = router.query;
  const [article, setArticle] = useState<Article | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { authorName, authorBio, authorPhoto, pubdate, siteName } = useAuthorVariations();

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
    <div className="max-w-4xl mx-auto px-4 py-8">
      <article className="prose prose-lg lg:prose-xl">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-4">{article.title}</h1>
          <div className="flex items-center space-x-4 text-gray-600">
            <span>By {authorName}</span>
            <span>•</span>
            <span>{article.metadata.category}</span>
          </div>
        </header>
        
        {explain_box !== 'none' && (
          <div className="bg-blue-50 p-6 rounded-lg mb-8 prose-p:my-0">
            <h3 className="text-xl font-semibold mb-3">Explanation Box</h3>
            <p>This is the explanation box content for {slug}.</p>
          </div>
        )}

        <div className="flex items-center space-x-4 mb-8">
          {authorPhoto && (
            <img
              src={authorPhoto.src}
              alt={authorPhoto.alt}
              className="w-16 h-16 rounded-full"
            />
          )}
          <div>
            <p className="font-semibold">{authorName}</p>
            <p className="text-sm text-gray-600">{pubdate}</p>
          </div>
        </div>

        <div className="mb-8 text-gray-700">
          {authorBio}
        </div>

        <div className="prose prose-lg lg:prose-xl max-w-none">
          <div dangerouslySetInnerHTML={{ __html: article.content }} />
        </div>

        <div className="mt-8 pt-6 border-t">
          <div className="flex flex-wrap gap-2">
            {article.metadata.tags.map(tag => (
              <span 
                key={tag} 
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </article>

      <section className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Comments</h2>
        {comments.length === 0 ? (
          <p className="text-gray-600">No comments yet</p>
        ) : (
          <div className="space-y-6">
            {comments.map(comment => (
              <div key={comment.id} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <p className="text-gray-800">{comment.content}</p>
                <div className="mt-3 text-sm text-gray-500">
                  Status: <span className="font-medium">{comment.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
} 