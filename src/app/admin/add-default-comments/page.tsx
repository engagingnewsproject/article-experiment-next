'use client';

import { useState } from 'react';
import { updateArticleWithDefaultComments } from '@/lib/firestore';
import { type Comment } from '@/lib/firestore';
import AdminCommentForm from '@/components/admin/AdminCommentForm';
import { Header } from '@/components/Header';

export interface CommentFormData {
  content: string;
  name: string;
  replies: {
    content: string;
    name: string;
  }[];
}

export default function AddDefaultCommentsPage() {
  const [articleId, setArticleId] = useState('');
  const [comments, setComments] = useState<CommentFormData[]>([
    { content: '', name: '', replies: [] }
  ]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const addComment = () => {
    setComments([...comments, { content: '', name: '', replies: [] }]);
  };

  const removeComment = (index: number) => {
    setComments(comments.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!articleId) return;

    setStatus('loading');
    setError(null);

    try {
      const defaultComments: Comment[] = comments.map(comment => ({
        content: comment.content,
        name: comment.name,
        createdAt: new Date().toISOString(),
        replies: comment.replies.map(reply => ({
          content: reply.content,
          name: reply.name,
          createdAt: new Date().toISOString()
        }))
      }));

      await updateArticleWithDefaultComments(articleId, defaultComments);
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  return (
    <>
      <Header />
      <div className="p-8 flex flex-col items-center">
        <h1 className="text-2xl font-bold mb-4">Add Default Comments</h1>
    
        <form onSubmit={handleSubmit} className="max-w-4xl w-full">
          <div className="mb-6">
            <label htmlFor="articleId" className="block text-md font-medium">
              Article ID
            </label>
            <input
              type="text"
              id="articleId"
              value={articleId}
              onChange={(e) => setArticleId(e.target.value)}
              className="w-full p-2 border rounded mb-2"
              placeholder="Enter article ID"
              required
            />        </div>

          <div className="space-y-6">
            <h4 className="text-md font-medium underline">Comments</h4>

            {comments.map((comment, commentIndex) => (
              <AdminCommentForm 
                key={commentIndex}
                commentIndex={commentIndex}
                comment={comment}
                setComments={setComments}
                onRemove={removeComment}
              />
            ))}

            <button
              type="button"
              onClick={addComment}
              className="w-full p-2 border-2 border-dashed border-gray-300 rounded text-gray-500 hover:border-gray-400 hover:text-gray-600"
            >
              Add Comment
            </button>
          </div>

          <div className="mt-6">
            <button
              type="submit"
              disabled={status === 'loading'}
              className="text-white bg-blue-500 hover:border-blue-400 hover:bg-blue-400 px-6 py-2 rounded disabled:bg-gray-400"
            >
              {status === 'loading' ? 'Saving...' : 'Save Default Comments'}
            </button>

            {status === 'success' && (
              <p className="mt-4 text-green-600">
                Successfully added default comments to article {articleId}
              </p>
            )}

            {status === 'error' && (
              <p className="mt-4 text-red-600">
                Error: {error}
              </p>
            )}
          </div>
        </form>
      </div>
    </>
  );
} 