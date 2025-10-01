"use client";
import { Header } from '@/components/Header';
import { db } from '@/lib/firebase';
import { ArticleTheme } from '@/lib/firestore';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function EditArticlePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const id = params.id;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [article, setArticle] = useState<any | null>(null);
  const [themes, setThemes] = useState<ArticleTheme[]>([]);

  useEffect(() => {
    if (!id) return;
    async function fetchArticle() {
      setLoading(true);
      try {
        const docRef = doc(db, 'articles', String(id));
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setArticle(data);
          setThemes(data.themes || []);
        } else {
          setError('Article not found');
        }
      } catch (err) {
        setError('Error loading article');
      } finally {
        setLoading(false);
      }
    }
    fetchArticle();
  }, [id]);

  const handleChange = (field: string, value: any) => {
    setArticle((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleThemeContentChange = (index: number, value: string) => {
    const updated = [...themes];
    updated[index] = { ...updated[index], content: value };
    setThemes(updated);
  };

  const handleThemeLabelChange = (index: number, value: string) => {
    const updated = [...themes];
    updated[index] = { ...updated[index], label: value };
    setThemes(updated);
  };

  const handleAddTheme = () => {
    setThemes([...(themes || []), { label: '', content: '' }]);
  };

  const handleRemoveTheme = (index: number) => {
    const updatedThemes = [...themes];
    updatedThemes.splice(index, 1);
    setThemes(updatedThemes);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const docRef = doc(db, 'articles', String(id));
      const mappedThemes = themes.map((theme, idx) => ({
        label: theme.label || '',
        content: theme.content
      }));
      await updateDoc(docRef, {
        ...article,
        themes: mappedThemes,
      });
      setSuccess('Article updated successfully!');
    } catch (err) {
      setError('Error updating article');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;
  if (!article) return null;

  return (
    <div className="max-w-3xl p-8 mx-auto">
      <Header />
      <div className="flex items-center justify-between mb-6">
        <h1 className="w-full text-2xl font-bold text-center">Edit Article</h1>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block mb-2 font-bold">Title</label>
          <input
            type="text"
            value={article.title || ''}
            onChange={e => handleChange('title', e.target.value)}
            className="w-full px-3 py-2 border rounded"
            required
          />
        </div>
        <div>
          <label className="block mb-2 font-bold">Slug</label>
          <input
            type="text"
            value={article.slug || ''}
            onChange={e => handleChange('slug', e.target.value)}
            className="w-full px-3 py-2 border rounded"
            required
          />
        </div>
        <div>
          <label className="block mb-2 font-bold">Summary</label>
          <textarea
            value={article.summary || ''}
            onChange={e => handleChange('summary', e.target.value)}
            className="w-full px-3 py-2 border rounded"
          />
        </div>
        <div>
          <label className="block mb-2 font-bold">Themes</label>
          <div className="flex flex-col gap-4">
            {themes.map((theme, idx) => (
              <div key={idx} className="relative flex flex-col items-center p-4 border rounded">
                <input
                  type="text"
                  value={theme.label || ''}
                  onChange={e => handleThemeLabelChange(idx, e.target.value)}
                  placeholder={`Theme ${String.fromCharCode(65 + idx)}`}
                  className="w-full mb-2 text-lg font-semibold text-center bg-transparent border-b outline-none"
                />
                <textarea
                  value={theme.content}
                  onChange={e => handleThemeContentChange(idx, e.target.value)}
                  placeholder="Theme content..."
                  className="w-full mb-2 text-center bg-transparent border-none outline-none"
                  required
                />
                <button
                  type="button"
                  className="absolute text-gray-400 top-2 right-2 hover:text-red-500"
                  onClick={() => handleRemoveTheme(idx)}
                  aria-label="Remove theme"
                >
                  &times;
                </button>
              </div>
            ))}
            <button
              type="button"
              className="self-center px-4 py-2 mt-2 text-blue-700 bg-blue-100 rounded hover:bg-blue-200"
              onClick={handleAddTheme}
            >
              + Add Theme
            </button>
          </div>
        </div>
        <div>
          <label className="block mb-2 font-bold">Content</label>
          <div className="flex items-center gap-2 mb-2">
            <button
              type="button"
              className="px-2 py-1 text-xs font-semibold text-white bg-blue-500 rounded hover:bg-blue-600 focus:outline-none"
              title="Insert image template at cursor"
              onClick={() => {
                const textarea = document.getElementById('article-content-textarea') as HTMLTextAreaElement;
                if (textarea) {
                  const template = '[img src="" caption=""]';
                  const start = textarea.selectionStart;
                  const end = textarea.selectionEnd;
                  const value = textarea.value;
                  textarea.value = value.slice(0, start) + template + value.slice(end);
                  textarea.selectionStart = textarea.selectionEnd = start + template.length;
                  textarea.focus();
                  handleChange('content', textarea.value);
                }
              }}
            >
              + Insert Image
            </button>
            <span className="text-xs text-gray-500">Tip: Use the button to insert an image template at the cursor.</span>
          </div>
          <textarea
            id="article-content-textarea"
            ref={el => {
              if (el) {
                el.style.height = 'auto';
                el.style.height = el.scrollHeight + 'px';
              }
            }}
            value={article.content || ''}
            onChange={e => {
              handleChange('content', e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = e.target.scrollHeight + 'px';
            }}
            className="w-full px-3 py-2 overflow-hidden border rounded resize-none"
            style={{ minHeight: '120px' }}
            required
          />
        </div>
        <div className="flex items-center gap-4">
          {article?.slug && (
            <a
              href={`/articles/${article.slug}?version=3`}
              className="px-4 py-2 text-white bg-gray-500 border border-gray-600 rounded hover:bg-gray-600 focus:outline-none focus:ring-2 focus:gray-yellow-400"
              style={{ color: 'white' }}
            >
              Back to Article
            </a>
          )}
          <button
            type="submit"
            className="px-4 py-2 text-white bg-green-500 border border-green-600 rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
        {success && <div className="mt-2 text-green-600">{success}</div>}
        {error && <div className="mt-2 text-red-600">{error}</div>}
      </form>
    </div>
  );
}
