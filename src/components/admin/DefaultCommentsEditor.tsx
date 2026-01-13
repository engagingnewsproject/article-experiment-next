/**
 * DefaultCommentsEditor component for managing default comments on articles.
 * 
 * This component:
 * - Displays a list of default comments with edit/delete functionality
 * - Allows editing comment fields (name, content, upvotes, downvotes)
 * - Manages replies for each comment
 * - Provides add/delete functionality for replies
 * 
 * @component
 */

'use client';

import { type Comment } from '@/lib/firestore';
import { Dispatch, SetStateAction } from 'react';

interface DefaultCommentsEditorProps {
  /** Array of default comments to display and edit */
  comments: Comment[];
  /** Function to update the comments array */
  setComments: Dispatch<SetStateAction<Comment[]>>;
}

/**
 * DefaultCommentsEditor component that provides a UI for managing default comments.
 * 
 * @param {DefaultCommentsEditorProps} props - Component props
 * @returns {JSX.Element} The default comments editor UI
 */
export function DefaultCommentsEditor({ comments, setComments }: DefaultCommentsEditorProps) {
  /**
   * Handles changes to a comment field.
   * 
   * @param index - Index of the comment to update
   * @param field - Field name to update
   * @param value - New value for the field
   */
  const handleCommentChange = (index: number, field: keyof Comment, value: any) => {
    const updated = [...comments];
    updated[index] = { ...updated[index], [field]: value };
    setComments(updated);
  };

  /**
   * Handles changes to a reply field.
   * 
   * @param commentIndex - Index of the parent comment
   * @param replyIndex - Index of the reply to update
   * @param field - Field name to update
   * @param value - New value for the field
   */
  const handleReplyChange = (commentIndex: number, replyIndex: number, field: keyof Comment, value: any) => {
    const updated = [...comments];
    if (!updated[commentIndex].replies) {
      updated[commentIndex].replies = [];
    }
    const replies = [...(updated[commentIndex].replies || [])];
    replies[replyIndex] = { ...replies[replyIndex], [field]: value };
    updated[commentIndex] = { ...updated[commentIndex], replies };
    setComments(updated);
  };

  /**
   * Removes a comment from the list.
   * 
   * @param index - Index of the comment to remove
   */
  const handleRemoveComment = (index: number) => {
    const updated = [...comments];
    updated.splice(index, 1);
    setComments(updated);
  };

  /**
   * Removes a reply from a comment.
   * 
   * @param commentIndex - Index of the parent comment
   * @param replyIndex - Index of the reply to remove
   */
  const handleRemoveReply = (commentIndex: number, replyIndex: number) => {
    const updated = [...comments];
    if (updated[commentIndex].replies) {
      const replies = [...updated[commentIndex].replies];
      replies.splice(replyIndex, 1);
      updated[commentIndex] = { ...updated[commentIndex], replies };
      setComments(updated);
    }
  };

  /**
   * Adds a new reply to a comment.
   * 
   * @param commentIndex - Index of the comment to add a reply to
   */
  const handleAddReply = (commentIndex: number) => {
    const updated = [...comments];
    if (!updated[commentIndex].replies) {
      updated[commentIndex].replies = [];
    }
    updated[commentIndex] = {
      ...updated[commentIndex],
      replies: [
        ...(updated[commentIndex].replies || []),
        { content: '', name: '', upvotes: 0, downvotes: 0, createdAt: new Date().toISOString() }
      ]
    };
    setComments(updated);
  };

  return (
    <div className="mt-8 pt-6 border-t-2 border-gray-300">
      <h3 className="text-xl font-bold mb-4">Default Comments</h3>
      {comments.length === 0 ? (
        <p className="text-gray-500 italic">No default comments added to this article.</p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment, commentIndex) => (
            <div key={commentIndex} className="p-4 border border-gray-300 rounded-lg bg-gray-50">
              <div className="flex justify-between items-start mb-4">
                <h4 className="font-semibold text-lg">Comment {commentIndex + 1}</h4>
                <button
                  type="button"
                  onClick={() => handleRemoveComment(commentIndex)}
                  className="px-3 py-1 text-white bg-red-500 rounded hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block mb-1 text-sm font-medium">Name:</label>
                  <input
                    type="text"
                    value={comment.name || ''}
                    onChange={(e) => handleCommentChange(commentIndex, 'name', e.target.value)}
                    className="w-full px-3 py-2 border rounded"
                    placeholder="Commenter name"
                  />
                </div>
                
                <div>
                  <label className="block mb-1 text-sm font-medium">Content:</label>
                  <textarea
                    value={comment.content || ''}
                    onChange={(e) => handleCommentChange(commentIndex, 'content', e.target.value)}
                    className="w-full px-3 py-2 border rounded"
                    rows={3}
                    placeholder="Comment content"
                  />
                </div>
                
                <div className="flex gap-4">
                  <div>
                    <label className="block mb-1 text-sm font-medium">Upvotes:</label>
                    <input
                      type="number"
                      value={comment.upvotes || 0}
                      onChange={(e) => handleCommentChange(commentIndex, 'upvotes', parseInt(e.target.value) || 0)}
                      className="w-20 px-3 py-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-medium">Downvotes:</label>
                    <input
                      type="number"
                      value={comment.downvotes || 0}
                      onChange={(e) => handleCommentChange(commentIndex, 'downvotes', parseInt(e.target.value) || 0)}
                      className="w-20 px-3 py-2 border rounded"
                    />
                  </div>
                </div>
                
                {/* Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="mt-4 pl-4 border-l-2 border-gray-400">
                    <h5 className="font-medium mb-2">Replies:</h5>
                    {comment.replies.map((reply, replyIndex) => (
                      <div key={replyIndex} className="mb-3 p-3 bg-white rounded border">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-sm font-medium">Reply {replyIndex + 1}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveReply(commentIndex, replyIndex)}
                            className="px-2 py-1 text-xs text-white bg-red-500 rounded hover:bg-red-700"
                          >
                            Delete
                          </button>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <label className="block mb-1 text-xs font-medium">Name:</label>
                            <input
                              type="text"
                              value={reply.name || ''}
                              onChange={(e) => handleReplyChange(commentIndex, replyIndex, 'name', e.target.value)}
                              className="w-full px-2 py-1 text-sm border rounded"
                              placeholder="Reply author name"
                            />
                          </div>
                          <div>
                            <label className="block mb-1 text-xs font-medium">Content:</label>
                            <textarea
                              value={reply.content || ''}
                              onChange={(e) => handleReplyChange(commentIndex, replyIndex, 'content', e.target.value)}
                              className="w-full px-2 py-1 text-sm border rounded"
                              rows={2}
                              placeholder="Reply content"
                            />
                          </div>
                          <div className="flex gap-4">
                            <div>
                              <label className="block mb-1 text-xs font-medium">Upvotes:</label>
                              <input
                                type="number"
                                value={reply.upvotes || 0}
                                onChange={(e) => handleReplyChange(commentIndex, replyIndex, 'upvotes', parseInt(e.target.value) || 0)}
                                className="w-16 px-2 py-1 text-sm border rounded"
                              />
                            </div>
                            <div>
                              <label className="block mb-1 text-xs font-medium">Downvotes:</label>
                              <input
                                type="number"
                                value={reply.downvotes || 0}
                                onChange={(e) => handleReplyChange(commentIndex, replyIndex, 'downvotes', parseInt(e.target.value) || 0)}
                                className="w-16 px-2 py-1 text-sm border rounded"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => handleAddReply(commentIndex)}
                      className="px-3 py-1 text-sm text-blue-700 bg-blue-100 rounded hover:bg-blue-200"
                    >
                      + Add Reply
                    </button>
                  </div>
                )}
                
                {(!comment.replies || comment.replies.length === 0) && (
                  <button
                    type="button"
                    onClick={() => handleAddReply(commentIndex)}
                    className="px-3 py-1 text-sm text-blue-700 bg-blue-100 rounded hover:bg-blue-200"
                  >
                    + Add Reply
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
