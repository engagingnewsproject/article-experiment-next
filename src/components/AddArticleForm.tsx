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
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useState, Suspense, useEffect } from 'react';
import { db } from '../lib/firebase';
import { useStudyId } from '@/hooks/useStudyId';
import { getProjectConfig, getProjectConfigAsync } from '@/lib/projectConfig';
import { getStudyName } from '@/lib/studies';
import { InsertImageButton } from '@/components/admin/InsertImageButton';

/**
 * AddArticleForm component that manages article creation.
 * 
 * This component:
 * - Maintains form state for title, slug, and content
 * - Handles form submission and validation
 * - Manages error states
 * - Provides user feedback
 * - Automatically assigns studyId based on URL parameter
 * 
 * @returns {JSX.Element} The rendered article creation form
 */
function AddArticleFormContent() {
  const { studyId } = useStudyId();
  const [projectConfig, setProjectConfig] = useState(getProjectConfig(studyId));
  const [studyName, setStudyName] = useState(getStudyName(studyId));
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [summary, setSummary] = useState('');
  const [themes, setThemes] = useState<ArticleTheme[] | null>([]);
  const [themeLabels, setThemeLabels] = useState<string[]>([]); // Custom theme labels
  const [explainBoxItems, setExplainBoxItems] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load project config asynchronously to ensure we get Firestore configs if available
  useEffect(() => {
    async function loadConfig() {
      const config = await getProjectConfigAsync(studyId);
      setProjectConfig(config);
    }
    loadConfig();
  }, [studyId]);

  /**
   * Adds a new article to the Firestore database.
   * 
   * @param {string} title - The title of the article
   * @param {string} slug - The URL-friendly slug for the article
   * @param {string} content - The content of the article
   * @param {string} summary - The article summary
   * @param {ArticleTheme[] | null} themes - Article themes
   * @param {string[]} explainBoxItems - Explanation box items
   * @param {string} studyId - The study ID to assign to this article
   * @returns {Promise<void>} A promise that resolves when the article is added
   */
  const addArticle = async (title: string, slug: string, content: string, summary: string, themes: ArticleTheme[] | null, explainBoxItems: string[], studyId: string) => {
    const articlesCollection = collection(db, 'articles');
    const articleData = {
      title,
      slug,
      content,
      summary,
      themes,
      explain_box: explainBoxItems.filter(item => item.trim().length > 0),
      studyId, // Assign the study ID
      comments_display: true,
      anonymous: false,
      pubdate: projectConfig.articleConfig.pubdate,
      author: projectConfig.articleConfig.author,
      siteName: projectConfig.siteName, // Store site name from project config
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    // Safety check: prevent writing to production in development
    if (process.env.NODE_ENV === 'development' && !process.env.NEXT_PUBLIC_USE_LIVE_FIRESTORE) {
      const dbSettings = (db as any)._delegate?._settings;
      const host = dbSettings?.host || 'unknown';
      const isEmulator = host.includes('localhost') || host.includes('127.0.0.1') || host.includes(':8080');
      
      if (!isEmulator) {
        console.error('❌ BLOCKED: Attempted to write to PRODUCTION Firestore in development!');
        console.error('   This is a safety measure to prevent accidental production writes.');
        throw new Error('SAFETY BLOCK: Cannot write to production database in development mode. Please ensure the emulator is running.');
      }
    }
    
    const docRef = await addDoc(articlesCollection, articleData);
    return docRef.id;
  };

  /**
   * Converts text to a URL-friendly slug format.
   * 
   * @param text - The text to convert to a slug
   * @param preserveHyphens - If true, preserves trailing/leading hyphens (for typing)
   * @returns The slugified text (lowercase, hyphen-separated, special chars removed)
   */
  const slugify = (text: string, preserveHyphens: boolean = false): string => {
    let result = text
      .toLowerCase() // Convert to lowercase
      .trim() // Remove leading/trailing whitespace
      .replace(/[^\w\s-]/g, '') // Remove special characters (keep alphanumeric, spaces, hyphens)
      .replace(/[\s_]+/g, '-') // Replace spaces and underscores with hyphens
      .replace(/-+/g, '-'); // Replace multiple hyphens with a single hyphen
    
    // Only remove leading/trailing hyphens if not preserving them (e.g., during typing)
    if (!preserveHyphens) {
      result = result.replace(/^-+|-+$/g, ''); // Remove leading and trailing hyphens
    }
    
    return result;
  };

  /**
   * Handles slug input changes and converts text to slug format.
   * Preserves hyphens during typing to allow users to type them freely.
   * 
   * @param value - The input value to slugify
   */
  const handleSlugChange = (value: string) => {
    // Preserve hyphens during typing so users can type them
    const slugified = slugify(value, true);
    setSlug(slugified);
  };

  /**
   * Handles slug input blur event and finalizes the slug format.
   * Removes trailing/leading hyphens when user finishes editing.
   */
  const handleSlugBlur = () => {
    if (slug) {
      // Finalize slug by removing trailing/leading hyphens
      const finalized = slugify(slug, false);
      setSlug(finalized);
    }
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
      // Finalize slug by removing trailing/leading hyphens before saving
      const finalizedSlug = slug ? slugify(slug, false) : slug;
      const articleId = await addArticle(title, finalizedSlug, content, summary, themes, explainBoxItems, studyId);
      setTitle('');
      setSlug('');
      setContent('');
      setSummary('');
      setThemes(null);
      setThemeLabels([]);
      setExplainBoxItems([]);
      
      // Trigger article list refresh
      if (typeof window !== 'undefined' && (window as any).refreshArticleList) {
        (window as any).refreshArticleList();
      }
      
      alert(`Article added successfully to ${projectConfig.name}!\nArticle ID: ${articleId}`);
    } catch (err) {
      console.error('❌ Error adding article:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleThemeContentChange = (index: number, value: string) => {
    if (!themes) return;
    const updated = [...themes];
    updated[index] = { label: themeLabels[index] || '', content: value };
    setThemes(updated);
  };

  const handleAddTheme = () => {
    setThemes([...(themes || []), { label: '', content: '' }]);
    setThemeLabels([...(themeLabels || []), '']);
  };

  const handleRemoveTheme = (index: number) => {
    if (!themes) return;
    const updated = [...themes];
    updated.splice(index, 1);
    setThemes(updated);
    const updatedLabels = [...themeLabels];
    updatedLabels.splice(index, 1);
    setThemeLabels(updatedLabels);
  };

  const handleExplainBoxChange = (index: number, value: string) => {
    const updated = [...explainBoxItems];
    updated[index] = value;
    setExplainBoxItems(updated);
  };

  const handleAddExplainBoxItem = () => {
    setExplainBoxItems([...explainBoxItems, '']);
  };

  const handleRemoveExplainBoxItem = (index: number) => {
    const updated = [...explainBoxItems];
    updated.splice(index, 1);
    setExplainBoxItems(updated);
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6 p-4 border rounded-lg bg-gray-50">
      <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded">
        <p className="text-sm text-gray-700">
          <span className="font-semibold">Creating article for:</span> {studyName} (Study ID: <code className="bg-white px-1 rounded">{studyId}</code>)
        </p>
        <p className="text-xs text-gray-500 mt-1">
          <span className="text-gray-400">Current URL: <code className="bg-white px-1 rounded">{typeof window !== 'undefined' ? window.location.href : ''}</code></span>
        </p>
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Title*</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="block w-full mt-1 border border-gray-300 rounded-md shadow-sm px-2 py-1"
          required
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Slug*</label>
        <input
          type="text"
          value={slug}
          onChange={(e) => handleSlugChange(e.target.value)}
          onBlur={handleSlugBlur}
          onPaste={(e) => {
            e.preventDefault();
            const pastedText = e.clipboardData.getData('text');
            handleSlugChange(pastedText);
          }}
          className="block w-full mt-1 border border-gray-300 rounded-md shadow-sm px-2 py-1"
          placeholder="article-title-slug"
          required
        />
        <p className="mt-1 text-xs text-gray-500">
          Text will be automatically converted to lowercase, hyphen-separated format
        </p>
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Content*</label>
        <InsertImageButton
          textareaId="add-article-content-textarea"
          onInsert={(newValue) => setContent(newValue)}
        />
        <textarea
          id="add-article-content-textarea"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="block w-full mt-1 border border-gray-300 rounded-md shadow-sm px-2 py-1"
          required
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Summary</label>
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          className="block w-full mt-1 border border-gray-300 rounded-md shadow-sm px-2 py-1"
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Explanation Box (Why we wrote this)</label>
        <p className="mb-2 text-xs text-gray-600">
          Add items that will appear in the &ldquo;Behind the Story&rdquo; section when <code className="px-1 bg-gray-100 rounded">?explain_box=show</code> is in the URL.
        </p>
        <div className="flex flex-col gap-2">
          {explainBoxItems.map((item, idx) => (
            <div key={idx} className="relative flex items-center gap-2">
              <textarea
                value={item}
                onChange={e => handleExplainBoxChange(idx, e.target.value)}
                placeholder="Enter explanation item..."
                className="flex-1 px-2 py-1 border border-gray-300 rounded-md shadow-sm"
                rows={2}
              />
              <button
                type="button"
                className="px-2 py-1 text-gray-400 hover:text-red-500"
                onClick={() => handleRemoveExplainBoxItem(idx)}
                aria-label="Remove explanation item"
              >
                &times;
              </button>
            </div>
          ))}
          <button
            type="button"
            className="self-start px-3 py-1 text-sm text-blue-700 bg-blue-100 rounded hover:bg-blue-200"
            onClick={handleAddExplainBoxItem}
          >
            + Add Explanation Item
          </button>
        </div>
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Themes</label>
        <div className="flex flex-col gap-4 mt-1">
          {(themes || []).map((theme, idx) => (
            <div key={idx} className="relative flex flex-col items-center p-6 border rounded-md">
              <input
                type="text"
                value={themeLabels[idx] || ''}
                onChange={e => {
                  const updated = [...themeLabels];
                  updated[idx] = e.target.value;
                  setThemeLabels(updated);
                }}
                placeholder={`Theme ${String.fromCharCode(65 + idx)}`}
                className="w-full mb-2 text-lg font-semibold text-center bg-transparent border-b outline-none"
                style={{textAlign: 'center'}}
              />
              <textarea
                value={theme.content}
                onChange={e => handleThemeContentChange(idx, e.target.value)}
                placeholder={`Theme content...`}
                className="w-full mb-2 text-xl text-center bg-transparent border-none outline-none"
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
}

const AddArticleForm = () => {
  return (
    <Suspense fallback={<div className="p-4">Loading form...</div>}>
      <AddArticleFormContent />
    </Suspense>
  );
};

export default AddArticleForm;
