"use client";
import { InsertImageButton } from '@/components/admin/InsertImageButton';
import { db } from '@/lib/firebase';
import { ArticleTheme } from '@/lib/firestore';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';

export default function EditArticlePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const id = params.id;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [article, setArticle] = useState<any | null>(null);
  const [originalArticle, setOriginalArticle] = useState<any | null>(null);
  const [themes, setThemes] = useState<ArticleTheme[]>([]);
  const [originalThemes, setOriginalThemes] = useState<ArticleTheme[]>([]);
  const [explainBoxItems, setExplainBoxItems] = useState<string[]>([]);
  const [originalExplainBoxItems, setOriginalExplainBoxItems] = useState<string[]>([]);

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
          setOriginalArticle({ ...data }); // Store original for comparison
          const themesData = data.themes || [];
          setThemes(themesData);
          setOriginalThemes([...themesData]); // Store original themes
          const explainBoxData = Array.isArray(data.explain_box) ? data.explain_box : [];
          setExplainBoxItems(explainBoxData);
          setOriginalExplainBoxItems([...explainBoxData]); // Store original explain box items
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

  const handleChange = (field: string, value: any) => {
    setArticle((prev: any) => ({ ...prev, [field]: value }));
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
    handleChange('slug', slugified);
  };

  /**
   * Handles slug input blur event and finalizes the slug format.
   * Removes trailing/leading hyphens when user finishes editing.
   */
  const handleSlugBlur = () => {
    if (article?.slug) {
      // Finalize slug by removing trailing/leading hyphens
      const finalized = slugify(article.slug, false);
      handleChange('slug', finalized);
    }
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
      const filteredExplainBoxItems = explainBoxItems.filter(item => item.trim().length > 0);
      // Finalize slug by removing trailing/leading hyphens before saving
      const finalizedSlug = article.slug ? slugify(article.slug, false) : article.slug;
      
      // Create the finalized article object with all saved values
      const finalizedArticle = {
        ...article,
        slug: finalizedSlug,
        themes: mappedThemes,
        explain_box: filteredExplainBoxItems,
      };
      
      await updateDoc(docRef, finalizedArticle);
      
      // Update both article and originalArticle states with the finalized values
      // Also update themes and explainBoxItems to match what was saved (filtered versions)
      // This ensures hasUnsavedChanges() will return false after saving
      setArticle(finalizedArticle);
      setOriginalArticle({ ...finalizedArticle });
      setThemes([...mappedThemes]);
      setOriginalThemes([...mappedThemes]);
      setExplainBoxItems([...filteredExplainBoxItems]);
      setOriginalExplainBoxItems([...filteredExplainBoxItems]);
      setSuccess('Article updated successfully!');
    } catch (err) {
      setError('Error updating article');
    } finally {
      setLoading(false);
    }
  };

  // Check if there are unsaved changes
  const hasUnsavedChanges = useCallback(() => {
    if (!article || !originalArticle) return false;
    
    // Compare article fields
    const articleChanged = 
      article.title !== originalArticle.title ||
      article.slug !== originalArticle.slug ||
      article.content !== originalArticle.content ||
      article.summary !== originalArticle.summary;
    
    // Compare themes
    const themesChanged = JSON.stringify(themes) !== JSON.stringify(originalThemes);
    
    // Compare explain box items
    const explainBoxChanged = JSON.stringify(explainBoxItems) !== JSON.stringify(originalExplainBoxItems);
    
    return articleChanged || themesChanged || explainBoxChanged;
  }, [article, originalArticle, themes, originalThemes, explainBoxItems, originalExplainBoxItems]);

  const handleBackToArticle = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (hasUnsavedChanges()) {
      e.preventDefault();
      if (confirm('You have unsaved changes. Are you sure you want to leave? Your changes will be lost.')) {
        const hasExplainBox = explainBoxItems.some(item => item.trim().length > 0);
        const explainBoxParam = hasExplainBox ? '&explain_box=show' : '';
        window.location.href = `/articles/${article.slug}?study=${article.studyId || 'eonc'}&version=3${explainBoxParam}`;
      }
    }
  };

  // Build the back to article URL with explain_box parameter if content exists
  const getBackToArticleUrl = () => {
    const hasExplainBox = explainBoxItems.some(item => item.trim().length > 0);
    const explainBoxParam = hasExplainBox ? '&explain_box=show' : '';
    return `/articles/${article.slug}?study=${article.studyId || 'eonc'}&version=3${explainBoxParam}`;
  };

  // Warn on browser navigation (back button, close tab, etc.)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges()) {
        e.preventDefault();
        e.returnValue = ''; // Chrome requires returnValue to be set
        return ''; // For older browsers
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  if (loading) return <div className="p-8">Loading...</div>;
  if (!loading && error) return <div className="p-8 text-red-500">{error}</div>;
  if (!article) return null;

  return (
    <div className="max-w-3xl p-8 mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="w-full text-2xl font-bold text-center">Edit Article</h1>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block mb-2 font-bold">Title <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={article.title || ''}
            onChange={e => handleChange('title', e.target.value)}
            className="w-full px-3 py-2 border rounded"
            required
          />
        </div>
        <div>
          <label className="block mb-2 font-bold">Slug <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={article.slug || ''}
            onChange={e => handleSlugChange(e.target.value)}
            onBlur={handleSlugBlur}
            onPaste={(e) => {
              e.preventDefault();
              const pastedText = e.clipboardData.getData('text');
              handleSlugChange(pastedText);
            }}
            className="w-full px-3 py-2 border rounded"
            placeholder="article-title-slug"
            required
          />
          <p className="mt-1 text-xs text-gray-500">
            Text will be automatically converted to lowercase, hyphen-separated format
          </p>
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
          <label className="block mb-2 font-bold">Explanation Box (Why we wrote this)</label>
          <p className="mb-2 text-sm text-gray-600">
            Add items that will appear in the &ldquo;Behind the Story&rdquo; section when <code className="px-1 bg-gray-100 rounded">?explain_box=show</code> is in the URL.
          </p>
          <div className="flex flex-col gap-2">
            {explainBoxItems.map((item, idx) => (
              <div key={idx} className="relative flex items-center gap-2">
                <textarea
                  value={item}
                  onChange={e => handleExplainBoxChange(idx, e.target.value)}
                  placeholder="Enter explanation item..."
                  className="flex-1 px-3 py-2 border rounded"
                  rows={2}
                />
                <button
                  type="button"
                  className="px-3 py-2 text-gray-400 hover:text-red-500"
                  onClick={() => handleRemoveExplainBoxItem(idx)}
                  aria-label="Remove explanation item"
                >
                  &times;
                </button>
              </div>
            ))}
            <button
              type="button"
              className="self-start px-4 py-2 text-blue-700 bg-blue-100 rounded hover:bg-blue-200"
              onClick={handleAddExplainBoxItem}
            >
              + Add Explanation Item
            </button>
          </div>
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
          <label className="block mb-2 font-bold">Content <span className="text-red-500">*</span></label>
          <InsertImageButton
            textareaId="article-content-textarea"
            onInsert={(newValue) => handleChange('content', newValue)}
          />
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
              href={getBackToArticleUrl()}
              onClick={handleBackToArticle}
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
