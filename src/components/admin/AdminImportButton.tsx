import styles from '@/components/admin/AdminImportButton.module.css';
import { type Comment } from '@/lib/firestore';
import Papa from 'papaparse';
import { useEffect, useRef, useState } from 'react';

interface AdminImportButtonProps {
  articleId: string;
  onImport?: (comments: Comment[]) => void;
  isImportComplete?: boolean;
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

    const rowMap: Record<string, any> = {};
    data.forEach((row: any) => {
      rowMap[row.id] = row;
    });

    // Build a tree structure for comments and replies (up to 3 levels)
    const topLevel: any[] = [];
    const replyMap: Record<string, any[]> = {};
    data.forEach((row: any) => {
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
          name: 'Anonymous',
          createdAt: row.written_at || row.createdAt || new Date().toISOString(),
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

    const comments: Comment[] = buildTree(topLevel);
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