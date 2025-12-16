/**
 * Manage Studies Admin Page
 * 
 * This page allows administrators to view, add, edit, and delete studies.
 * Studies are stored in Firestore and can be managed through this UI.
 */

'use client';

import { signOut, getCurrentUser, onAuthChange } from '@/lib/auth';
import { User } from 'firebase/auth';
import { deleteStudy, getStudies, saveStudy, Study, getStudy } from '@/lib/firestore';
import { CODE_STUDIES, clearStudiesCache } from '@/lib/studies';
import { defaultConfig } from '@/lib/config';
import { useEffect, useState } from 'react';

export default function ManageStudiesPage() {
  const [userEmail, setUserEmail] = useState('');
  const [studies, setStudies] = useState<Study[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form state
  const [isAdding, setIsAdding] = useState(false);
  const [editingStudyId, setEditingStudyId] = useState<string | null>(null);
  const [showAuthorFields, setShowAuthorFields] = useState(false);
  const [showPubdateField, setShowPubdateField] = useState(false);
  const [showSiteNameField, setShowSiteNameField] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    aliases: '',
    authorName: '',
    authorBioPersonal: '',
    authorBioBasic: '',
    authorImageSrc: '',
    authorImageAlt: '',
    pubdate: '',
    siteName: '',
  });

  useEffect(() => {
    // Subscribe to Firebase Auth state changes
    const unsubscribe = onAuthChange((user: User | null) => {
      if (user && user.email) {
        setUserEmail(user.email);
        loadStudies();
      } else {
        setUserEmail('');
      }
    });

    // Check initial auth state
    const user = getCurrentUser();
    if (user && user.email) {
      setUserEmail(user.email);
      loadStudies();
    }

    return () => unsubscribe();
  }, []);

  const loadStudies = async () => {
    try {
      setLoading(true);
      const firestoreStudies = await getStudies();
      
      // Merge with code-defined studies (code takes precedence for existing ones)
      const codeStudyIds = new Set(CODE_STUDIES.map(s => s.id));
      const mergedStudies = [
        ...CODE_STUDIES.map(codeStudy => {
          const firestoreStudy = firestoreStudies.find(s => s.id === codeStudy.id);
          return firestoreStudy || {
            id: codeStudy.id,
            name: codeStudy.name,
            aliases: codeStudy.aliases || [],
          };
        }),
        ...firestoreStudies.filter(s => !codeStudyIds.has(s.id))
      ];
      
      setStudies(mergedStudies);
      setError(null);
    } catch (err) {
      console.error('Error loading studies:', err);
      setError('Failed to load studies. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
    setUserEmail('');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      id: '',
      name: '',
      aliases: '',
      authorName: '',
      authorBioPersonal: '',
      authorBioBasic: '',
      authorImageSrc: '',
      authorImageAlt: '',
      pubdate: '',
      siteName: '',
    });
    setShowAuthorFields(false);
    setShowPubdateField(false);
    setShowSiteNameField(false);
    setIsAdding(false);
    setEditingStudyId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validate
    if (!formData.id.trim()) {
      setError('Study ID is required');
      return;
    }
    if (!formData.name.trim()) {
      setError('Study name is required');
      return;
    }

    // Validate ID format (lowercase, alphanumeric, hyphens, underscores)
    const idRegex = /^[a-z0-9_-]+$/;
    if (!idRegex.test(formData.id.trim())) {
      setError('Study ID must be lowercase and contain only letters, numbers, hyphens, and underscores');
      return;
    }

    // Check if ID already exists (only when adding, not editing)
    if (!editingStudyId && studies.some(s => s.id === formData.id.trim())) {
      setError('A study with this ID already exists');
      return;
    }

    try {
      const aliases = formData.aliases
        .split(',')
        .map(a => a.trim())
        .filter(a => a.length > 0);

      // Build author object if any author fields are filled
      const author = (formData.authorName.trim() || formData.authorBioPersonal.trim() || formData.authorBioBasic.trim() || formData.authorImageSrc.trim())
        ? {
            name: formData.authorName.trim() || defaultConfig.author.name,
            bio: {
              personal: formData.authorBioPersonal.trim() || defaultConfig.author.bio.personal,
              basic: formData.authorBioBasic.trim() || defaultConfig.author.bio.basic,
            },
            image: {
              src: formData.authorImageSrc.trim() || defaultConfig.author.image.src,
              alt: formData.authorImageAlt.trim() || defaultConfig.author.image.alt,
            },
          }
        : undefined;

      await saveStudy({
        id: formData.id.trim(),
        name: formData.name.trim(),
        aliases: aliases.length > 0 ? aliases : undefined,
        author,
        pubdate: formData.pubdate.trim() || undefined,
        siteName: formData.siteName.trim() || undefined,
      });

      setSuccess(`Study "${formData.name}" ${editingStudyId ? 'updated' : 'added'} successfully!`);
      resetForm();
      clearStudiesCache();
      await loadStudies();
    } catch (err) {
      console.error('Error saving study:', err);
      setError(err instanceof Error ? err.message : 'Failed to save study');
    }
  };

  const handleEdit = async (studyId: string) => {
    try {
      setError(null);
      const study = await getStudy(studyId);
      if (!study) {
        setError('Study not found');
        return;
      }

      setEditingStudyId(studyId);
      setFormData({
        id: study.id,
        name: study.name,
        aliases: study.aliases?.join(', ') || '',
        authorName: study.author?.name || '',
        authorBioPersonal: study.author?.bio.personal || '',
        authorBioBasic: study.author?.bio.basic || '',
        authorImageSrc: study.author?.image.src || '',
        authorImageAlt: study.author?.image.alt || '',
        pubdate: study.pubdate || '',
        siteName: study.siteName || '',
      });
      
      // Show fields if they have values
      setShowAuthorFields(!!study.author);
      setShowPubdateField(!!study.pubdate);
      setShowSiteNameField(!!study.siteName);
      
      setIsAdding(true); // Use the same form for editing
      
      // Scroll to form after a brief delay to ensure it's rendered
      setTimeout(() => {
        const formElement = document.querySelector('[data-study-form]');
        if (formElement) {
          formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } catch (err) {
      console.error('Error loading study for edit:', err);
      setError(err instanceof Error ? err.message : 'Failed to load study for editing');
    }
  };

  const handleDelete = async (studyId: string) => {
    if (!confirm(`Are you sure you want to delete the study "${studyId}"? This action cannot be undone.`)) {
      return;
    }

    // Check if it's a code-defined study
    if (CODE_STUDIES.some(s => s.id === studyId)) {
      setError('Cannot delete code-defined studies. They must be removed from the codebase.');
      return;
    }

    try {
      await deleteStudy(studyId);
      setSuccess(`Study "${studyId}" deleted successfully!`);
      clearStudiesCache(); // Clear cache so deleted study is removed
      await loadStudies();
    } catch (err) {
      console.error('Error deleting study:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete study');
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="mb-2 text-3xl font-bold text-gray-900">Manage Studies</h1>
              <p className="text-gray-600">View, add, edit, and delete research studies</p>
              <p className="mt-1 text-sm text-gray-500">Logged in as: {userEmail}</p>
            </div>
            <div className="flex space-x-2">
              <a
                href="/admin"
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:text-gray-800 hover:bg-gray-50"
              >
                ← Back to Admin
              </a>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:text-gray-800 hover:bg-gray-50"
              >
                Sign Out
              </button>
            </div>
          </div>

          {/* Success/Error Messages */}
          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800">{success}</p>
            </div>
          )}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Add/Edit Study Form */}
          {isAdding ? (
            <div className="mb-6 p-6 bg-white rounded-lg shadow" data-study-form>
              <h2 className="mb-4 text-xl font-semibold text-gray-900">
                {editingStudyId ? 'Edit Study' : 'Add New Study'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Study ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.id}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value.toLowerCase() })}
                    placeholder="e.g., newstudy"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={!!editingStudyId}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Lowercase letters, numbers, hyphens, and underscores only. Used in URLs: ?study=ID
                    {editingStudyId && ' (cannot be changed)'}
                  </p>
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Study Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., New Research Study"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Aliases (optional)
                  </label>
                  <input
                    type="text"
                    value={formData.aliases}
                    onChange={(e) => setFormData({ ...formData, aliases: e.target.value })}
                    placeholder="e.g., oldname, legacyid (comma-separated)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Comma-separated list of alternative IDs for backward compatibility
                  </p>
                </div>

                {/* Optional Defaults Section */}
                <div className="pt-4 border-t border-gray-200">
                  <p className="mb-3 text-sm font-medium text-gray-700">
                    Article Defaults (optional) - Used when creating new articles for this study
                  </p>
                  
                  {/* Author Fields */}
                  <div className="mb-4">
                    <button
                      type="button"
                      onClick={() => setShowAuthorFields(!showAuthorFields)}
                      className="text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                      {showAuthorFields ? '−' : '+'} Set Study Author
                    </button>
                    {showAuthorFields && (
                      <div className="mt-2 space-y-3 pl-4 border-l-2 border-gray-200">
                        <div>
                          <label className="block mb-1 text-xs font-medium text-gray-600">Author Name</label>
                          <input
                            type="text"
                            value={formData.authorName}
                            onChange={(e) => setFormData({ ...formData, authorName: e.target.value })}
                            placeholder={defaultConfig.author.name}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block mb-1 text-xs font-medium text-gray-600">Author Bio (Personal)</label>
                          <textarea
                            value={formData.authorBioPersonal}
                            onChange={(e) => setFormData({ ...formData, authorBioPersonal: e.target.value })}
                            placeholder={defaultConfig.author.bio.personal.substring(0, 100) + '...'}
                            rows={3}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block mb-1 text-xs font-medium text-gray-600">Author Bio (Basic)</label>
                          <textarea
                            value={formData.authorBioBasic}
                            onChange={(e) => setFormData({ ...formData, authorBioBasic: e.target.value })}
                            placeholder={defaultConfig.author.bio.basic.substring(0, 100) + '...'}
                            rows={3}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block mb-1 text-xs font-medium text-gray-600">Author Image URL</label>
                          <input
                            type="text"
                            value={formData.authorImageSrc}
                            onChange={(e) => setFormData({ ...formData, authorImageSrc: e.target.value })}
                            placeholder={defaultConfig.author.image.src}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block mb-1 text-xs font-medium text-gray-600">Author Image Alt Text</label>
                          <input
                            type="text"
                            value={formData.authorImageAlt}
                            onChange={(e) => setFormData({ ...formData, authorImageAlt: e.target.value })}
                            placeholder={defaultConfig.author.image.alt}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Publication Date Field */}
                  <div className="mb-4">
                    <button
                      type="button"
                      onClick={() => setShowPubdateField(!showPubdateField)}
                      className="text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                      {showPubdateField ? '−' : '+'} Set Study Publication Date
                    </button>
                    {showPubdateField && (
                      <div className="mt-2 pl-4 border-l-2 border-gray-200">
                        <input
                          type="text"
                          value={formData.pubdate}
                          onChange={(e) => setFormData({ ...formData, pubdate: e.target.value })}
                          placeholder={defaultConfig.pubdate}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                        />
                        <p className="mt-1 text-xs text-gray-500">e.g., "1 day ago", "Aug. 6, 2019"</p>
                      </div>
                    )}
                  </div>

                  {/* Site Name Field */}
                  <div className="mb-4">
                    <button
                      type="button"
                      onClick={() => setShowSiteNameField(!showSiteNameField)}
                      className="text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                      {showSiteNameField ? '−' : '+'} Set Site Title
                    </button>
                    {showSiteNameField && (
                      <div className="mt-2 pl-4 border-l-2 border-gray-200">
                        <input
                          type="text"
                          value={formData.siteName}
                          onChange={(e) => setFormData({ ...formData, siteName: e.target.value })}
                          placeholder={defaultConfig.siteName}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {editingStudyId ? 'Update Study' : 'Add Study'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="mb-6">
              <button
                onClick={() => setIsAdding(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                + Add New Study
              </button>
            </div>
          )}

          {/* Studies List */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Existing Studies</h2>
              {loading && <p className="mt-2 text-sm text-gray-500">Loading studies...</p>}
            </div>
            {!loading && studies.length === 0 && (
              <div className="p-6 text-center text-gray-500">
                <p>No studies found. Add your first study above.</p>
              </div>
            )}
            {!loading && studies.length > 0 && (
              <div className="divide-y divide-gray-200">
                {studies.map((study) => {
                  const isCodeDefined = CODE_STUDIES.some(s => s.id === study.id);
                  const hasDefaults = !!(study.author || study.pubdate || study.siteName);
                  
                  return (
                    <div key={study.id} className="p-6 hover:bg-gray-50">
                      <div className="space-y-3">
                        {/* Top Row: Study Name and Tags */}
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-gray-900">{study.name}</h3>
                          <div className="flex items-center gap-2">
                            {isCodeDefined && (
                              <span className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded">
                                Code-defined
                              </span>
                            )}
                            {hasDefaults && (
                              <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded">
                                Has Defaults
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Bottom Row: Details and Action Buttons */}
                        <div className="flex items-end justify-between">
                          <div className="flex-1">
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">ID:</span> <code className="px-1 py-0.5 bg-gray-100 rounded">{study.id}</code>
                            </p>
                            {study.aliases && study.aliases.length > 0 && (
                              <p className="mt-1 text-sm text-gray-600">
                                <span className="font-medium">Aliases:</span>{' '}
                                {study.aliases.map((alias, idx) => (
                                  <span key={alias}>
                                    <code className="px-1 py-0.5 bg-gray-100 rounded">{alias}</code>
                                    {idx < study.aliases!.length - 1 && ', '}
                                  </span>
                                ))}
                              </p>
                            )}
                            {hasDefaults && (
                              <div className="mt-2 text-xs text-gray-500">
                                <span className="font-medium">Defaults:</span>
                                {study.author && <span className="ml-1">Author: {study.author.name}</span>}
                                {study.pubdate && <span className="ml-1">Pubdate: {study.pubdate}</span>}
                                {study.siteName && <span className="ml-1">Site: {study.siteName}</span>}
                              </div>
                            )}
                            <p className="mt-2 text-xs text-gray-500">
                              URL: <code className="px-1 py-0.5 bg-gray-100 rounded">/?study={study.id}</code>
                            </p>
                          </div>
                          {!isCodeDefined && (
                            <div className="flex space-x-2 ml-4">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleEdit(study.id);
                                }}
                                className="px-3 py-1 text-sm text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(study.id)}
                                className="px-3 py-1 text-sm text-red-600 border border-red-300 rounded-md hover:bg-red-50"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h3 className="mb-2 text-sm font-semibold text-blue-900">About Studies</h3>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Studies are used to separate research projects and their data</li>
              <li>Each study has a unique ID used in URLs (e.g., <code className="px-1 bg-blue-100 rounded">?study=eonc</code>)</li>
              <li>Code-defined studies (shown with blue badge) cannot be deleted through this UI</li>
              <li>Optional defaults (author, publication date, site title) are used when creating new articles for the study</li>
              <li>Articles store their own values, so changing study defaults only affects new articles</li>
            </ul>
          </div>
        </div>
      </div>
  );
}

