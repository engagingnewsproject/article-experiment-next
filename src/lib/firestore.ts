/**
 * Firestore database operations and type definitions.
 * 
 * This module:
 * - Defines data types for articles, comments, and authors
 * - Provides CRUD operations for Firestore collections
 * - Handles data retrieval and transformation
 * - Manages relationships between collections
 * 
 * @module firestore
 */

import { collection, query, where, getDocs, doc, getDoc, addDoc, orderBy, Timestamp } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Article type definition.
 * 
 * @typedef {Object} Article
 * @property {string} [id] - Unique identifier for the article
 * @property {string} title - Article title
 * @property {string} slug - URL-friendly article identifier
 * @property {string} content - Article content
 * @property {Timestamp} [createdAt] - Article creation timestamp
 * @property {Timestamp} [updatedAt] - Article last update timestamp
 * @property {boolean} [anonymous] - Whether the article is anonymous
 * @property {string} pubdate - Publication date
 * @property {Author} author - Article author information
 * @property {boolean} comments_display - Whether to display comments
 * @property {string[]} [explain_box] - Explanation box content
 * @property {Object} [metadata] - Additional article metadata
 */
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

/**
 * Comment type definition.
 * 
 * @typedef {Object} Comment
 * @property {string} [id] - Unique identifier for the comment
 * @property {string} content - Comment content
 * @property {Date} createdAt - Comment creation date
 * @property {string} articleId - ID of the associated article
 */
export type Comment = {
  id?: string;
  content: string;
  createdAt: Date;
  articleId: string;
};

/**
 * Author type definition.
 * 
 * @typedef {Object} Author
 * @property {string} [id] - Unique identifier for the author
 * @property {string} name - Author's name
 * @property {string} email - Author's email
 * @property {Object} [bio] - Author biography
 * @property {string} bio.personal - Personal biography
 * @property {string} bio.basic - Basic biography
 * @property {Object} [image] - Author image information
 * @property {string} image.src - Image source URL
 * @property {string} image.alt - Image alt text
 * @property {string} [createdAt] - Author creation date
 */
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

/**
 * Retrieves all articles from Firestore.
 * 
 * @returns {Promise<Article[]>} Array of articles
 * @throws {Error} If database operation fails
 */
export async function getArticles(): Promise<Article[]> {
  const articlesRef = collection(db, 'articles');
  const q = query(articlesRef, orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Article[];
}

/**
 * Retrieves a single article by ID.
 * 
 * @param {string} id - Article ID
 * @returns {Promise<Article | null>} The article or null if not found
 * @throws {Error} If database operation fails
 */
export async function getArticle(id: string): Promise<Article | null> {
  const docRef = doc(db, 'articles', id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Article;
  }
  return null;
}

/**
 * Retrieves an article by its slug.
 * 
 * @param {string} slug - Article slug
 * @returns {Promise<Article | null>} The article or null if not found
 * @throws {Error} If database operation fails
 */
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

/**
 * Retrieves comments for a specific article.
 * 
 * @param {string} articleId - ID of the article
 * @returns {Promise<Comment[]>} Array of comments
 * @throws {Error} If database operation fails
 */
export async function getComments(articleId: string): Promise<Comment[]> {
  const commentsRef = collection(db, 'comments');
  const q = query(commentsRef, where('articleId', '==', articleId), orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Comment[];
}

/**
 * Retrieves all authors from Firestore.
 * 
 * @returns {Promise<Author[]>} Array of authors
 * @throws {Error} If database operation fails
 */
export async function getAuthors(): Promise<Author[]> {
  const authorsRef = collection(db, 'authors');
  const querySnapshot = await getDocs(authorsRef);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Author[];
} 