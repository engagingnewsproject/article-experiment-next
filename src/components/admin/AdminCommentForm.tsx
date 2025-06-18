'use client';

import { CommentFormData } from '@/app/admin/add-default-comments/page';
import React, { Dispatch, SetStateAction } from 'react';

interface AdminCommentFormProps {
  commentIndex: number;
  comment: CommentFormData;
  setComments: Dispatch<SetStateAction<CommentFormData[]>>;
  onRemove: (i: number) => void;
  requireFields?: boolean;
}

const AdminCommentForm: React.FC<AdminCommentFormProps> = ({
  commentIndex,
  comment,
  setComments,
  onRemove,
  requireFields = true,
}) => {
  const updateComment = (field: keyof CommentFormData, value: string) => {
    setComments((prev) => {
      const newComments = [...prev];
      newComments[commentIndex] = { ...newComments[commentIndex], [field]: value };
      return newComments;
    });
  };

  const addReply = (commentIndex: number) => {
    setComments((prev) => {
      const newComments = [...prev];
      
      const comment = {
        ...newComments[commentIndex],
        replies: [
          ...newComments[commentIndex].replies,
          { content: '', name: '', upvotes: 0, downvotes: 0, replies: [] }
        ]
      };

      newComments[commentIndex] = comment;
      return newComments;
    });
  };

  const removeReply = (commentIndex: number, replyIndex: number) => {
    setComments((prev) => {
      const newComments = [...prev];
      const comment = {
        ...newComments[commentIndex],
        replies: [...newComments[commentIndex].replies.filter((_, i) => i !== replyIndex)]
      };

      newComments[commentIndex] = comment;
      return newComments;
    });
  };

  const updateReply = (
    commentIndex: number,
    replyIndex: number,
    field: 'content' | 'name' | 'upvotes' | 'downvotes',
    value: string
  ) => {
    setComments((prev) => {
      const newComments = [...prev];
      newComments[commentIndex].replies[replyIndex] = {
        ...newComments[commentIndex].replies[replyIndex],
        [field]: value,
      };
      return newComments;
    });
  };

  return (
    <div key={commentIndex} className="flex flex-col p-6 border border-black">
      <div className="flex flex-row justify-between mb-4">
        <h3 className="text-sm font-small">Comment {commentIndex + 1}</h3>
        <button
          type="button"
          onClick={() => onRemove(commentIndex)}
          className="px-2 py-1 text-white transition-colors bg-red-500 rounded text-md hover:bg-red-700"
        >
          Remove Comment
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col mb-6">
          <label className="block mb-1 mr-4 font-medium text-md">Name:</label>
          <input
            type="text"
            value={comment.name}
            onChange={(e) => updateComment('name', e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Commenter name"
            required={requireFields}
          />
        </div>

        <div className="flex flex-col mb-6">
          <label className="block mb-1 font-medium text-md">Content:</label>
          <textarea
            value={comment?.content}
            onChange={(e) => updateComment('content', e.target.value)}
            className="w-full p-2 mb-4 border rounded min-h-[140px]"
            placeholder="Comment content"
            rows={3}
            required={requireFields}
          />
        </div>

        <div className="flex flex-row mb-6">
          <div className="flex flex-col mr-6">
            <label className="block mb-1 mr-4 font-medium text-md">Upvotes</label>
            <input 
              type="number"
              value={comment.upvotes}
              onChange={(e) => updateComment('upvotes', e.target.value)}
              className='w-20 p-2 border rounded'
              placeholder='Upvotes'
              required={requireFields}
             />
          </div>

          <div className="flex flex-col mr-6">
            <label className="block mb-1 mr-4 font-medium text-md">Downvotes</label>
            <input 
              type="number"
              value={comment.downvotes}
              onChange={(e) => updateComment('downvotes', e.target.value)}
              className='w-20 p-2 border rounded'
              placeholder='Downvotes'
              required={requireFields}
             />
          </div>
        </div>

        <div className="space-y-4">
          <div className="mb-4">
            <h4 className="font-medium underline text-md">Replies</h4>
          </div>

          <div className="flex flex-col">
            {comment.replies.map((reply, replyIndex) => (
              <div key={replyIndex} className="pl-4 m-0 mb-4 mr-6 border-l-2">
                <div className="flex flex-row items-center justify-between mb-4">
                  <h3 className="text-sm font-medium whitespace-nowrap">Reply {replyIndex + 1}</h3>
                  <button
                    type="button"
                    onClick={() => removeReply(commentIndex, replyIndex)}
                    className="px-2 py-1 text-white transition-colors bg-red-500 rounded text-md hover:bg-red-700"
                  >
                    Remove Reply
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="flex flex-col mb-6">
                    <label className="block mb-1 mr-4 font-medium text-md">
                      Name:
                    </label>
                    <input
                      type="text"
                      value={reply.name}
                      onChange={(e) =>
                        updateReply(commentIndex, replyIndex, 'name', e.target.value)
                      }
                      className="w-full p-2 border rounded"
                      placeholder="Reply author name"
                      required={requireFields}
                    />
                  </div>

                  <div className="flex flex-col mb-6">
                    <label className="block mb-1 font-medium text-md">Content:</label>
                    <textarea
                      value={reply.content}
                      onChange={(e) =>
                        updateReply(commentIndex, replyIndex, 'content', e.target.value)
                      }
                      className="w-full p-2 border rounded min-h-[140px]"
                      placeholder="Reply content"
                      rows={2}
                      required={requireFields}
                    />
                  </div>
                </div>
                <div className="flex flex-row mb-6">
                  <div className="flex flex-col mr-6">
                    <label className="block mb-1 mr-4 font-medium text-md">Upvotes</label>
                    <input 
                      type="number"
                      value={reply.upvotes}
                      onChange={(e) => updateReply(commentIndex, replyIndex, 'upvotes', e.target.value)}
                      className='w-20 p-2 border rounded'
                      placeholder='Upvotes'
                      required={requireFields}
                    />
                  </div>

                  <div className="flex flex-col mr-6">
                    <label className="block mb-1 mr-4 font-medium text-md">Downvotes</label>
                    <input 
                      type="number"
                      value={reply.downvotes}
                      onChange={(e) => updateReply(commentIndex, replyIndex, 'downvotes', e.target.value)}
                      className='w-20 p-2 border rounded'
                      placeholder='Downvotes'
                      required={requireFields}
                    />
                  </div>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addReply(commentIndex)}
              className="w-full p-2 text-blue-500 border-2 border-blue-300 border-dashed rounded hover:border-blue-400 hover:text-blue-700"
            >
              Add Reply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCommentForm;