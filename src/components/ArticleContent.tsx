import { Article } from '@/types/article';

interface ArticleContentProps {
  article: Article;
}

export function ArticleContent({ article }: ArticleContentProps) {
  return (
    <article className="prose lg:prose-xl max-w-none">
      <h1>{article.title}</h1>
      
      {article.author && (
        <div className="flex items-center gap-4 mb-4">
          {article.author.photo && (
            <img 
              src={article.author.photo} 
              alt={article.author.name}
              className="w-12 h-12 rounded-full"
            />
          )}
          <div>
            <p className="font-bold">{article.author.name}</p>
            {article.author.bio && (
              <p className="text-sm text-gray-600">{article.author.bio}</p>
            )}
          </div>
        </div>
      )}

      <div className="text-sm text-gray-500 mb-8">
        Published on {new Date(article.pubdate).toLocaleDateString()}
      </div>

      {article.featuredImage && (
        <img 
          src={article.featuredImage} 
          alt={article.title}
          className="w-full h-auto mb-8"
        />
      )}

      <div 
        className="article-content"
        dangerouslySetInnerHTML={{ __html: article.content }}
      />

      {article.who_spoke_to && (
        <section className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h2 className="text-lg font-bold mb-2">Who We Spoke To</h2>
          <ul className="list-disc list-inside">
            {article.who_spoke_to.map((person, index) => (
              <li key={index}>{person}</li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
} 