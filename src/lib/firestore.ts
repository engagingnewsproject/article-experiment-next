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

import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, increment, orderBy, query, serverTimestamp, setDoc, Timestamp, updateDoc, where } from 'firebase/firestore';
import { db } from './firebase';
import { DEFAULT_STUDY_ID } from './studies';

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
 * @property {ArticleThemes[]} [themes] - Themes for the article
 * @property {string} [summary] - Comment Summary for the article
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
  themes?: ArticleTheme[];
  summary?: string;
  /** Study/Project identifier (e.g., 'ashwin', 'gazette') */
  studyId?: string;
  /** Site name from project config (e.g., 'The Gazette Star') */
  siteName?: string;
};

/**
 * Comment type definition.
 * 
 * @typedef {Object} Comment
 * @property {string} [id] - Unique identifier for the comment
 * @property {string} content - Comment content
 * @property {string} name - Name of the commenter
 * @property {string} [datePosted] - Comment date posted
 * @property {string} [createdAt] - Comment creation timestamp
* @property {string} [parentId] - ID of the parent comment (for replies)
 * @property {string[]} [ancestorIds] - IDs of all ancestor comments (for replies)
 * @property {number} upvotes - Number of upvotes on comment
 * @property {number} downvotes - Number of downvotes on comment
 * @property {Comment[]} [replies] - Array of reply comments
 */
export type Comment = {
  id?: string;
  content: string;
  name: string;
  datePosted?: string;
  createdAt?: string;
  parentId?: string;
  ancestorIds?: string[];
  upvotes?: number;
  downvotes?: number;
  replies?: Comment[];
  qualtricsResponseId?: string;
};

/**
 * Article Theme
 * 
 * @typedef {Object} ArticleTheme
 * @property {string} content - Article's theme content
 */
export type ArticleTheme = {
  label: string;
  content: string;
}

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
  // email: string;
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
 * Gets aliases for a canonical study ID (for backward compatibility).
 * 
 * @param {string} canonicalId - The canonical study ID
 * @returns {string[]} Array of IDs to check (canonical + aliases)
 */
import { getStudyAliases } from './studies';

function getStudyIdAliases(canonicalId: string): string[] {
  return getStudyAliases(canonicalId);
}

/**
 * Retrieves all articles from Firestore, optionally filtered by study ID.
 * 
 * Handles backward compatibility by checking both canonical IDs and aliases.
 * 
 * @param {string} [studyId] - Optional canonical study ID to filter articles (e.g., 'eonc', 'msc')
 * @returns {Promise<Article[]>} Array of articles, sorted by createdAt descending
 * @throws {Error} If database operation fails
 */
