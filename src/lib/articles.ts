import { collection, doc, getDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Article } from '@/types/article';

export async function getArticle(slug: string): Promise<Article> {
  const articleRef = doc(db, 'articles', slug);
  const articleSnap = await getDoc(articleRef);

  if (!articleSnap.exists()) {
    throw new Error('Article not found');
  }

  const data = articleSnap.data();
  
  // Transform the data to match our Article type
  return {
    id: articleSnap.id,
    title: data.title,
    author: {
      name: data.metadata?.author || 'Anonymous',
    },
    pubdate: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
    content: data.content || '',
    comments_display: true, // Default to true
    anonymous: false, // Default to false
    who_spoke_to: data.metadata?.tags || [],
    explainBox: {
      enabled: true, // Default to true
      content: data.explanation || '',
    },
  } as Article;
}

export async function getAllArticles(): Promise<Article[]> {
  const articlesRef = collection(db, 'articles');
  const snapshot = await getDocs(articlesRef);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Article[];
} 