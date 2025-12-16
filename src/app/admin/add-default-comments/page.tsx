'use client';

import AdminCommentForm from '@/components/admin/AdminCommentForm';
import { AdminImportButton } from '@/components/admin/AdminImportButton';
import { updateArticleWithDefaultComments, type Comment } from '@/lib/firestore';
import { useState } from 'react';

export interface CommentFormData {
  content: string;
  name: string;
  upvotes: number;
  downvotes: number;
  replies: {
    content: string;
    name: string;
    upvotes: number;
    downvotes: number;
    replies: {}
  }[];
}

export default function AddDefaultCommentsPage() {
  const [articleId, setArticleId] = useState('');
  const [comments, setComments] = useState<CommentFormData[]>([
    { content: '', name: '', upvotes: 0, downvotes: 0, replies: [] }
  ]);
  const [importedComments, setImportedComments] = useState<Comment[] | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const addComment = () => {
    setComments([...comments, { content: '', name: '', upvotes: 0, downvotes: 0, replies: [] }]);
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
      let defaultComments: Comment[] = [];
      if (importedComments && importedComments.length > 0) {
        defaultComments = [
          ...importedComments,
          ...comments
            .filter(comment => comment.content && comment.name)
            .map(comment => ({
              content: comment.content,
              name: comment.name,
              upvotes: Number(comment.upvotes),
              downvotes: Number(comment.downvotes),
              datePosted: "1 day ago",
              createdAt: new Date().toISOString(),
              replies: comment.replies.map(reply => ({
                content: reply.content,
                name: reply.name,
                upvotes: Number(reply.upvotes),
                downvotes: Number(reply.downvotes),
                createdAt: new Date().toISOString()
              }))
            }))
        ];
      } else {
        defaultComments = comments
          .filter(comment => comment.content && comment.name)
          .map(comment => ({
            content: comment.content,
            name: comment.name,
            upvotes: Number(comment.upvotes),
            downvotes: Number(comment.downvotes),
            datePosted: "1 day ago",
            createdAt: new Date().toISOString(),
            replies: comment.replies.map(reply => ({
              content: reply.content,
              name: reply.name,
              upvotes: Number(reply.upvotes),
              downvotes: Number(reply.downvotes),
              createdAt: new Date().toISOString()
            }))
          }));
      }

      await updateArticleWithDefaultComments(articleId, defaultComments);
      setStatus('success');
      setImportedComments(null);
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col items-center p-8">
        <h1 className="mb-4 text-2xl font-bold">Add Default Comments</h1>
    
        <form onSubmit={handleSubmit} className="w-full max-w-4xl">
          <div className="mb-6">
            <label htmlFor="articleId" className="block font-medium text-md">
              Article ID
            </label>
            <input
              type="text"
              id="articleId"
              value={articleId}
              onChange={(e) => setArticleId(e.target.value)}
              className="w-full p-2 mb-2 border rounded"
              placeholder="Enter article ID"
              required
            />      
          </div>

          <div className="space-y-6">
            <h4 className="font-medium underline text-md">Comments</h4>
            <AdminImportButton 
              articleId={articleId}
              onImport={setImportedComments}
              isImportComplete={status === 'success'}
            />  

            {comments.map((comment, commentIndex) => (
              <AdminCommentForm 
                key={commentIndex}
                commentIndex={commentIndex}
                comment={comment}
                setComments={setComments}
                onRemove={removeComment}
                requireFields={importedComments == null || importedComments.length === 0}
              />
            ))}

            <button
              type="button"
              onClick={addComment}
              className="w-full p-2 text-gray-500 border-2 border-gray-300 border-dashed rounded hover:border-gray-400 hover:text-gray-600"
            >
              Add Comment
            </button>
          </div>

          <div className="mt-6">
            <button
              type="submit"
              disabled={
                status === 'loading' ||
                (!importedComments && comments.filter(comment => comment.content && comment.name).length === 0)
              }
              className="px-6 py-2 text-white bg-blue-500 rounded hover:border-blue-400 hover:bg-blue-400 disabled:bg-gray-400"
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
  );
}