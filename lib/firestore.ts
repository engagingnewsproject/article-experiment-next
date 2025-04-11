import { db } from './firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
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

export interface UserInteraction {
  articleId: string;
  type: 'view' | 'comment' | 'share';
  timestamp: typeof Timestamp;
  metadata: {
    userAgent: string;
    ipAddress: string;
    referrer: string;
  };
}

// Helper function to generate slug from title
const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric characters with hyphens
    .replace(/(^-|-$)/g, ''); // Remove leading/trailing hyphens
};

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

export const createArticle = async (article: Omit<Article, 'createdAt' | 'updatedAt'>) => {
  const now = serverTimestamp();
  const articleRef = await addDoc(collection(db, 'articles'), {
    ...article,
    createdAt: now,
    updatedAt: now
  });
  return articleRef.id;
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

export const createComment = async (comment: Omit<Comment, 'createdAt'>) => {
  const commentRef = await addDoc(collection(db, 'comments'), {
    ...comment,
    createdAt: serverTimestamp()
  });
  return commentRef.id;
};

// User Interactions
export const logInteraction = async (interaction: Omit<UserInteraction, 'timestamp'>) => {
  const interactionRef = await addDoc(collection(db, 'userInteractions'), {
    ...interaction,
    timestamp: serverTimestamp()
  });
  return interactionRef.id;
};

// Function to update existing articles with slugs
export const updateArticlesWithSlugs = async (): Promise<void> => {
  const articles = await getArticles();
  
  for (const article of articles) {
    if (!article.slug) {
      const slug = generateSlug(article.title);
      const articleRef = doc(db, 'articles', article.id!);
      await updateDoc(articleRef, { slug });
      console.log(`Updated article "${article.title}" with slug: ${slug}`);
    }
  }
}; 