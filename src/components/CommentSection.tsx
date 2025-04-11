interface CommentSectionProps {
  articleId: string;
}

export function CommentSection({ articleId }: CommentSectionProps) {
  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold mb-4">Comments</h2>
      <div className="space-y-4">
        {/* Comments will be added here later */}
        <p className="text-gray-500">Comments are coming soon!</p>
      </div>
    </div>
  );
}
