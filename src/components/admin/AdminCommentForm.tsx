'use client';

import React from 'react';
import { Dispatch, SetStateAction } from 'react';
import { CommentFormData } from '@/app/admin/add-default-comments/page';

interface AdminCommentFormProps {
  commentIndex: number;
  comment: CommentFormData;
  setComments: Dispatch<SetStateAction<CommentFormData[]>>;
  onRemove: (i: number) => void;
}

const AdminCommentForm: React.FC<AdminCommentFormProps> = ({
  commentIndex,
  comment,
  setComments,
  onRemove,
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
    <div key={commentIndex} className="flex flex-col border border-black p-6">
      <div className="flex flex-row mb-4 justify-between">
        <h3 className="text-sm font-small">Comment {commentIndex + 1}</h3>
        <button
          type="button"
          onClick={() => onRemove(commentIndex)}
          className="bg-red-500 text-white text-md px-2 py-1  rounded hover:bg-red-700 transition-colors"
        >
          Remove Comment
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col mb-6">
          <label className="block text-md font-medium mb-1 mr-4">Name:</label>
          <input
            type="text"
            value={comment.name}
            onChange={(e) => updateComment('name', e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Commenter name"
            required
          />
        </div>

        <div className="flex flex-col mb-6">
          <label className="block text-md font-medium mb-1">Content:</label>
          <textarea
            value={comment?.content}
            onChange={(e) => updateComment('content', e.target.value)}
            className="w-full p-2 mb-4 border rounded min-h-[140px]"
            placeholder="Comment content"
            rows={3}
            required
          />
        </div>

        <div className="flex flex-row mb-6">
          <div className="flex flex-col mr-6">
            <label className="block text-md font-medium mb-1 mr-4">Upvotes</label>
            <input 
              type="number"
              value={comment.upvotes}
              onChange={(e) => updateComment('upvotes', e.target.value)}
              className='w-20 p-2 border rounded'
              placeholder='Upvotes'
              required
             />
          </div>

          <div className="flex flex-col mr-6">
            <label className="block text-md font-medium mb-1 mr-4">Downvotes</label>
            <input 
              type="number"
              value={comment.downvotes}
              onChange={(e) => updateComment('downvotes', e.target.value)}
              className='w-20 p-2 border rounded'
              placeholder='Downvotes'
              required
             />
          </div>
        </div>

        <div className="space-y-4">
          <div className="mb-4">
            <h4 className="text-md font-medium underline">Replies</h4>
          </div>

          <div className="flex flex-col">
            {comment.replies.map((reply, replyIndex) => (
              <div key={replyIndex} className="border-l-2 pl-4 m-0 mr-6 mb-4">
                <div className="flex flex-row mb-4 justify-between items-center">
                  <h3 className="text-sm font-medium whitespace-nowrap">Reply {replyIndex + 1}</h3>
                  <button
                    type="button"
                    onClick={() => removeReply(commentIndex, replyIndex)}
                    className="bg-red-500 text-white text-md px-2 py-1  rounded hover:bg-red-700 transition-colors"
                  >
                    Remove Reply
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="flex flex-col mb-6">
                    <label className="block text-md font-medium mb-1 mr-4">
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
                      required
                    />
                  </div>

                  <div className="flex flex-col mb-6">
                    <label className="block text-md font-medium mb-1">Content:</label>
                    <textarea
                      value={reply.content}
                      onChange={(e) =>
                        updateReply(commentIndex, replyIndex, 'content', e.target.value)
                      }
                      className="w-full p-2 border rounded min-h-[140px]"
                      placeholder="Reply content"
                      rows={2}
                      required
                    />
                  </div>
                </div>
                <div className="flex flex-row mb-6">
                  <div className="flex flex-col mr-6">
                    <label className="block text-md font-medium mb-1 mr-4">Upvotes</label>
                    <input 
                      type="number"
                      value={reply.upvotes}
                      onChange={(e) => updateReply(commentIndex, replyIndex, 'upvotes', e.target.value)}
                      className='w-20 p-2 border rounded'
                      placeholder='Upvotes'
                      required
                    />
                  </div>

                  <div className="flex flex-col mr-6">
                    <label className="block text-md font-medium mb-1 mr-4">Downvotes</label>
                    <input 
                      type="number"
                      value={reply.downvotes}
                      onChange={(e) => updateReply(commentIndex, replyIndex, 'downvotes', e.target.value)}
                      className='w-20 p-2 border rounded'
                      placeholder='Downvotes'
                      required
                    />
                  </div>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addReply(commentIndex)}
              className=" w-full p-2 border-2 border-dashed border-blue-300 rounded text-blue-500 hover:border-blue-400 hover:text-blue-700"
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