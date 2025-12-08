/**
 * Admin page for managing study configurations.
 * 
 * This page allows administrators to:
 * - View all study configs (code-defined and Firestore)
 * - Edit Firestore-based configs
 * - Create new configs for studies
 * - Delete Firestore-based configs
 * 
 * Code-defined configs (like 'eonc') cannot be edited or deleted here.
 */

"use client";

import { Header } from '@/components/Header';
import { db } from '@/lib/firebase';
import { 
  getProjectConfigFirestore, 
  saveProjectConfigFirestore, 
  deleteProjectConfigFirestore,
  ProjectConfigFirestore 
} from '@/lib/firestore';
import { loadStudies } from '@/lib/studies';
import { getProjectConfig, clearProjectConfigsCache, loadProjectConfigs } from '@/lib/projectConfig';
import { StudyDefinition } from '@/lib/studies';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ManageProjectConfigsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [studies, setStudies] = useState<StudyDefinition[]>([]);
  const [configs, setConfigs] = useState<Record<string, ProjectConfigFirestore | null>>({});
  const [editingStudyId, setEditingStudyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      // Load all studies
      const allStudies = await loadStudies();
      setStudies(allStudies);

      // Load configs for each study
      const configsMap: Record<string, ProjectConfigFirestore | null> = {};
      for (const study of allStudies) {
        const config = await getProjectConfigFirestore(study.id);
        configsMap[study.id] = config;
      }
      setConfigs(configsMap);
    } catch (err) {
      setError('Error loading data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveConfig(e: React.FormEvent<HTMLFormElement>, studyId: string) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    try {
      const formData = new FormData(e.currentTarget);
      const currentConfig = getProjectConfig(studyId);
      
      const configData: Omit<ProjectConfigFirestore, 'createdAt' | 'updatedAt'> = {
        studyId,
        name: formData.get('name') as string || currentConfig.name,
        siteName: formData.get('siteName') as string || currentConfig.siteName,
        articleConfig: {
          author: {
            name: formData.get('authorName') as string || currentConfig.articleConfig.author.name,
            bio: {
              personal: formData.get('authorBioPersonal') as string || currentConfig.articleConfig.author.bio.personal,
              basic: formData.get('authorBioBasic') as string || currentConfig.articleConfig.author.bio.basic,
            },
            image: {
              src: formData.get('authorImageSrc') as string || currentConfig.articleConfig.author.image.src,
              alt: formData.get('authorImageAlt') as string || currentConfig.articleConfig.author.image.alt,
            },
          },
          pubdate: formData.get('pubdate') as string || currentConfig.articleConfig.pubdate,
          siteName: formData.get('siteName') as string || currentConfig.siteName,
        },
        usesAuthorVariations: formData.get('usesAuthorVariations') === 'on',
        usesExplainBox: formData.get('usesExplainBox') === 'on',
        usesCommentVariations: formData.get('usesCommentVariations') === 'on',
        usesSummaries: formData.get('usesSummaries') === 'on',
      };

      await saveProjectConfigFirestore(configData);
      clearProjectConfigsCache();
      // Reload the cache so getProjectConfig() returns updated values
      await loadProjectConfigs();
      setSuccess('Config saved successfully!');
      setEditingStudyId(null);
      // Reload data to refresh the UI
      await loadData();
    } catch (err) {
      setError('Error saving config');
      console.error(err);
    }
  }

  async function handleDeleteConfig(studyId: string) {
    if (!confirm(`Are you sure you want to delete the config for "${studies.find(s => s.id === studyId)?.name}"?`)) {
      return;
    }

    setError(null);
    setSuccess(null);
    
    try {
      await deleteProjectConfigFirestore(studyId);
      clearProjectConfigsCache();
      // Reload the cache so getProjectConfig() returns updated values
      await loadProjectConfigs();
      setSuccess('Config deleted successfully!');
      await loadData();
    } catch (err) {
      setError('Error deleting config');
      console.error(err);
    }
  }

  function isCodeDefined(studyId: string): boolean {
    return studyId === 'eonc'; // Only eonc is code-defined now
  }

  if (loading) {
    return (
      <div className="max-w-4xl p-8 mx-auto">
        <Header />
        <div className="p-8">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl p-8 mx-auto">
      <Header />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Manage Study Configs</h1>
        <button
          onClick={() => router.push('/admin')}
          className="px-4 py-2 text-white bg-gray-500 rounded hover:bg-gray-600"
        >
          Back to Admin
        </button>
      </div>

      {error && (
        <div className="p-4 mb-4 text-red-700 bg-red-100 border border-red-400 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 mb-4 text-green-700 bg-green-100 border border-green-400 rounded">
          {success}
        </div>
      )}

      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded">
        <p className="text-sm text-gray-700">
          <strong>Note:</strong> Code-defined configs (like &apos;eonc&apos;) cannot be edited or deleted here.
          They must be modified in the codebase. Firestore-based configs can be fully managed here.
        </p>
      </div>

      <div className="space-y-6">
        {studies.map(study => {
          const firestoreConfig = configs[study.id];
          const codeDefined = isCodeDefined(study.id);
          // Use Firestore config if available, otherwise fall back to getProjectConfig (which includes code-defined or defaults)
          const displayConfig = firestoreConfig 
            ? {
                name: firestoreConfig.name,
                siteName: firestoreConfig.siteName,
                articleConfig: firestoreConfig.articleConfig,
                usesAuthorVariations: firestoreConfig.usesAuthorVariations,
                usesExplainBox: firestoreConfig.usesExplainBox,
                usesCommentVariations: firestoreConfig.usesCommentVariations,
                usesSummaries: firestoreConfig.usesSummaries,
              }
            : getProjectConfig(study.id);
          const isEditing = editingStudyId === study.id;

          return (
            <div key={study.id} className="p-6 border rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold">{study.name}</h2>
                  <p className="text-sm text-gray-600">Study ID: <code>{study.id}</code></p>
                  {codeDefined && (
                    <span className="inline-block px-2 py-1 mt-1 text-xs font-semibold text-blue-700 bg-blue-100 rounded">
                      Code-Defined
                    </span>
                  )}
                  {!codeDefined && firestoreConfig && (
                    <span className="inline-block px-2 py-1 mt-1 text-xs font-semibold text-green-700 bg-green-100 rounded">
                      Firestore Config
                    </span>
                  )}
                  {!codeDefined && !firestoreConfig && (
                    <span className="inline-block px-2 py-1 mt-1 text-xs font-semibold text-gray-700 bg-gray-100 rounded">
                      Using Default Config
                    </span>
                  )}
                </div>
                {!codeDefined && (
                  <div className="flex gap-2">
                    {!isEditing && (
                      <>
                        <button
                          onClick={() => setEditingStudyId(study.id)}
                          className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600"
                        >
                          {firestoreConfig ? 'Edit' : 'Create'} Config
                        </button>
                        {firestoreConfig && (
                          <button
                            onClick={() => handleDeleteConfig(study.id)}
                            className="px-4 py-2 text-white bg-red-500 rounded hover:bg-red-600"
                          >
                            Delete
                          </button>
                        )}
                      </>
                    )}
                    {isEditing && (
                      <button
                        onClick={() => setEditingStudyId(null)}
                        className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                )}
              </div>

              {isEditing ? (
                <form
                  onSubmit={(e) => handleSaveConfig(e, study.id)}
                  className="space-y-4"
                >
                  <div>
                    <label className="block mb-1 text-sm font-medium">Name</label>
                    <input
                      type="text"
                      name="name"
                      defaultValue={displayConfig.name}
                      className="w-full px-3 py-2 border rounded"
                      required
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium">Site Name</label>
                    <input
                      type="text"
                      name="siteName"
                      defaultValue={displayConfig.siteName}
                      className="w-full px-3 py-2 border rounded"
                      required
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium">Author Name</label>
                    <input
                      type="text"
                      name="authorName"
                      defaultValue={displayConfig.articleConfig.author.name}
                      className="w-full px-3 py-2 border rounded"
                      required
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium">Author Bio (Personal)</label>
                    <textarea
                      name="authorBioPersonal"
                      defaultValue={displayConfig.articleConfig.author.bio.personal}
                      className="w-full px-3 py-2 border rounded"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium">Author Bio (Basic)</label>
                    <textarea
                      name="authorBioBasic"
                      defaultValue={displayConfig.articleConfig.author.bio.basic}
                      className="w-full px-3 py-2 border rounded"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium">Author Image Source</label>
                    <input
                      type="text"
                      name="authorImageSrc"
                      defaultValue={displayConfig.articleConfig.author.image.src}
                      className="w-full px-3 py-2 border rounded"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium">Author Image Alt Text</label>
                    <input
                      type="text"
                      name="authorImageAlt"
                      defaultValue={displayConfig.articleConfig.author.image.alt}
                      className="w-full px-3 py-2 border rounded"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium">Publication Date</label>
                    <input
                      type="text"
                      name="pubdate"
                      defaultValue={displayConfig.articleConfig.pubdate}
                      className="w-full px-3 py-2 border rounded"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Feature Flags</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="usesAuthorVariations"
                        defaultChecked={displayConfig.usesAuthorVariations}
                        className="w-4 h-4"
                      />
                      <label className="text-sm">Uses Author Variations</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="usesExplainBox"
                        defaultChecked={displayConfig.usesExplainBox}
                        className="w-4 h-4"
                      />
                      <label className="text-sm">Uses Explanation Box</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="usesCommentVariations"
                        defaultChecked={displayConfig.usesCommentVariations}
                        className="w-4 h-4"
                      />
                      <label className="text-sm">Uses Comment Variations</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="usesSummaries"
                        defaultChecked={displayConfig.usesSummaries}
                        className="w-4 h-4"
                      />
                      <label className="text-sm">Uses Summaries</label>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="px-4 py-2 text-white bg-green-500 rounded hover:bg-green-600"
                  >
                    Save Config
                  </button>
                </form>
              ) : (
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Site Name:</strong> {displayConfig.siteName}</p>
                  <p><strong>Author:</strong> {displayConfig.articleConfig.author.name}</p>
                  <p><strong>Publication Date:</strong> {displayConfig.articleConfig.pubdate}</p>
                  <p><strong>Features:</strong></p>
                  <ul className="ml-4 list-disc">
                    {displayConfig.usesAuthorVariations && <li>Author Variations</li>}
                    {displayConfig.usesExplainBox && <li>Explanation Box</li>}
                    {displayConfig.usesCommentVariations && <li>Comment Variations</li>}
                    {displayConfig.usesSummaries && <li>Summaries</li>}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