export async function getArticles(studyId?: string): Promise<Article[]> {
  const articlesRef = collection(db, 'articles');
  
  // If no studyId, get all articles
  if (!studyId) {
    const q = query(articlesRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Article[];
  }
  
  // Get all aliases for this study ID (for backward compatibility)
  const idsToCheck = getStudyIdAliases(studyId);
  
  // Check if we're querying for the default study (for backward compatibility with old articles)
  const isDefaultStudy = studyId === DEFAULT_STUDY_ID || idsToCheck.includes(DEFAULT_STUDY_ID);
  
  // For backward compatibility: if querying default study, also include articles without studyId
  // Firestore can't query for "field doesn't exist", so we need to get all and filter
  let articles: Article[] = [];
  
  if (isDefaultStudy) {
    // Get all articles and filter in memory (for backward compatibility with old articles)
    const allArticlesSnapshot = await getDocs(articlesRef);
    articles = allArticlesSnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Article[];
    
    // Filter: include articles with matching studyId OR articles without studyId (legacy)
    articles = articles.filter(article => {
      const articleStudyId = (article as any).studyId;
      return !articleStudyId || idsToCheck.includes(articleStudyId);
    });
  } else {
    // For non-default studies, only get articles with matching studyId
    const q = query(articlesRef, where('studyId', 'in', idsToCheck));
    const querySnapshot = await getDocs(q);
    articles = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Article[];
  }
  
  // Sort by createdAt (newest first)
  articles.sort((a, b) => {
    const getTime = (timestamp: any): number => {
      if (!timestamp) return 0;
      if (timestamp.toMillis) return timestamp.toMillis();
      if (timestamp.toDate) return timestamp.toDate().getTime();
      if (timestamp instanceof Date) return timestamp.getTime();
      if (typeof timestamp === 'string' || typeof timestamp === 'number') {
        return new Date(timestamp).getTime();
      }
      return 0;
    };
    const aTime = getTime(a.createdAt);
    const bTime = getTime(b.createdAt);
    return bTime - aTime; // Descending order
  });
  
  return articles;
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
 * Retrieves an article by its slug, optionally filtered by study ID.
 * 
 * Handles backward compatibility by checking both canonical IDs and aliases.
 * 
 * @param {string} slug - Article slug
 * @param {string} [studyId] - Optional canonical study ID to filter articles (e.g., 'eonc', 'msc')
 * @returns {Promise<Article | null>} The article or null if not found
 * @throws {Error} If database operation fails
 */
export async function getArticleBySlug(slug: string, studyId?: string): Promise<Article | null> {
  const articlesRef = collection(db, 'articles');
  
  if (!studyId) {
    // No study filter - just get by slug
    const q = query(articlesRef, where('slug', '==', slug));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as Article;
    }
    return null;
  }
  
  // Get all aliases for this study ID (for backward compatibility)
  const idsToCheck = getStudyIdAliases(studyId);
  
  // Always include the raw studyId in the check (even if not in validated list)
  // This handles cases where studyId might exist in database but isn't validated yet
  if (!idsToCheck.includes(studyId.toLowerCase())) {
    idsToCheck.push(studyId.toLowerCase());
  }
  
  // Check if we're querying for the default study (for backward compatibility with old articles)
  const isDefaultStudy = studyId === DEFAULT_STUDY_ID || idsToCheck.includes(DEFAULT_STUDY_ID);
  
  // Query by slug first (no index needed), then filter by studyId in memory
  const q = query(articlesRef, where('slug', '==', slug));
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) {
    return null;
  }
  
  // Filter by studyId aliases in memory (for backward compatibility)
  // Also include articles without studyId if querying for default study
  for (const doc of querySnapshot.docs) {
    const data = doc.data();
    const articleStudyId = data.studyId;
    
    // Match if:
    // 1. studyId matches any of the aliases (case-insensitive), OR
    // 2. article has no studyId AND we're querying for the default study (backward compatibility)
    if (articleStudyId && idsToCheck.includes(articleStudyId.toLowerCase())) {
      return { id: doc.id, ...data } as Article;
    }
    if (!articleStudyId && isDefaultStudy) {
      return { id: doc.id, ...data } as Article;
    }
  }
  
  return null;
}

/**
 * Retrieves default comments for a specific article.
 * 
 * Only fetches default comments from the article's default_comments field.
 * User-submitted comments are not included - they are handled separately
 * in client-side state for session-only display.
 * 
 * @param {string} articleId - ID of the article
 * @returns {Promise<Comment[]>} Array of default comments only
 * @throws {Error} If database operation fails
 */
