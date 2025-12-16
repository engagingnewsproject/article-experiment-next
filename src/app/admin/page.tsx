'use client';

import { signOut, onAuthChange, getCurrentUser } from '@/lib/auth';
import type { User } from 'firebase/auth';
import { loadStudies, StudyDefinition } from '@/lib/studies';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/admin/PageHeader';

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
    <div className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <PageHeader 
            title="Admin Dashboard" 
            subtitle="Manage your Article Experiment project" 
          />

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">


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

          </div>
        </div>
      </div>
  );
}