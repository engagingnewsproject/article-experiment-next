'use client';

import { Header } from '@/components/Header';
import { signOut, onAuthChange, getCurrentUser } from '@/lib/auth';
import type { User } from 'firebase/auth';
import { loadStudies, StudyDefinition } from '@/lib/studies';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function AdminPage() {
  const [userEmail, setUserEmail] = useState('');
  const [studies, setStudies] = useState<StudyDefinition[]>([]);
  const [studiesLoading, setStudiesLoading] = useState(true);

  // Determine Firebase project based on current domain
  const getFirebaseConsoleUrl = () => {
    if (typeof window === 'undefined') {
      // Default to prod on server-side
      return 'https://console.firebase.google.com/u/0/project/article-experiment-next/firestore/databases/-default-/data/~2Farticles~2F0jwWfOt1afXnhaiYYgnQ';
    }
    
    const hostname = window.location.hostname;
    const isDev = hostname.includes('dev--') || hostname === 'localhost' || hostname === '127.0.0.1';
    
    if (isDev) {
      return 'https://console.firebase.google.com/u/0/project/article-experiment-next-dev/firestore/databases/-default-/data/~2Farticles';
    }
    
    return 'https://console.firebase.google.com/u/0/project/article-experiment-next/overview';
  };

  useEffect(() => {
    // Subscribe to Firebase Auth state changes to get user email
    const unsubscribe = onAuthChange((user: User | null) => {
      if (user && user.email) {
        setUserEmail(user.email);
        loadStudiesData();
      } else {
        setUserEmail('');
      }
    });

    // Load studies on mount (auth is already handled by layout)
    const user = getCurrentUser();
    if (user && user.email) {
      setUserEmail(user.email);
      loadStudiesData();
    }

    return () => unsubscribe();
  }, []);

  const loadStudiesData = async () => {
        try {
          setStudiesLoading(true);
          const loadedStudies = await loadStudies();
          setStudies(loadedStudies);
        } catch (error) {
          console.error('Error loading studies:', error);
          setStudies([]);
        } finally {
          setStudiesLoading(false);
        }
      };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
  }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="mb-2 text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">Manage your Article Experiment project</p>
              <p className="mt-1 text-sm text-gray-500">Logged in as: {userEmail}</p>
            </div>
            <div className="flex space-x-2">
              <a
                href={getFirebaseConsoleUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 text-sm text-orange-600 border border-orange-300 rounded-md hover:text-orange-800 hover:bg-orange-50"
              >
                Firebase Console
              </a>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:text-gray-800 hover:bg-gray-50"
              >
                Sign Out
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Research Dashboard Card */}
            <div className="p-6 bg-white rounded-lg shadow">
              <div className="flex items-center mb-4">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h2 className="text-xl font-semibold text-gray-900">Research Dashboard</h2>
                  <p className="text-sm text-gray-600">View and analyze experimental data</p>
                </div>
              </div>
              <p className="mb-4 text-gray-700">
                Interactive dashboard for researchers to explore user activity, articles, comments, and export data for analysis.
              </p>
              <Link 
                href="/admin/research-dashboard"
                className="inline-flex items-center px-4 py-2 bg-blue-600 !text-white rounded-md hover:bg-blue-700"
              >
                Open Dashboard
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Add Comments Card */}
            <div className="p-6 bg-white rounded-lg shadow">
              <div className="flex items-center mb-4">
                <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h2 className="text-xl font-semibold text-gray-900">Add Default Comments</h2>
                  <p className="text-sm text-gray-600">Manage article comments</p>
                </div>
              </div>
              <p className="mb-4 text-gray-700">
                Add or import default comments for articles. Upload CSV files or manually enter comment data.
              </p>
              <Link 
                href="/admin/add-default-comments"
                className="inline-flex items-center px-4 py-2 bg-green-600 !text-white rounded-md hover:bg-green-700"
              >
                Manage Comments
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Articles Card */}
            <div className="p-6 bg-white rounded-lg shadow md:col-span-2">
              <div className="flex items-center mb-4">
                <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7M3 7l9 6 9-6M3 11l9 6 9-6" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h2 className="text-xl font-semibold text-gray-900">Articles</h2>
                  <p className="text-sm text-gray-600">View, search, and manage articles by study.</p>
                </div>
              </div>
              <p className="mb-4 text-gray-700">
                Access and manage articles for each study. Edit, delete, or add new articles as needed.
              </p>
              {studiesLoading ? (
                <div className="py-4 text-center text-gray-500">
                  Loading studies...
                </div>
              ) : studies.length === 0 ? (
                <div className="py-4 text-center text-gray-500">
                  No studies found. Add a study first.
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {studies.map((study, index) => {
                    // Alternate colors for visual distinction
                    const colorClasses = index % 2 === 0 
                      ? 'bg-purple-600 hover:bg-purple-700' 
                      : 'bg-indigo-600 hover:bg-indigo-700';
                    
                    return (
                      <Link 
                        key={study.id}
                        href={`/admin/articles?study=${study.id}`}
                        className={`w-full inline-flex items-center justify-center px-4 py-2 ${colorClasses} !text-white rounded-md`}
                      >
                        Manage {study.name} Articles
                        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Manage Studies Card */}
            <div className="p-6 bg-white rounded-lg shadow md:col-span-2">
              <div className="flex items-center mb-4">
                <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h2 className="text-xl font-semibold text-gray-900">Manage Studies</h2>
                  <p className="text-sm text-gray-600">Add and manage research studies</p>
                </div>
              </div>
              <p className="mb-4 text-gray-700">
                Create new studies, view existing ones, and manage study configurations. Studies separate research projects and their data.
              </p>
              <Link 
                href="/admin/manage-studies"
                className="inline-flex items-center px-4 py-2 bg-orange-600 !text-white rounded-md hover:bg-orange-700"
              >
                Manage Studies
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Manage Study Configs Card */}
            <div className="p-6 bg-white rounded-lg shadow md:col-span-2">
              <div className="flex items-center mb-4">
                <div className="flex items-center justify-center w-12 h-12 bg-teal-100 rounded-lg">
                  <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h2 className="text-xl font-semibold text-gray-900">Manage Study Configs</h2>
                  <p className="text-sm text-gray-600">Configure project-specific settings</p>
                </div>
              </div>
              <p className="mb-4 text-gray-700">
                Set default author information, publication dates, site names, and feature flags for each study. Code-defined configs (like &apos;eonc&apos;) cannot be edited here.
              </p>
              <Link 
                href="/admin/manage-project-configs"
                className="inline-flex items-center px-4 py-2 bg-teal-600 !text-white rounded-md hover:bg-teal-700"
              >
                Manage Configs
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}