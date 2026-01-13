"use client";
import { InsertImageButton } from '@/components/admin/InsertImageButton';
import { PageHeader } from '@/components/admin/PageHeader';
import { DefaultCommentsEditor } from '@/components/admin/DefaultCommentsEditor';
import { EditablePubdateField } from '@/components/admin/EditablePubdateField';
import { EditableAuthorNameField } from '@/components/admin/EditableAuthorNameField';
import { EditableSiteNameField } from '@/components/admin/EditableSiteNameField';
import { db } from '@/lib/firebase';
import { ArticleTheme, type Comment, updateArticleWithDefaultComments } from '@/lib/firestore';
import { doc, getDoc, updateDoc, Timestamp, deleteField } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback, useRef } from 'react';

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
  const [defaultComments, setDefaultComments] = useState<Comment[]>([]);
  const [originalDefaultComments, setOriginalDefaultComments] = useState<Comment[]>([]);
  const [showPubdate, setShowPubdate] = useState(false);
  const [showAuthorName, setShowAuthorName] = useState(false);
  const [showSiteName, setShowSiteName] = useState(false);
  const contentTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const isAdjustingTextareaHeight = useRef(false);
  const lastContentValue = useRef<string>('');
  const scrollPositionRef = useRef<number>(0);

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
          lastContentValue.current = data.content || '';
          const themesData = data.themes || [];
          setThemes(themesData);
          setOriginalThemes([...themesData]); // Store original themes
          const explainBoxData = Array.isArray(data.explain_box) ? data.explain_box : [];
          setExplainBoxItems(explainBoxData);
          setOriginalExplainBoxItems([...explainBoxData]); // Store original explain box items
          
          // Load default comments
          const commentsData = Array.isArray(data.default_comments) ? data.default_comments : [];
          // Convert Firestore Timestamps to ISO strings for editing
          const convertedComments = commentsData.map((comment: any) => ({
            ...comment,
            createdAt: comment.createdAt?.toDate ? comment.createdAt.toDate().toISOString() : comment.createdAt,
            replies: (comment.replies || []).map((reply: any) => ({
              ...reply,
              createdAt: reply.createdAt?.toDate ? reply.createdAt.toDate().toISOString() : reply.createdAt,
            })),
          }));
          setDefaultComments(convertedComments);
          setOriginalDefaultComments(JSON.parse(JSON.stringify(convertedComments))); // Deep copy for comparison
          
          // Initialize show/hide flags based on whether fields exist in the article
          // If a field exists (even if empty), show it. If it was deleted (undefined), hide it.
          setShowPubdate(data.pubdate !== undefined);
          setShowAuthorName(data.author?.name !== undefined);
          setShowSiteName(data.siteName !== undefined);
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
      
      // Handle pubdate, authorName, and siteName based on show flags
      // Use deleteField() to remove fields when unchecked, otherwise use the value
      const finalPubdate = showPubdate ? (article.pubdate || '') : deleteField();
      const finalAuthorName = showAuthorName ? (article.author?.name || '') : '';
      const finalSiteName = showSiteName ? (article.siteName || '') : deleteField();
      
      // Create the finalized article object with only the fields we want to update
      // Don't spread the entire article to avoid including fields that shouldn't be updated
      const finalizedArticle: any = {
        title: article.title,
        slug: finalizedSlug,
        content: article.content,
        summary: article.summary || '',
        themes: mappedThemes,
        explain_box: filteredExplainBoxItems,
        pubdate: finalPubdate,
        showLikeShare: article.showLikeShare || false,
      };
      
      // Handle author name - delete if unchecked, otherwise keep the value (even if empty)
      // Note: deleteField() can only be used at top level, so for nested fields we need a workaround
      if (showAuthorName) {
        finalizedArticle.author = {
          ...(article.author || {}),
          name: finalAuthorName || article.author?.name || '',
        };
      } else {
        // To delete a nested field like author.name, we need to:
        // 1. Update the author object without the name field (if other properties exist)
        // 2. Use a separate update with dot notation string to delete the nested field
        if (article.author) {
          // Preserve other author properties (bio, image, etc.) but remove name
          const { name, ...otherAuthorProps } = article.author;
          if (Object.keys(otherAuthorProps).length > 0) {
            finalizedArticle.author = otherAuthorProps;
          }
        }
        // Note: We'll handle the deletion in a separate updateDoc call below
        // because deleteField() for nested fields must be done separately
      }
      
      // Only include siteName if it should be shown, otherwise delete it
      if (showSiteName) {
        finalizedArticle.siteName = finalSiteName || article.siteName || '';
      } else {
        finalizedArticle.siteName = deleteField();
      }
      
      // If we need to delete author.name, we need to do it in a separate update
      // because deleteField() for nested fields requires special handling
      const needsAuthorNameDelete = !showAuthorName && article.author?.name !== undefined;
      
      if (needsAuthorNameDelete) {
        // First update: all other fields
        await updateDoc(docRef, finalizedArticle);
        // Second update: delete the nested author.name field using dot notation
        await updateDoc(docRef, {
          'author.name': deleteField()
        });
      } else {
        // Normal update for all fields
        await updateDoc(docRef, finalizedArticle);
      }
      
      // Update default comments if they changed
      const defaultCommentsChanged = JSON.stringify(defaultComments) !== JSON.stringify(originalDefaultComments);
      if (defaultCommentsChanged) {
        await updateArticleWithDefaultComments(String(id), defaultComments);
      }
      
      // Update both article and originalArticle states with the finalized values
      // Also update themes and explainBoxItems to match what was saved (filtered versions)
      // This ensures hasUnsavedChanges() will return false after saving
      // Note: deleteField() is only for Firestore, so we convert it to undefined for local state
      const stateArticle: any = {
        ...finalizedArticle,
        pubdate: showPubdate ? (finalizedArticle.pubdate || '') : undefined,
        siteName: showSiteName ? (finalizedArticle.siteName || '') : undefined,
      };
      
      // Handle author name in state - convert deleteField() to undefined
      if (showAuthorName) {
        stateArticle.author = {
          ...finalizedArticle.author,
          name: finalizedArticle.author?.name || '',
        };
      } else {
        stateArticle.author = {
          ...finalizedArticle.author,
          name: undefined,
        };
      }
      setArticle(stateArticle);
      setOriginalArticle({ ...stateArticle });
      setThemes([...mappedThemes]);
      setOriginalThemes([...mappedThemes]);
      setExplainBoxItems([...filteredExplainBoxItems]);
      setOriginalExplainBoxItems([...filteredExplainBoxItems]);
      setDefaultComments(JSON.parse(JSON.stringify(defaultComments))); // Deep copy
      setOriginalDefaultComments(JSON.parse(JSON.stringify(defaultComments))); // Deep copy
      // Update show flags to match saved state (use the show flags directly, not the final values)
      // because finalPubdate/finalSiteName might be deleteField() which is truthy
      setShowPubdate(showPubdate);
      setShowAuthorName(showAuthorName);
      setShowSiteName(showSiteName);
      setSuccess('Article updated successfully!');
    } catch (err) {
      console.error('Error updating article:', err);
      setError(`Error updating article: ${err instanceof Error ? err.message : 'Unknown error'}`);
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
      article.summary !== originalArticle.summary ||
      article.showLikeShare !== originalArticle.showLikeShare;
    
    // Compare metadata fields (considering show flags)
    // For deleted fields, we compare undefined vs undefined
    const pubdateChanged = (showPubdate ? (article.pubdate || '') : undefined) !== (originalArticle.pubdate !== undefined ? (originalArticle.pubdate || '') : undefined);
    const authorNameChanged = (showAuthorName ? (article.author?.name || '') : undefined) !== (originalArticle.author?.name !== undefined ? (originalArticle.author?.name || '') : undefined);
    const siteNameChanged = (showSiteName ? (article.siteName || '') : undefined) !== (originalArticle.siteName !== undefined ? (originalArticle.siteName || '') : undefined);
    
    // Compare show/hide flags
    const showFlagsChanged = 
      showPubdate !== (originalArticle.pubdate !== undefined) ||
      showAuthorName !== (originalArticle.author?.name !== undefined) ||
      showSiteName !== (originalArticle.siteName !== undefined);
    
    const metadataChanged = pubdateChanged || authorNameChanged || siteNameChanged;
    
    // Compare themes
    const themesChanged = JSON.stringify(themes) !== JSON.stringify(originalThemes);
    
    // Compare explain box items
    const explainBoxChanged = JSON.stringify(explainBoxItems) !== JSON.stringify(originalExplainBoxItems);
    
    // Compare default comments
    const defaultCommentsChanged = JSON.stringify(defaultComments) !== JSON.stringify(originalDefaultComments);
    
    return articleChanged || themesChanged || explainBoxChanged || defaultCommentsChanged || metadataChanged || showFlagsChanged;
  }, [article, originalArticle, themes, originalThemes, explainBoxItems, originalExplainBoxItems, defaultComments, originalDefaultComments, showPubdate, showAuthorName, showSiteName]);

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

  // Adjust textarea height only when content actually changes, not on other state updates
  useEffect(() => {
    if (contentTextareaRef.current && article?.content !== undefined) {
      const textarea = contentTextareaRef.current;
      const currentContent = article.content || '';
      // Only adjust if content actually changed and textarea is not focused
      if (currentContent !== lastContentValue.current && document.activeElement !== textarea && !isAdjustingTextareaHeight.current) {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        isAdjustingTextareaHeight.current = true;
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
        lastContentValue.current = currentContent;
        // Restore scroll position immediately
        requestAnimationFrame(() => {
          window.scrollTo(0, scrollTop);
          isAdjustingTextareaHeight.current = false;
        });
      }
    }
    // Only depend on article.content, not other state changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [article?.content]);

  if (loading) return <div className="p-8">Loading...</div>;
  if (!loading && error) return <div className="p-8 text-red-500">{error}</div>;
  if (!article) return null;

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <PageHeader title="Edit Article" />
      <form 
        onSubmit={handleSubmit} 
        className="space-y-6"
        onScroll={(e) => {
          // Prevent unwanted scrolling
          e.stopPropagation();
        }}
      >
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
            ref={contentTextareaRef}
            value={article.content || ''}
            onChange={e => {
              isAdjustingTextareaHeight.current = true;
              const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
              scrollPositionRef.current = scrollTop;
              handleChange('content', e.target.value);
              lastContentValue.current = e.target.value;
              e.target.style.height = 'auto';
              e.target.style.height = e.target.scrollHeight + 'px';
              // Restore scroll position after height adjustment
              requestAnimationFrame(() => {
                window.scrollTo(0, scrollPositionRef.current);
                isAdjustingTextareaHeight.current = false;
              });
            }}
            className="w-full px-3 py-2 overflow-hidden border rounded resize-none"
            style={{ minHeight: '120px' }}
            required
          />
        </div>
        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={article.showLikeShare || false}
              onChange={(e) => handleChange('showLikeShare', e.target.checked)}
              className="w-4 h-4"
            />
            <span className="font-medium">Show like & share article icons</span>
          </label>
        </div>
        
        {/* Article Metadata Fields */}
        <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
          <h3 className="text-lg font-bold mb-4">Article Metadata</h3>
          
          <EditablePubdateField
            value={article.pubdate || ''}
            enabled={showPubdate}
            onEnabledChange={setShowPubdate}
            onValueChange={(value) => handleChange('pubdate', value)}
          />
          
          <EditableAuthorNameField
            value={article.author?.name || ''}
            enabled={showAuthorName}
            onEnabledChange={setShowAuthorName}
            onValueChange={(value) => handleChange('author', { ...article.author, name: value })}
          />
          
          <EditableSiteNameField
            value={article.siteName || ''}
            enabled={showSiteName}
            onEnabledChange={setShowSiteName}
            onValueChange={(value) => handleChange('siteName', value)}
          />
        </div>
        
        {/* Default Comments Section */}
        <DefaultCommentsEditor 
          comments={defaultComments} 
          setComments={setDefaultComments} 
        />
        
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
    </div>
  );
}
