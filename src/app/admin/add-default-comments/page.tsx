'use client';

import { useState } from 'react';
import { updateArticleWithDefaultComments } from '@/lib/firestore';
import { type Comment } from '@/lib/firestore';

interface CommentFormData {
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

  const addReply = (commentIndex: number) => {
    const newComments = [...comments];
    newComments[commentIndex].replies.push({ content: '', name: '' });
    setComments(newComments);
  };

  const removeReply = (commentIndex: number, replyIndex: number) => {
    const newComments = [...comments];
    newComments[commentIndex].replies = newComments[commentIndex].replies.filter((_, i) => i !== replyIndex);
    setComments(newComments);
  };

  const updateComment = (index: number, field: keyof CommentFormData, value: string) => {
    const newComments = [...comments];
    newComments[index] = { ...newComments[index], [field]: value };
    setComments(newComments);
  };

  const updateReply = (commentIndex: number, replyIndex: number, field: 'content' | 'name', value: string) => {
    const newComments = [...comments];
    newComments[commentIndex].replies[replyIndex] = {
      ...newComments[commentIndex].replies[replyIndex],
      [field]: value
    };
    setComments(newComments);
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
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Add Default Comments</h1>
      
      <form onSubmit={handleSubmit} className="max-w-4xl">
        <div className="mb-6">
          <label htmlFor="articleId" className="block text-sm font-medium mb-2">
            Article ID
          </label>
          <input
            type="text"
            id="articleId"
            value={articleId}
            onChange={(e) => setArticleId(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Enter article ID"
            required
          />
        </div>

        <div className="space-y-6">
          {comments.map((comment, commentIndex) => (
            <div key={commentIndex} className="border p-4 rounded">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Comment {commentIndex + 1}</h3>
                <button
                  type="button"
                  onClick={() => removeComment(commentIndex)}
                  className="text-red-500 hover:text-red-700"
                >
                  Remove Comment
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input
                    type="text"
                    value={comment.name}
                    onChange={(e) => updateComment(commentIndex, 'name', e.target.value)}
                    className="w-full p-2 border rounded"
                    placeholder="Commenter name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Content</label>
                  <textarea
                    value={comment.content}
                    onChange={(e) => updateComment(commentIndex, 'content', e.target.value)}
                    className="w-full p-2 border rounded"
                    placeholder="Comment content"
                    rows={3}
                    required
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-md font-medium">Replies</h4>
                    <button
                      type="button"
                      onClick={() => addReply(commentIndex)}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      Add Reply
                    </button>
                  </div>

                  {comment.replies.map((reply, replyIndex) => (
                    <div key={replyIndex} className="border-l-2 pl-4">
                      <div className="flex justify-between items-center mb-2">
                        <h5 className="text-sm font-medium">Reply {replyIndex + 1}</h5>
                        <button
                          type="button"
                          onClick={() => removeReply(commentIndex, replyIndex)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Remove Reply
                        </button>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <label className="block text-sm font-medium mb-1">Name</label>
                          <input
                            type="text"
                            value={reply.name}
                            onChange={(e) => updateReply(commentIndex, replyIndex, 'name', e.target.value)}
                            className="w-full p-2 border rounded"
                            placeholder="Reply author name"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">Content</label>
                          <textarea
                            value={reply.content}
                            onChange={(e) => updateReply(commentIndex, replyIndex, 'content', e.target.value)}
                            className="w-full p-2 border rounded"
                            placeholder="Reply content"
                            rows={2}
                            required
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addComment}
            className="w-full p-2 border-2 border-dashed border-gray-300 rounded text-gray-500 hover:border-gray-400 hover:text-gray-600"
          >
            Add Another Comment
          </button>
        </div>

        <div className="mt-6">
          <button
            type="submit"
            disabled={status === 'loading'}
            className="bg-blue-500 text-white px-6 py-2 rounded disabled:bg-gray-400"
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