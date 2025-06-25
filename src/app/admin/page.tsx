'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import Link from 'next/link';
import { getSessionFromStorage, clearSession } from '@/lib/auth';
import { ResearchDashboardLogin } from '@/components/admin/ResearchDashboardLogin';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    // Check authentication on component mount
    const session = getSessionFromStorage();
    if (session && session.isAuthenticated) {
      setIsAuthenticated(true);
      setUserEmail(session.email);
    }
  }, []);

  const handleLogin = () => {
    const session = getSessionFromStorage();
    if (session && session.isAuthenticated) {
      setIsAuthenticated(true);
      setUserEmail(session.email);
    }
  };

  const handleLogout = () => {
    clearSession();
    setIsAuthenticated(false);
    setUserEmail('');
  };

  if (!isAuthenticated) {
    return <ResearchDashboardLogin onLogin={handleLogin} />;
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
              <p className="text-gray-600">Manage your Article Experiment project</p>
              <p className="text-sm text-gray-500 mt-1">Logged in as: {userEmail}</p>
            </div>
            <div className="flex space-x-2">
              <a
                href="https://console.firebase.google.com/u/0/project/article-experiment-next/overview"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 text-sm text-orange-600 hover:text-orange-800 border border-orange-300 rounded-md hover:bg-orange-50"
              >
                Firebase Console
              </a>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Sign Out
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Research Dashboard Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h2 className="text-xl font-semibold text-gray-900">Research Dashboard</h2>
                  <p className="text-sm text-gray-600">View and analyze experimental data</p>
                </div>
              </div>
              <p className="text-gray-700 mb-4">
                Interactive dashboard for researchers to explore user activity, articles, comments, and export data for analysis.
              </p>
              <Link 
                href="/admin/research-dashboard"
                className="inline-flex items-center px-4 py-2 bg-blue-600 !text-white rounded-md hover:bg-blue-700"
              >
                Open Dashboard
                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Add Comments Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h2 className="text-xl font-semibold text-gray-900">Add Default Comments</h2>
                  <p className="text-sm text-gray-600">Manage article comments</p>
                </div>
              </div>
              <p className="text-gray-700 mb-4">
                Add or import default comments for articles. Upload CSV files or manually enter comment data.
              </p>
              <Link 
                href="/admin/add-default-comments"
                className="inline-flex items-center px-4 py-2 bg-green-600 !text-white rounded-md hover:bg-green-700"
              >
                Manage Comments
                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Access</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">📊</div>
                <div className="text-sm text-gray-600 mt-2">Research Dashboard</div>
                <Link href="/admin/research-dashboard" className="text-blue-600 hover:underline text-sm">
                  View Data
                </Link>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">💬</div>
                <div className="text-sm text-gray-600 mt-2">Manage Comments</div>
                <Link href="/admin/add-default-comments" className="text-green-600 hover:underline text-sm">
                  Add Comments
                </Link>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">📁</div>
                <div className="text-sm text-gray-600 mt-2">Export Data</div>
                <Link href="/admin/research-dashboard" className="text-purple-600 hover:underline text-sm">
                  Download CSV
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 