export async function getComments(articleId: string): Promise<Comment[]> {
  const comments: Comment[] = [];
  
  if (!articleId) {
    return [];
  }
  
  // Get default comments from the article document only
  const articleRef = doc(db, 'articles', articleId);
  const articleSnap = await getDoc(articleRef);
  
  if (!articleSnap.exists()) {
    return [];
  }
  
  const articleData = articleSnap.data();
  
  if (articleData?.default_comments) {
    if (Array.isArray(articleData.default_comments)) {
      // Comments are in an array
      articleData.default_comments.forEach((comment: any, index: number) => {
        comments.push({
          id: comment.id || `default_${index}`,
          content: comment.content || '',
          name: comment.name || 'Anonymous',
          datePosted: comment.datePosted || 'Recently',
          createdAt: comment.createdAt,
          upvotes: comment.upvotes || 0,
          downvotes: comment.downvotes || 0,
          replies: comment.replies || [],
        } as Comment);
      });
    } else if (typeof articleData.default_comments === 'object') {
      // Comments might be stored as an object/map with numeric keys
      Object.entries(articleData.default_comments).forEach(([key, comment]: [string, any]) => {
        comments.push({
          id: comment.id || key,
          content: comment.content || '',
          name: comment.name || 'Anonymous',
          datePosted: comment.datePosted || 'Recently',
          createdAt: comment.createdAt,
          upvotes: comment.upvotes || 0,
          downvotes: comment.downvotes || 0,
          replies: comment.replies || [],
        } as Comment);
      });
    }
  }
  
  // NOTE: User-submitted comments from subcollection are NOT fetched here.
  // They are saved to Firebase for research data but only shown in the current
  // session via client-side state management. Each page load resets to defaults.
  
  return comments;
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
 * @param {string} [commentData.grandParentId] - ID of the grandparent comment (for replies to replies)
 * @returns {Promise<string>} The ID of the created comment
 */
export async function saveComment(articleId: string, commentData: {
  content: string;
  name?: string;
  // email?: string;
  upvotes?: number;
  downvotes?: number;
  ancestorIds?: string[];
  qualtricsResponseId?: string;
}): Promise<string> {
  let commentsPath = ['articles', articleId, 'comments'];
  if (commentData.ancestorIds && commentData.ancestorIds.length > 0) {
      commentData.ancestorIds.forEach(id => {
        commentsPath.push(id, 'replies');
      });

      const repliesRef = collection(db, ...commentsPath as [string, ...string[]]);

      const reply = {
        content: commentData.content,
        name: commentData.name || 'Anonymous',
        upvotes: commentData.upvotes || 0,
        downvotes: commentData.downvotes || 0,
        ancestorIds: commentData.ancestorIds,
        datePosted: "Just now",
        createdAt: serverTimestamp(),
        ...(commentData.qualtricsResponseId && { qualtricsResponseId: commentData.qualtricsResponseId })
      };

      const docRef = await addDoc(repliesRef, reply);
      // Debugging purposes
      // await updateDoc(docRef, {parentId: commentData.parentId})
      return docRef.id;
    } else {
      // Save as a top-level comment
      const commentsRef = collection(db, 'articles', articleId, 'comments');
      const comment = {
        content: commentData.content,
        name: commentData.name || 'Anonymous',
        upvotes: commentData.upvotes || 0,
        downvotes: commentData.downvotes || 0,
        datePosted: "Just now",
        createdAt: serverTimestamp(),
        ...(commentData.qualtricsResponseId && { qualtricsResponseId: commentData.qualtricsResponseId })
      };
      const docRef = await addDoc(commentsRef, comment);
      // Debugging purposes
      // await updateDoc(docRef, {id: docRef.id})
      return docRef.id;
  }
}

/**
 * Deletes a comment or reply from Firestore.
 * 
 * @param {string} articleId - The ID of the article
 * @param {string} commentId - The ID of the comment to delete
 * @param {string} [parentId] - Optional ID of the parent comment (if deleting a reply)
 * @param {string} [grandParentId] - Optional ID of the top-level comment (if deleting a subReply)
 * @returns {Promise<void>}
 */
export async function deleteComment(articleId: string, commentId: string, parentId?: string, grandParentId?: string): Promise<void> {  
  try {
    const commentsPath = `articles/${articleId}/comments`;

    if (grandParentId && parentId) {
      // Delete a subReply
      const subReplyRef = doc(db, commentsPath, grandParentId, 'replies', parentId, 'replies', commentId);
      await deleteDoc(subReplyRef);
    }
    else if (parentId) {
      // Delete a reply
      const replyRef = doc(db, commentsPath, parentId, 'replies', commentId);
      
      // First, delete all subReplies
      const subRepliesRef = collection(db, commentsPath, parentId, 'replies', commentId, 'replies')
      const subRepliesSnapshot = await getDocs(subRepliesRef);
      const deletePromises = subRepliesSnapshot.docs.map(async doc => deleteDoc(doc.ref))

      await Promise.all(deletePromises);
      
      // Then delete the reply
      await deleteDoc(replyRef);
    } else {
      // Delete a comment and all its replies
      const commentRef = doc(db, commentsPath, commentId);
      
      // Delete all replies
      const repliesRef = collection(db, commentsPath, commentId, 'replies');
      const repliesSnapshot = await getDocs(repliesRef);
      
      const deletePromises = repliesSnapshot.docs.map(async doc => {
        // First, delete all subReplies
        const subRepliesRef = collection(db, commentsPath, commentId, 'replies', doc.id, 'replies')
        const subRepliesSnapshot = await getDocs(subRepliesRef);
        await Promise.all(subRepliesSnapshot.docs.map(async subDoc => deleteDoc(subDoc.ref)));
        deleteDoc(doc.ref)
      });
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
  const commentsWithTimestamps = defaultComments.map((comment, commentIndex) => ({
    ...comment,
    id: `default_${commentIndex}`,
    name: comment.name,
    upvotes: comment.upvotes || 0,
    downvotes: comment.downvotes || 0,
    datePosted: comment.datePosted || "1 day ago",
    createdAt: Timestamp.fromDate(new Date(comment.createdAt || Date.now())),
    replies: comment.replies?.map((reply, replyIndex) => ({
      ...reply,
      parentId: comment.id || `default_${commentIndex}`,
      id: `default_${commentIndex}_${replyIndex}`,
      upvotes: reply.upvotes || 0,
      downvotes: reply.downvotes || 0,
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

  // // Create new comments
  // await Promise.all(defaultComments.map(async (comment) => {
  //   const docRef = doc(commentsRef);
  //   await setDoc(docRef, {
  //     content: comment.content,
  //     name: comment.name,
  //     upvotes: comment.upvotes || 0,
  //     downvotes: comment.downvotes || 0,
  //     createdAt: Timestamp.fromDate(new Date(comment.createdAt || Date.now()))
  //   });

  //   // Add replies if they exist
  //   if (comment.replies && comment.replies.length > 0) {
  //     const repliesRef = collection(db, 'articles', articleId, 'comments', docRef.id, 'replies');
  //     await Promise.all(comment.replies.map(reply => 
  //       addDoc(repliesRef, {
  //         content: reply.content,
  //         name: reply.name,
  //         upvotes: comment.upvotes || 0,
  //         downvotes: comment.downvotes || 0,
  //         createdAt: Timestamp.fromDate(new Date(reply.createdAt || Date.now()))
  //       })
  //     ));
  //   }

  // }));
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
/**
 * Updates vote counts for a comment in Firestore.
 * 
 * Note: Votes on default comments (ID starts with "default_") are not saved to the comment document,
 * but vote actions are still logged to Firebase for research purposes via the logger.
 * 
 * This function saves vote data to Firebase for research, but votes on default comments
 * won't affect the displayed vote counts on future page loads (which always show defaults).
 * 
 * @param articleId - The article ID
 * @param commentId - The comment ID (default comments are skipped)
 * @param field - 'upvotes' or 'downvotes'
 * @param value - The increment value (typically 1 or -1)
 * @param ancestorIds - Optional array of ancestor comment IDs for nested replies
 */
export async function updateCommentVotes(
  articleId: string,
  commentId: string,
  field: 'upvotes' | 'downvotes',
  value: number,
  ancestorIds?: string[]
): Promise<void> {
  // Skip updating default comments (they are immutable baselines)
  // Vote actions are still logged for research via the logger in CommentVoteSection
  if (commentId.startsWith("default_")) return;

  let commentsPath = ['articles', articleId, 'comments'];

  if (ancestorIds && ancestorIds.length > 0) {
    ancestorIds.forEach(id => commentsPath.push(id, 'replies'));
  }
  commentsPath.push(commentId);

  const commentRef = doc(db, ...commentsPath as [string, ...string[]]);

  // Update vote count in user-submitted comment (for data collection)
  // Note: These votes won't be displayed on future page loads since we only load defaults
  const commentSnap = await getDoc(commentRef);
  if (!commentSnap.exists()) return;
  await updateDoc(commentRef, {
    [field]: increment(value)
  });

}

/**
 * Normalizes comment dates by converting Firestore Timestamp objects to ISO strings.
 * 
 * @param {Comment[]} comments - Array of comments to normalize
 * @returns {Comment[]} - Array of comments with normalized dates
 */
export function normalizeCommentDates(comments: Comment[]): Comment[] {
  return comments.map(comment => ({
    ...comment,
    createdAt: comment.createdAt && typeof comment.createdAt === 'object' && 'toDate' in comment.createdAt
      ? (comment.createdAt as Timestamp).toDate().toLocaleString()
      : (typeof comment.createdAt === 'string' ? new Date(comment.createdAt).toLocaleString() : undefined),
    replies: comment.replies ? normalizeCommentDates(comment.replies) : [],
  }));
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

/**
 * Study type definition for Firestore.
 */
export type Study = {
  id: string;
  name: string;
  aliases?: string[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

/**
 * Gets all studies from Firestore.
 * 
 * @returns Array of all studies
 */
export async function getStudies(): Promise<Study[]> {
  const studiesRef = collection(db, 'studies');
  const querySnapshot = await getDocs(query(studiesRef, orderBy('createdAt', 'desc')));
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Study[];
}

/**
 * Gets a study by ID from Firestore.
 * 
 * @param studyId - The study ID
 * @returns The study, or null if not found
 */
export async function getStudy(studyId: string): Promise<Study | null> {
  const studyRef = doc(db, 'studies', studyId);
  const studySnap = await getDoc(studyRef);
  if (!studySnap.exists()) {
    return null;
  }
  return {
    id: studySnap.id,
    ...studySnap.data()
  } as Study;
}

/**
 * Creates or updates a study in Firestore.
 * 
 * @param study - The study data
 * @returns The study ID
 */
export async function saveStudy(study: Omit<Study, 'createdAt' | 'updatedAt'>): Promise<string> {
  const studyRef = doc(db, 'studies', study.id);
  const existingStudy = await getStudy(study.id);
  
  const studyData: Partial<Study> = {
    id: study.id,
    name: study.name,
    updatedAt: serverTimestamp() as Timestamp,
  };
  
  // Only include aliases if they exist and have values (Firebase doesn't accept undefined)
  if (study.aliases && study.aliases.length > 0) {
    studyData.aliases = study.aliases;
  }
  
  if (!existingStudy) {
    studyData.createdAt = serverTimestamp() as Timestamp;
  }
  
  await setDoc(studyRef, studyData, { merge: true });
  return study.id;
}

/**
 * Deletes a study from Firestore.
 * 
 * @param studyId - The study ID to delete
 */
export async function deleteStudy(studyId: string): Promise<void> {
  const studyRef = doc(db, 'studies', studyId);
  await deleteDoc(studyRef);
}

/**
 * ProjectConfig type definition for Firestore.
 * This matches the ProjectConfig interface from projectConfig.ts
 */
export type ProjectConfigFirestore = {
  studyId: string; // The study ID this config belongs to
  name: string;
  siteName: string;
  articleConfig: {
    author: {
      name: string;
      bio: {
        personal: string;
        basic: string;
      };
      image: {
        src: string;
        alt: string;
      };
    };
    pubdate: string;
    siteName: string;
  };
  usesAuthorVariations?: boolean;
  usesExplainBox?: boolean;
  usesCommentVariations?: boolean;
  usesSummaries?: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

/**
 * Gets a project config by study ID from Firestore.
 * 
 * @param studyId - The study ID
 * @returns The project config, or null if not found
 */
export async function getProjectConfigFirestore(studyId: string): Promise<ProjectConfigFirestore | null> {
  const configRef = doc(db, 'projectConfigs', studyId);
  const configSnap = await getDoc(configRef);
  if (!configSnap.exists()) {
    return null;
  }
  return {
    studyId: configSnap.id,
    ...configSnap.data()
  } as ProjectConfigFirestore;
}

/**
 * Gets all study configs from Firestore.
 * 
 * @returns Array of all study configs
 */
export async function getAllProjectConfigsFirestore(): Promise<ProjectConfigFirestore[]> {
  const configsRef = collection(db, 'projectConfigs');
  const querySnapshot = await getDocs(configsRef);
  return querySnapshot.docs.map(doc => ({
    studyId: doc.id,
    ...doc.data()
  })) as ProjectConfigFirestore[];
}

/**
 * Creates or updates a project config in Firestore.
 * 
 * @param config - The project config data
 * @returns The study ID
 */
export async function saveProjectConfigFirestore(
  config: Omit<ProjectConfigFirestore, 'createdAt' | 'updatedAt'>
): Promise<string> {
  const configRef = doc(db, 'projectConfigs', config.studyId);
  const existingConfig = await getProjectConfigFirestore(config.studyId);
  
  const configData: Partial<ProjectConfigFirestore> = {
    studyId: config.studyId,
    name: config.name,
    siteName: config.siteName,
    articleConfig: config.articleConfig,
    usesAuthorVariations: config.usesAuthorVariations,
    usesExplainBox: config.usesExplainBox,
    usesCommentVariations: config.usesCommentVariations,
    usesSummaries: config.usesSummaries,
    updatedAt: serverTimestamp() as Timestamp,
  };
  
  if (!existingConfig) {
    configData.createdAt = serverTimestamp() as Timestamp;
  }
  
  await setDoc(configRef, configData, { merge: true });
  return config.studyId;
}

/**
 * Deletes a project config from Firestore.
 * 
 * @param studyId - The study ID to delete the config for
 */
export async function deleteProjectConfigFirestore(studyId: string): Promise<void> {
  const configRef = doc(db, 'projectConfigs', studyId);
  await deleteDoc(configRef);
}