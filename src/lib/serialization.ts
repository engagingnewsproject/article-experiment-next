/**
 * Serialization helpers for Firestore data (Timestamps and nested objects).
 * Used by both server (SSR) and client so article/comments can be passed as serializable props.
 *
 * @module serialization
 */

import { Timestamp } from 'firebase/firestore';
import type { Comment } from './firestore';

/**
 * Converts a Firestore Timestamp to an ISO string.
 */
export function convertTimestamp(timestamp: unknown): string {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toISOString();
  }
  if (typeof timestamp === 'string') {
    return timestamp;
  }
  return new Date().toISOString();
}

/**
 * Recursively converts Firestore data (including Timestamps) to plain JSON-serializable objects.
 */
export function convertToPlainObject<T>(data: T): T {
  if (data == null) return data;

  if (Array.isArray(data)) {
    return data.map((item) => convertToPlainObject(item)) as T;
  }

  if (typeof data === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value instanceof Timestamp) {
        result[key] = convertTimestamp(value);
      } else if (typeof value === 'object' && value !== null) {
        result[key] = convertToPlainObject(value);
      } else {
        result[key] = value;
      }
    }
    return result as T;
  }

  return data;
}

/**
 * Extracts Comment[] from article default_comments (avoids redundant Firestore read).
 * Mirrors getComments shape so ArticleClient receives the same structure.
 */
export function commentsFromDefaultComments(raw: unknown): Comment[] {
  const comments: Comment[] = [];
  if (!raw) return comments;
  if (Array.isArray(raw)) {
    (raw as Record<string, unknown>[]).forEach((comment: Record<string, unknown>, index: number) => {
      comments.push({
        id: (comment.id as string) || `default_${index}`,
        content: (comment.content as string) || '',
        name: (comment.name as string) || 'Anonymous',
        datePosted: (comment.datePosted as string) || 'Recently',
        createdAt: comment.createdAt,
        upvotes: (comment.upvotes as number) || 0,
        downvotes: (comment.downvotes as number) || 0,
        replies: (comment.replies as Comment[]) || [],
      } as Comment);
    });
  } else if (typeof raw === 'object') {
    Object.entries(raw as Record<string, Record<string, unknown>>).forEach(([key, comment]) => {
      comments.push({
        id: (comment?.id as string) || key,
        content: (comment?.content as string) || '',
        name: (comment?.name as string) || 'Anonymous',
        datePosted: (comment?.datePosted as string) || 'Recently',
        createdAt: comment?.createdAt,
        upvotes: (comment?.upvotes as number) || 0,
        downvotes: (comment?.downvotes as number) || 0,
        replies: (comment?.replies as Comment[]) || [],
      } as Comment);
    });
  }
  return comments;
}
