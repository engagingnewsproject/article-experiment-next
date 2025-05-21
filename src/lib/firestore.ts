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

import { collection, query, where, getDocs, doc, getDoc, addDoc, orderBy, Timestamp, serverTimestamp, deleteDoc, updateDoc, increment } from 'firebase/firestore';
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
 * @property {Comment[]} [default_comments] - Default comments for the article
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
  default_comments?: Comment[];
};

/**
 * Comment type definition.
 * 
 * @typedef {Object} Comment
 * @property {string} [id] - Unique identifier for the comment
 * @property {string} content - Comment content
 * @property {string} name - Name of the commenter
 * @property {string} [createdAt] - Comment creation timestamp
 * @property {string} [parentId] - ID of the parent comment (for replies)
 * @property {number} upvotes - Number of upvotes on comment
 * @property {number} downvotes - Number of downvotes on comment
 * @property {Comment[]} [replies] - Array of reply comments
 */
export type Comment = {
  id?: string;
  content: string;
  name: string;
  createdAt?: string;
  parentId?: string;
  upvotes?: number;
  downvotes?: number;
  replies?: Comment[];
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
  const commentsRef = collection(db, 'articles', articleId, 'comments');
  const q = query(commentsRef, orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);
  
  // Get all comments and their replies
  const allComments = await Promise.all(querySnapshot.docs.map(async doc => {
    const data = doc.data();
    // Get replies for this comment
    const repliesRef = collection(db, 'articles', articleId, 'comments', doc.id, 'replies');
    const repliesSnapshot = await getDocs(repliesRef);
    const replies = repliesSnapshot.docs.map(replyDoc => {
      const replyData = replyDoc.data();
      return {
        id: replyDoc.id,
        name: replyData.name || 'Anonymous',
        content: replyData.content,
        createdAt: replyData.createdAt instanceof Timestamp 
          ? replyData.createdAt.toDate().toISOString()
          : new Date().toISOString()
      };
    });

    return {
      id: doc.id,
      name: data.name || 'Anonymous',
      content: data.content,
      upvotes: data.upvotes || 0,
      downvotes: data.downvotes || 0,
      createdAt: data.createdAt instanceof Timestamp 
        ? data.createdAt.toDate().toISOString()
        : new Date().toISOString(),
      replies: replies
    };
  }));

  return allComments;
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

/**
 * Saves a new comment to Firestore.
 * 
 * @param {string} articleId - The ID of the article
 * @param {Object} commentData - The comment data to save
 * @param {string} commentData.content - The comment text
 * @param {string} [commentData.name] - The commenter's name (optional for anonymous comments)
 * @param {string} [commentData.email] - The commenter's email (optional for anonymous comments)
 * @param {number} upvotes - The comment's upvote count
 * @param {number} downvotes - The comment's downvote count
 * @param {string} [commentData.parentId] - ID of the parent comment (for replies)
 * @returns {Promise<string>} The ID of the created comment
 */
export async function saveComment(articleId: string, commentData: {
  content: string;
  name?: string;
  email?: string;
  upvotes?: number;
  downvotes?: number;
  parentId?: string;
}): Promise<string> {
  if (commentData.parentId) {
    // Save as a reply in the parent comment's replies subcollection
    const repliesRef = collection(db, 'articles', articleId, 'comments', commentData.parentId, 'replies');
    const reply = {
      content: commentData.content,
      name: commentData.name || 'Anonymous',
      email: commentData.email || null,
      createdAt: serverTimestamp(),
      status: 'pending' // For moderation if needed
    };
    const docRef = await addDoc(repliesRef, reply);
    return docRef.id;
  } else {
    // Save as a top-level comment
    const commentsRef = collection(db, 'articles', articleId, 'comments');
    const comment = {
      content: commentData.content,
      name: commentData.name || 'Anonymous',
      email: commentData.email || null,
      upvotes: commentData.upvotes || 0,
      downvotes: commentData.downvotes || 0,
      createdAt: serverTimestamp(),
      status: 'pending' // For moderation if needed
    };
    const docRef = await addDoc(commentsRef, comment);
    return docRef.id;
  }
}

/**
 * Deletes a comment or reply from Firestore.
 * 
 * @param {string} articleId - The ID of the article
 * @param {string} commentId - The ID of the comment to delete
 * @param {string} [parentId] - Optional ID of the parent comment (if deleting a reply)
 * @returns {Promise<void>}
 */
export async function deleteComment(articleId: string, commentId: string, parentId?: string): Promise<void> {
  try {
    if (parentId) {
      // Delete a reply
      const replyRef = doc(db, 'articles', articleId, 'comments', parentId, 'replies', commentId);
      await deleteDoc(replyRef);
    } else {
      // Delete a comment and all its replies
      const commentRef = doc(db, 'articles', articleId, 'comments', commentId);
      
      // First, delete all replies
      const repliesRef = collection(db, 'articles', articleId, 'comments', commentId, 'replies');
      const repliesSnapshot = await getDocs(repliesRef);
      
      // Delete all replies first
      const deletePromises = repliesSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      
      // Then delete the comment
      await deleteDoc(commentRef);
    }
  } catch (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }
}

/**
 * Updates an article with default comments.
 * 
 * @param {string} articleId - The ID of the article to update
 * @param {Comment[]} defaultComments - Array of default comments to add
 * @returns {Promise<void>}
 */
export async function updateArticleWithDefaultComments(articleId: string, defaultComments: Comment[]): Promise<void> {
  const articleRef = doc(db, 'articles', articleId);
  
  // Convert the comments to include proper timestamps
  const commentsWithTimestamps = defaultComments.map(comment => ({
    ...comment,
    upvotes: comment.upvotes || 0,
    downvotes: comment.downvotes || 0,
    createdAt: Timestamp.fromDate(new Date(comment.createdAt || Date.now())),
    replies: comment.replies?.map(reply => ({
      ...reply,
      createdAt: Timestamp.fromDate(new Date(reply.createdAt || Date.now()))
    }))
  }));

  // Update the article with default comments
  await updateDoc(articleRef, {
    default_comments: commentsWithTimestamps
  });

  // Also create the actual comments in the comments collection
  const commentsRef = collection(db, 'articles', articleId, 'comments');
  
  // Delete any existing comments first
  const existingComments = await getDocs(commentsRef);
  await Promise.all(existingComments.docs.map(doc => deleteDoc(doc.ref)));

  // Create new comments
  await Promise.all(defaultComments.map(async (comment) => {
    const docRef = await addDoc(commentsRef, {
      content: comment.content,
      name: comment.name,
      upvotes: comment.upvotes || 0,
      downvotes: comment.downvotes || 0,
      createdAt: Timestamp.fromDate(new Date(comment.createdAt || Date.now())),
      status: 'approved'
    });

    // Add replies if they exist
    if (comment.replies && comment.replies.length > 0) {
      const repliesRef = collection(db, 'articles', articleId, 'comments', docRef.id, 'replies');
      await Promise.all(comment.replies.map(reply => 
        addDoc(repliesRef, {
          content: reply.content,
          name: reply.name,
          createdAt: Timestamp.fromDate(new Date(reply.createdAt || Date.now())),
          status: 'approved'
        })
      ));
    }
  }));
}

/**
 * Increment upvotes or downvotes for a comment.
 *
 * @param {string} articleId - The ID of the article.
 * @param {string} commentId - The ID of the comment.
 * @param {'upvotes' | 'downvotes'} field - The field to increment.
 * @param {number} value - The value to increment by (positive or negative).
 * @returns {Promise<void>}
 */ 
export async function updateCommentVotes(
  articleId : string,
  commentId : string,
  field: 'upvotes' | 'downvotes',
  value : number
) : Promise<void> {
  const commentRef = doc(db, 'articles', articleId, 'comments', commentId);
  await updateDoc(commentRef, {
    [field]: increment(value)
  });
}

// Example usage:
/*
const defaultComments = [
  {
    content: "This article raises some interesting points about media engagement. I particularly found the discussion about user interaction patterns to be thought-provoking.",
    name: "Research Participant",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    replies: [
      {
        content: "I agree with your point about user interaction patterns. It would be interesting to see more research on this topic.",
        name: "Anonymous User",
        createdAt: new Date(Date.now() - 43200000).toISOString()
      }
    ]
  },
  {
    content: "I appreciate how this piece addresses both the challenges and opportunities in modern media consumption. The examples provided really helped illustrate the key concepts.",
    name: "Anonymous User",
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    replies: []
  },
  {
    content: "As someone studying media, I found this analysis very relevant to current trends. Would love to see more content like this!",
    name: "Media Student",
    createdAt: new Date(Date.now() - 259200000).toISOString(),
    replies: [
      {
        content: "I'm also studying media! What aspects did you find most interesting?",
        name: "Research Participant",
        createdAt: new Date(Date.now() - 216000000).toISOString()
      }
    ]
  }
];

// To use this function:
await updateArticleWithDefaultComments('your-article-id', defaultComments);
*/ 