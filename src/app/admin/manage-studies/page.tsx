/**
 * Manage Studies Admin Page
 * 
 * This page allows administrators to view, add, edit, and delete studies.
 * Studies are stored in Firestore and can be managed through this UI.
 */

'use client';

import { Header } from '@/components/Header';
import { signOut, getCurrentUser, onAuthChange } from '@/lib/auth';
import { User } from 'firebase/auth';
import { deleteStudy, getStudies, saveStudy, Study, getProjectConfigFirestore } from '@/lib/firestore';
import { CODE_STUDIES, clearStudiesCache } from '@/lib/studies';
import { useEffect, useState } from 'react';

export default function ManageStudiesPage() {
  const [userEmail, setUserEmail] = useState('');
  const [studies, setStudies] = useState<Study[]>([]);
  const [configStatuses, setConfigStatuses] = useState<Record<string, 'code-defined' | 'firestore' | 'default'>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form state
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    aliases: '',
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
      
      // Load config statuses for each study
      const statuses: Record<string, 'code-defined' | 'firestore' | 'default'> = {};
      for (const study of mergedStudies) {
        if (codeStudyIds.has(study.id)) {
          statuses[study.id] = 'code-defined';
        } else {
          const config = await getProjectConfigFirestore(study.id);
          statuses[study.id] = config ? 'firestore' : 'default';
        }
      }
      setConfigStatuses(statuses);
      
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

    // Check if ID already exists
    if (studies.some(s => s.id === formData.id.trim())) {
      setError('A study with this ID already exists');
      return;
    }

    try {
      const aliases = formData.aliases
        .split(',')
        .map(a => a.trim())
        .filter(a => a.length > 0);

      await saveStudy({
        id: formData.id.trim(),
        name: formData.name.trim(),
        aliases: aliases.length > 0 ? aliases : undefined,
      });

      setSuccess(`Study "${formData.name}" added successfully!`);
      setFormData({ id: '', name: '', aliases: '' });
      setIsAdding(false);
      clearStudiesCache(); // Clear cache so new study is loaded
      await loadStudies();
    } catch (err) {
      console.error('Error saving study:', err);
      setError(err instanceof Error ? err.message : 'Failed to save study');
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
    <>
      <Header />
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

          {/* Add Study Form */}
          {isAdding ? (
            <div className="mb-6 p-6 bg-white rounded-lg shadow">
              <h2 className="mb-4 text-xl font-semibold text-gray-900">Add New Study</h2>
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
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Lowercase letters, numbers, hyphens, and underscores only. Used in URLs: ?study=ID
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
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Add Study
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAdding(false);
                      setFormData({ id: '', name: '', aliases: '' });
                      setError(null);
                    }}
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
                  const configStatus = configStatuses[study.id] || 'default';
                  
                  return (
                    <div key={study.id} className="p-6 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 flex-wrap">
                            <h3 className="text-lg font-semibold text-gray-900">{study.name}</h3>
                            {isCodeDefined && (
                              <span className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded">
                                Code-defined
                              </span>
                            )}
                            {configStatus === 'firestore' && (
                              <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded">
                                Firestore Config
                              </span>
                            )}
                            {configStatus === 'default' && !isCodeDefined && (
                              <span className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded">
                                Default Config
                              </span>
                            )}
                          </div>
                          {configStatus && (
                            <p className="mt-1 text-xs text-gray-500">
                              <span className="font-medium">Config:</span> {
                                configStatus === 'code-defined' ? 'Code-defined (cannot be edited)' :
                                configStatus === 'firestore' ? 'Custom Firestore config' :
                                'Using default EONC config'
                              }
                            </p>
                          )}
                          <p className="mt-1 text-sm text-gray-600">
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
                          <p className="mt-2 text-xs text-gray-500">
                            URL: <code className="px-1 py-0.5 bg-gray-100 rounded">/?study={study.id}</code>
                          </p>
                        </div>
                        {!isCodeDefined && (
                          <button
                            onClick={() => handleDelete(study.id)}
                            className="ml-4 px-3 py-1 text-sm text-red-600 border border-red-300 rounded-md hover:bg-red-50"
                          >
                            Delete
                          </button>
                        )}
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
              <li>Config status shows which configuration each study uses: Code-defined, Firestore, or Default</li>
              <li>To create or edit a study&apos;s configuration, go to <a href="/admin/manage-project-configs" className="underline">Manage Study Configs</a></li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}

