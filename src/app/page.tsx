import { getAllArticles } from '@/lib/articles';
import Link from 'next/link';

export default async function Home() {
  const articles = await getAllArticles();

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Article Experiment</h1>
      <ul className="space-y-4">
        {articles.map((article) => (
          <li key={article.id}>
            <div className="space-y-2">
              <Link 
                href={`/articles/${article.id}?explain_box=none`}
                className="text-blue-600 hover:underline"
              >
                {article.title}: No explanation
              </Link>
              <br />
              <Link 
                href={`/articles/${article.id}?explain_box=${article.id}`}
                className="text-blue-600 hover:underline"
              >
                {article.title}: Explanation box
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
