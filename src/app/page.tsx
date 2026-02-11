/**
 * Root/home page that redirects to the admin articles page if authenticated,
 * or shows a simple landing page if not authenticated.
 */

'use client';

import { Header } from '@/components/Header';
import { getCurrentSession } from '@/lib/auth';
import { useStudyId } from '@/hooks/useStudyId';
import { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

/**
 * Client component that handles redirect logic using search params.
 * Must be wrapped in Suspense because it uses useSearchParams().
 */
function HomeContent() {
  const router = useRouter();
  const { studyId } = useStudyId();
  const session = getCurrentSession();

  useEffect(() => {
    // If authenticated, redirect to admin articles page
    if (session && session.isAuthenticated) {
      const studyParam = studyId ? `?study=${studyId}` : '';
      router.push(`/admin/articles${studyParam}`);
    }
  }, [session, studyId, router]);

  // Show a simple landing page if not authenticated
  return (
    <>
      <Header />
      <div className="max-w-4xl mx-auto p-8 text-center">
        <h1 className="text-4xl font-bold mb-4">Article Experiment</h1>
        <p className="text-gray-600 mb-8">
          Please sign in to access the admin dashboard.
        </p>
        <Link
          href="/admin"
          className="inline-block px-6 py-3 bg-blue-600 !text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go to Admin Login
        </Link>
      </div>
    </>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <>
        <Header />
        <div className="max-w-4xl mx-auto p-8 text-center">
          <h1 className="text-4xl font-bold mb-4">Article Experiment</h1>
          <p className="text-gray-600 mb-8">Loading...</p>
        </div>
      </>
    }>
      <HomeContent />
    </Suspense>
  );
}