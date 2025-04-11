interface ExplainBoxProps {
  content?: string;
}

export function ExplainBox({ content }: ExplainBoxProps) {
  if (!content) return null;

  return (
    <div className="mt-8 p-6 bg-gray-100 rounded-lg">
      <h2 className="text-xl font-bold mb-4">Explanation</h2>
      <div className="prose max-w-none">
        {content}
      </div>
    </div>
  );
}
