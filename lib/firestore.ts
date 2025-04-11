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
  QueryDocumentSnapshot,
  addDoc
} from 'firebase/firestore';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';

// Import consolidated interfaces
import { Article, Comment, Author } from '@/types/article'; // Adjust the path as necessary

// Articles
export const getArticleBySlug = async (slug: string): Promise<Article | null> => {
  // console.log('Searching for article with slug:', slug);
  const q = query(collection(db, 'articles'), where('slug', '==', slug));
  const querySnapshot = await getDocs(q);
  // console.log('Query results:', querySnapshot.empty ? 'No articles found' : 'Articles found');
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

export const getAuthors = async (): Promise<Author[]> => {
  console.log('Starting to fetch authors...');
  try {
    const authorsRef = collection(db, 'authors');
    const q = query(authorsRef);
    const querySnapshot = await getDocs(q);
    
    console.log('Firestore query completed');
    console.log('Snapshot empty?', querySnapshot.empty);
    console.log('Snapshot size:', querySnapshot.size);
    
    const authors = querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
      const data = doc.data();
      console.log('Processing doc:', doc.id, 'with data:', data);
      
      return {
        id: doc.id,
        name: data.name || '',
        bio: {
          personal: data.bio.personal || '',
          basic: data.bio.basic || ''
        },
        image: {
          src: data.image || '/images/author-image.jpg',
          alt: `${data.name || 'Author'} profile picture`
        },
        createdAt: data.pubDate || Timestamp.now(),
        updatedAt: data.pubDate || Timestamp.now()
      } as Author;
    });
    
    console.log('Mapped authors:', authors);
    return authors;
  } catch (error) {
    console.error('Error in getAuthors:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
    }
    throw error;
  }
};

export const createTestAuthor = async () => {
  try {
    const authorData = {
      name: 'Test Author',
      bio: 'This is a test author bio',
      image: '/images/authors/test-author.jpg',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    const docRef = await addDoc(collection(db, 'authors'), authorData);
    console.log('Test author created with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating test author:', error);
    throw error;
  }
}; 