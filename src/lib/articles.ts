import { db } from './firebase';
import { collection, doc, getDoc } from 'firebase/firestore';
import { Article } from '@/types/article';

export async function getArticle(slug: string): Promise<Article> {
  const articleRef = doc(db, 'articles', slug);
  const articleSnap = await getDoc(articleRef);

  if (!articleSnap.exists()) {
    throw new Error('Article not found');
  }

  return {
    id: articleSnap.id,
    ...articleSnap.data(),
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