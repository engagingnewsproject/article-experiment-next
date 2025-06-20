/**
 * Form component for adding new articles to the application.
 * 
 * This component:
 * - Provides a form interface for creating new articles
 * - Handles form state management
 * - Submits article data to Firestore
 * - Displays success/error messages
 * 
 * @component
 * @returns {JSX.Element} The article creation form
 */
import { ArticleTheme } from '@/lib/firestore';
import { addDoc, collection } from 'firebase/firestore';
import { useState } from 'react';
import { db } from '../lib/firebase';

/**
 * AddArticleForm component that manages article creation.
 * 
 * This component:
 * - Maintains form state for title, slug, and content
 * - Handles form submission and validation
 * - Manages error states
 * - Provides user feedback
 * 
 * @returns {JSX.Element} The rendered article creation form
 */
const AddArticleForm = () => {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [summary, setSummary] = useState('');
  const [themes, setThemes] = useState<ArticleTheme[] | null>([]);
  const [error, setError] = useState<string | null>(null);

  /**
   * Adds a new article to the Firestore database.
   * 
   * @param {string} title - The title of the article
   * @param {string} slug - The URL-friendly slug for the article
   * @param {string} content - The content of the article
   * @returns {Promise<void>} A promise that resolves when the article is added
   */
  const addArticle = async (title: string, slug: string, content: string, summary: string, themes: ArticleTheme[] | null) => {
    const articlesCollection = collection(db, 'articles');
    await addDoc(articlesCollection, {
      title,
      slug,
      content,
      summary,
      themes,
      createdAt: new Date(),
    });
  };

  /**
   * Handles form submission.
   * 
   * This function:
   * - Prevents default form submission
   * - Calls addArticle with form data
   * - Resets form fields on success
   * - Displays success message
   * - Handles and displays errors
   * 
   * @param {React.FormEvent} e - The form submission event
   * @returns {Promise<void>} A promise that resolves when submission is complete
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addArticle(title, slug, content, summary, themes);
      setTitle('');
      setSlug('');
      setContent('');
      setSummary('');
      setThemes(null);
      alert('Article added successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleThemeContentChange = (index: number, value: string) => {
    if (!themes) return;
    const updated = [...themes];
    updated[index] = { content: value };
    setThemes(updated);
  };

  const handleAddTheme = () => {
    setThemes([...(themes || []), { content: '' }]);
  };

  const handleRemoveTheme = (index: number) => {
    if (!themes) return;
    const updated = [...themes];
    updated.splice(index, 1);
    setThemes(updated);
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6">
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Title*</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="block w-full mt-1 border border-gray-300 rounded-md shadow-sm"
          required
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Slug*</label>
        <input
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          className="block w-full mt-1 border border-gray-300 rounded-md shadow-sm"
          required
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Content*</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="block w-full mt-1 border border-gray-300 rounded-md shadow-sm"
          required
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Summary</label>
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          className="block w-full mt-1 border border-gray-300 rounded-md shadow-sm"
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Themes</label>
        <div className="flex flex-col gap-4 mt-1">
          {(themes || []).map((theme, idx) => (
            <div key={idx} className="relative flex flex-col items-center p-6 border rounded-md">
              <textarea
                value={theme.content}
                onChange={e => handleThemeContentChange(idx, e.target.value)}
                placeholder={`Theme ${String.fromCharCode(65 + idx)}`}
                className="w-full mb-2 text-xl font-bold text-center bg-transparent border-none outline-none"
                style={{textAlign: 'center'}}
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
      <button
        type="submit"
        className="px-4 py-2 text-white bg-blue-600 rounded-md"
      >
        Add Article
      </button>
      {error && <div className="mt-2 text-red-500">{error}</div>}
    </form>
  );
};

export default AddArticleForm;
