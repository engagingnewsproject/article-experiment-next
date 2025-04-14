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
import { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
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
  const [error, setError] = useState<string | null>(null);

  /**
   * Adds a new article to the Firestore database.
   * 
   * @param {string} title - The title of the article
   * @param {string} slug - The URL-friendly slug for the article
   * @param {string} content - The content of the article
   * @returns {Promise<void>} A promise that resolves when the article is added
   */
  const addArticle = async (title: string, slug: string, content: string) => {
    const articlesCollection = collection(db, 'articles');
    await addDoc(articlesCollection, {
      title,
      slug,
      content,
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
      await addArticle(title, slug, content);
      setTitle('');
      setSlug('');
      setContent('');
      alert('Article added successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6">
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm"
          required
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Slug</label>
        <input
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm"
          required
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Content</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm"
          required
        />
      </div>
      <button
        type="submit"
        className="px-4 py-2 bg-blue-600 text-white rounded-md"
      >
        Add Article
      </button>
      {error && <div className="text-red-500 mt-2">{error}</div>}
    </form>
  );
};

export default AddArticleForm;
