import styles from '@/components/admin/AdminImportButton.module.css';
import { type Comment } from '@/lib/firestore';
import Papa from 'papaparse';
import { useEffect, useRef, useState } from 'react';

interface AdminImportButtonProps {
  articleId: string;
  onImport?: (comments: Comment[]) => void;
  isImportComplete?: boolean;
}

function parseDatePosted(datePosted: string): string {
  const now = new Date();

  if (!datePosted || datePosted.toLowerCase() === "today") {
    return now.toISOString();
  }

  // Match patterns like "2 days ago", "1 hour ago"
  const match = datePosted.match(/^(\d+)\s+(hour|hours|day|days)\b/i);
  if (match) {
    const value = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();

    let msAgo = 0;
    if (unit === "day" || unit === "days") {
      msAgo = value * 24 * 60 * 60 * 1000;
    } else if (unit === "hour" || unit === "hours") {
      msAgo = value * 60 * 60 * 1000;
    }
    const date = new Date(now.getTime() - msAgo);
    return date.toISOString();
  }

  // fallback: try to parse as date string
  const parsed = new Date(datePosted);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString();
  }

  console.log(now.toISOString())
  return now.toISOString();
}

export function AdminImportButton({ articleId, onImport, isImportComplete }: AdminImportButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setError(null);
    setFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [articleId]);

  useEffect(() => {
    if (isImportComplete) setFileName(null);
  }, [isImportComplete]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!articleId) {
      setError('Please enter an article ID before importing.');
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setError(null);

    const text = await file.text();
    const { data } = Papa.parse(text, { header: true, skipEmptyLines: true });

    // Filter out empty rows (all fields empty or whitespace)
    const filteredData = data.filter((row: any) => {
      if (!row) return false;
      return Object.values(row).some(val => String(val).trim() !== '');
    });

    const rowMap: Record<string, any> = {};
    filteredData.forEach((row: any) => {
      rowMap[row.id] = row;
    });

    // Build a tree structure for comments and replies (up to 3 levels)
    const topLevel: any[] = [];
    const replyMap: Record<string, any[]> = {};
    filteredData.forEach((row: any) => {
      if (!row.parent_id) {
        topLevel.push(row);
      } else {
        if (!replyMap[row.parent_id]) replyMap[row.parent_id] = [];
        replyMap[row.parent_id].push(row);
      }
    });

    const idMap: Record<string, string> = {};
    const buildTree = (rows: any[], path: string[] = [], level = 0): any[] => {
      return rows.map((row, index) => {
        if (level > 2) return null;
        const newId = ['default', ...path, index].join('_');
        idMap[row.id] = newId;

        const comment: Comment = {
          id: newId,
          content: row.comment || row.content || '',
          name: row.user_id || 'Anonymous',
          datePosted: row.written_at || "1 day ago",
          createdAt: `{${new Date(parseDatePosted(row.written_at))}`,
          upvotes: row.ranks_up || 0,
          downvotes: row.ranks_down || 0,
          replies: [],
        };

        if (level < 2 && replyMap[row.id]) {
          comment.replies = buildTree(replyMap[row.id], [...path, index.toString()], level + 1).filter(Boolean);
        }
        return comment;
      }).filter(Boolean);
    };

    // Sort comments by latest (descending createdAt)
    function sortByLatest(a: any, b: any) {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return dateB.getTime() - dateA.getTime();
    }

    function sortCommentsRecursively(comments: Comment[]): Comment[] {
      return comments
        .slice()
        .sort(sortByLatest)
        .map(comment => ({
          ...comment,
          replies: comment.replies ? sortCommentsRecursively(comment.replies) : []
        }));
    }

    const comments: Comment[] = sortCommentsRecursively(buildTree(topLevel));
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (onImport) onImport(comments);
  };

  const resetState = () => {
    setFileName(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (onImport) onImport([]);
  }

  return (
    <span className={styles['import-button-container']}>
      <label
        className={styles['import-button']}
        onClick={e => {
          if (!articleId) {
            e.preventDefault();
            setError('Please enter an article ID before importing.');
          }
        }}
      >
        {'Import Comments (.csv)'}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className={styles['import-input']}
          disabled={!articleId}
        />
      </label>
      {fileName && (
        <span 
          className={styles['import-filename']}
          onClick={resetState}
        >{fileName}</span>
      )}
      {error && (
        <span className={styles['import-error']}>
          {error}
        </span>
      )}
    </span>
  );
}