/**
 * Articles utility functions for interacting with Firestore database.
 * 
 * This module:
 * - Provides functions for fetching articles from Firestore
 * - Handles data transformation and type safety
 * - Manages article metadata and content
 * - Includes error handling for missing articles
 * 
 * @module articles
 */

import { collection, doc, getDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Article } from '@/types/article';

/**
 * Fetches a single article by its slug from Firestore.
 * 
 * This function:
 * - Retrieves an article document by slug
 * - Transforms Firestore data to match Article type
 * - Handles missing articles with error
 * - Sets default values for optional fields
 * 
 * @param {string} slug - The unique identifier for the article
 * @returns {Promise<Article>} The article data
 * @throws {Error} When article is not found
 * 
 * @example
 * const article = await getArticle('my-article-slug');
 */
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
    explain_box: data.metadata?.tags || [],
    explainBox: {
      enabled: true, // Default to true
      content: data.explanation || '',
    },
  } as Article;
}

/**
 * Fetches all articles from Firestore.
 * 
 * This function:
 * - Retrieves all article documents
 * - Maps Firestore documents to Article type
 * - Returns an array of articles
 * 
 * @returns {Promise<Article[]>} Array of all articles
 * 
 * @example
 * const articles = await getAllArticles();
 */
export async function getAllArticles(): Promise<Article[]> {
  const articlesRef = collection(db, 'articles');
  const snapshot = await getDocs(articlesRef);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Article[];
} 