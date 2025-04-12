import { collection, query, where, getDocs, doc, getDoc, addDoc, orderBy, Timestamp } from 'firebase/firestore';
import { db } from './firebase';

export type Article = {
  id?: string;
  title: string;
  slug: string;
  content: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  anonymous?: boolean;
  pubdate: string;
  author: Author;
  comments_display: boolean;
  explain_box?: string[];
  metadata?: {
    who_spoke_to?: string[];
    where_written?: string;
    editor?: string;
    corrections?: string;
    version_history?: string;
    category?: string;
    tags?: string[];
  };
};

export type Comment = {
  id?: string;
  content: string;
  createdAt: Date;
  articleId: string;
};

export type Author = {
  id?: string;
  name: string;
  email: string;
  bio?: {
    personal: string;
    basic: string;
  };
  image?: {
    src: string;
    alt: string;
  };
  createdAt?: string;
};

export async function getArticles(): Promise<Article[]> {
  const articlesRef = collection(db, 'articles');
  const q = query(articlesRef, orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Article[];
}

export async function getArticle(id: string): Promise<Article | null> {
  const docRef = doc(db, 'articles', id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Article;
  }
  return null;
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const articlesRef = collection(db, 'articles');
  const q = query(articlesRef, where('slug', '==', slug));
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Article;
  }
  return null;
}

export async function getComments(articleId: string): Promise<Comment[]> {
  const commentsRef = collection(db, 'comments');
  const q = query(commentsRef, where('articleId', '==', articleId), orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Comment[];
}

export async function getAuthors(): Promise<Author[]> {
  const authorsRef = collection(db, 'authors');
  const querySnapshot = await getDocs(authorsRef);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Author[];
} 