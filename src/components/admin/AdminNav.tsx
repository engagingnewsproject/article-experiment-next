/**
 * Admin Navigation component that provides consistent top navigation for all admin pages.
 * 
 * This component:
 * - Displays navigation links to all admin sections
 * - Shows the logged-in user's email
 * - Provides logout functionality
 * - Includes Firebase Console link
 * - Only renders when user is authenticated (used within AuthGuard)
 * 
 * @component
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { signOut, getCurrentUser, onAuthChange } from '@/lib/auth';
import { loadStudies, type StudyDefinition } from '@/lib/studies';
import { getStudyBorderColor } from '@/lib/studyColors';
import type { User } from 'firebase/auth';

/**
 * Determines Firebase Console URL based on current environment.
 * 
 * @returns Firebase Console URL for the appropriate project
 */
function getFirebaseConsoleUrl(): string {
  if (typeof window === 'undefined') {
    // Default to prod on server-side
    return 'https://console.firebase.google.com/u/0/project/article-experiment-next/overview';
  }
  
  const hostname = window.location.hostname;
  const isDev = hostname.includes('dev--') || hostname === 'localhost' || hostname === 'article-experiment-next.localhost' || hostname === '127.0.0.1';
  
  if (isDev) {
    return 'https://console.firebase.google.com/u/0/project/article-experiment-next-dev/firestore/databases/-default-/data/~2Farticles';
  }
  
  return 'https://console.firebase.google.com/u/0/project/article-experiment-next/overview';
}

export function AdminNav() {
  const [userEmail, setUserEmail] = useState('');
  const [studies, setStudies] = useState<StudyDefinition[]>([]);
  const [isArticlesDropdownOpen, setIsArticlesDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Subscribe to Firebase Auth state changes
    const unsubscribe = onAuthChange((user: User | null) => {
      if (user && user.email) {
        setUserEmail(user.email);
        loadStudiesData();
      } else {
        setUserEmail('');
        setStudies([]);
      }
    });

    // Check initial auth state
    const user = getCurrentUser();
    if (user && user.email) {
      setUserEmail(user.email);
      loadStudiesData();
    }

    return () => unsubscribe();
  }, []);

  /**
   * Loads studies data for the Articles dropdown.
   */
  const loadStudiesData = async () => {
    try {
      const loadedStudies = await loadStudies();
      setStudies(loadedStudies);
    } catch (error) {
      console.error('Error loading studies:', error);
      setStudies([]);
    }
  };

  /**
   * Closes dropdown when clicking outside.
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsArticlesDropdownOpen(false);
      }
    };

    if (isArticlesDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isArticlesDropdownOpen]);

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  /**
   * Checks if a navigation link is active based on current pathname.
   * 
   * @param path - The path to check
   * @returns True if the path matches the current pathname
   */
  const isActive = (path: string): boolean => {
    if (path === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(path);
  };

  /**
   * Checks if the Articles dropdown or any articles page is active.
   * 
   * @returns True if on articles pages
   */
  const isArticlesActive = (): boolean => {
    return pathname.startsWith('/admin/articles');
  };

  const navLinks = [
    { href: '/admin/add-default-comments', label: 'Default Comments' },
    { href: '/admin/manage-studies', label: 'Manage Studies' },
    { href: '/admin/research-dashboard', label: 'Data Dashboard' },
  ];

  /**
   * Navigation links component that can be reused in desktop and mobile views.
   */
  const NavigationLinks = ({ isMobile = false }: { isMobile?: boolean }) => (
    <>
      {/* Home */}
      <Link
        href="/admin"
        onClick={() => isMobile && setIsMobileMenuOpen(false)}
        className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
          isActive('/admin')
            ? 'bg-blue-100 text-blue-700'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`}
      >
        Home
      </Link>
      
      {/* Articles Dropdown */}
      <div 
        ref={dropdownRef}
        className="relative"
        onMouseEnter={() => !isMobile && setIsArticlesDropdownOpen(true)}
        onMouseLeave={() => !isMobile && setIsArticlesDropdownOpen(false)}
      >
        <button
          onClick={() => setIsArticlesDropdownOpen(!isArticlesDropdownOpen)}
          className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-between ${
            isArticlesActive()
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          Articles
          <svg 
            className={`ml-1 w-4 h-4 transition-transform ${isArticlesDropdownOpen ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {/* Dropdown Menu - use pt-2 + top-full (no mt) so padding acts as hover bridge; no gap to close menu */}
        {isArticlesDropdownOpen && (
          <div className={`${isMobile ? 'relative mt-1' : 'absolute left-0 top-full pt-2 pb-1'} w-full ${isMobile ? '' : 'min-w-64 max-w-sm'} bg-white rounded-md shadow-lg border border-gray-200 z-50 overflow-visible ${isMobile ? 'py-1' : ''}`}>
            {studies.length === 0 ? (
              <div className="px-4 py-2 text-sm text-gray-500">
                Loading studies...
              </div>
            ) : (
              studies.map((study) => {
                const borderColor = getStudyBorderColor(study.id, studies);
                return (
                  <Link
                    key={study.id}
                    href={`/admin/articles?study=${study.id}`}
                    onClick={() => {
                      setIsArticlesDropdownOpen(false);
                      if (isMobile) setIsMobileMenuOpen(false);
                    }}
                    className={`block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors border-l-4 whitespace-normal break-words ${borderColor}`}
                  >
                    {study.name}
                  </Link>
                );
              })
            )}
          </div>
        )}
      </div>
      
      {/* Remaining nav links */}
      {navLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          onClick={() => isMobile && setIsMobileMenuOpen(false)}
          className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            isActive(link.href)
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          {link.label}
        </Link>
      ))}
    </>
  );

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Navigation Links (Desktop) */}
          <div className="hidden md:flex items-center space-x-1">
            <NavigationLinks />
          </div>

          {/* Mobile hamburger button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {!isMobileMenuOpen ? (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>

          {/* Right side - User info and actions */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* User email */}
            {userEmail && (
              <span className="text-sm text-gray-600 hidden sm:inline-block">
                {userEmail}
              </span>
            )}
            
            {/* Firebase Console link */}
            <a
              href={getFirebaseConsoleUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2 sm:px-3 py-2 text-xs sm:text-sm text-orange-600 border border-orange-300 rounded-md hover:text-orange-800 hover:bg-orange-50 transition-colors"
            >
              <span className="hidden sm:inline">Firebase Console</span>
              <span className="sm:hidden">Firebase</span>
            </a>
            
            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="px-2 sm:px-3 py-2 text-xs sm:text-sm text-gray-600 border border-gray-300 rounded-md hover:text-gray-800 hover:bg-gray-50 transition-colors"
            >
              <span className="hidden sm:inline">Sign Out</span>
              <span className="sm:hidden">Out</span>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <NavigationLinks isMobile={true} />
              
              {/* Mobile user email */}
              {userEmail && (
                <div className="px-3 py-2 text-sm text-gray-600 border-t border-gray-200 mt-2 pt-2">
                  {userEmail}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
