/**
 * Type definitions for article-related data structures.
 * 
 * This module:
 * - Defines the Article interface and related types
 * - Specifies the structure of article metadata
 * - Provides type safety for article operations
 * - Documents article properties and their purposes
 * 
 * @module article
 */

import { Timestamp } from 'firebase/firestore';

/**
 * Interface representing an article in the system.
 * 
 * This interface:
 * - Defines the structure of article data
 * - Includes metadata and content information
 * - Supports different article states and features
 * - Provides type safety for article operations
 * 
 * @interface Article
 * @property {string} id - Unique identifier for the article
 * @property {string} title - Article title
 * @property {string} content - Article content
 * @property {string} pubdate - Publication date
 * @property {Object} author - Author information
 * @property {string} author.name - Author's name
 * @property {string} [author.photo] - Author's photo URL
 * @property {Object} [author.bio] - Author biography
 * @property {string} [author.bio.personal] - Personal biography
 * @property {string} [author.bio.basic] - Basic biography
 * @property {string} [featuredImage] - URL of the featured image
 * @property {boolean} comments_display - Whether to display comments
 * @property {boolean} anonymous - Whether the article is anonymous
 * @property {string[]} [explain_box] - Explanation box content
 * @property {string} [where_written] - Location where the article was written
 * @property {string} [editor] - Editor's name
 * @property {string} [corrections] - Information about corrections
 * @property {string} [version_history] - Article version history
 * @property {Array} [comments] - Article comments
 * @property {string} comments[].userId - Comment author's ID
 * @property {string} comments[].content - Comment content
 * @property {string} [comments[].timestamp] - Comment timestamp
 * @property {Object} [explainBox] - Explanation box configuration
 * @property {boolean} explainBox.enabled - Whether explanation box is enabled
 * @property {string} [explainBox.content] - Explanation box content
 * @property {Object} [metadata] - Additional article metadata
 * @property {string[]} [metadata.who_spoke_to] - People interviewed
 * @property {string} [metadata.where_written] - Location where written
 * @property {string} [metadata.editor] - Editor's name
 * @property {string} [metadata.corrections] - Correction information
 * @property {string} [metadata.version_history] - Version history
 * @property {string} [metadata.category] - Article category
 * @property {string[]} [metadata.tags] - Article tags
 * @property {string} [slug] - URL-friendly article identifier
 * @property {Timestamp} [createdAt] - Creation timestamp
 * @property {Timestamp} [updatedAt] - Last update timestamp
 * @property {'draft' | 'published'} [status] - Article status
 */
export interface Article {
  id: string;
  title: string;
  content: string;
  pubdate: string;
  author: {
    name: string;
    photo?: string;
    bio?: {
      personal?: string;
      basic?: string;
    };
  };
  featuredImage?: string;
  comments_display: boolean;
  anonymous: boolean;
  explain_box?: string[];
  where_written?: string;
  editor?: string;
  corrections?: string;
  version_history?: string;
  comments?: Array<{
    userId: string;
    content: string;
    timestamp?: string;
  }>;
  explainBox?: {
    enabled: boolean;
    content?: string;
  };
  metadata?: {
    who_spoke_to?: string[];
    where_written?: string;
    editor?: string;
    corrections?: string;
    version_history?: string;
    category?: string;
    tags?: string[];
  };
  slug?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  status?: 'draft' | 'published';
} 