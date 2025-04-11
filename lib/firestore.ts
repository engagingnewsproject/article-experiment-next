import { db } from './firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  DocumentData,
  QueryDocumentSnapshot
} from 'firebase/firestore';

// Types
export interface Article {
  id?: string;
  title: string;
  content: string;
  slug: string;
  createdAt: typeof Timestamp;
  updatedAt: typeof Timestamp;
  status: 'draft' | 'published';
  metadata: {
    author: string;
    category: string;
    tags: string[];
  };
}

export interface Comment {
  id?: string;
  articleId: string;
  content: string;
  createdAt: typeof Timestamp;
  status: 'pending' | 'approved' | 'rejected';
  metadata: {
    userAgent: string;
    ipAddress: string;
  };
}

// Articles
export const getArticleBySlug = async (slug: string): Promise<Article | null> => {
  console.log('Searching for article with slug:', slug);
  const q = query(collection(db, 'articles'), where('slug', '==', slug));
  const querySnapshot = await getDocs(q);
  console.log('Query results:', querySnapshot.empty ? 'No articles found' : 'Articles found');
  if (querySnapshot.empty) {
    // Log all available slugs for debugging
    const allArticles = await getArticles();
    console.log('Available slugs:', allArticles.map(a => ({ id: a.id, slug: a.slug })));
    return null;
  }
  const doc = querySnapshot.docs[0];
  return { id: doc.id, ...doc.data() } as Article;
};

export const getArticle = async (id: string): Promise<Article | null> => {
  const docRef = doc(db, 'articles', id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as Article;
};

export const getArticles = async (): Promise<Article[]> => {
  const q = query(collection(db, 'articles'), orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({ id: doc.id, ...doc.data() } as Article));
};

// Comments
export const getComments = async (articleId: string): Promise<Comment[]> => {
  const q = query(
    collection(db, 'comments'),
    where('articleId', '==', articleId)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({ id: doc.id, ...doc.data() } as Comment));
}; 