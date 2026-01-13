/**
 * Client component that manages the .admin class on the body element
 * when the user is on an admin route and authenticated.
 */

'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { getCurrentUser, onAuthChange } from '@/lib/auth';
import { User } from 'firebase/auth';

/**
 * Manages adding/removing the .admin class on the body element
 * based on whether the user is on an admin route and authenticated.
 */
export function AdminClassManager() {
  const pathname = usePathname();

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    // Check if we're on an admin route
    const isAdminRoute = pathname ? pathname.startsWith('/admin') : false;

    // Function to update the body class
    const updateBodyClass = (user: User | null) => {
      if (typeof document === 'undefined') return;
      const body = document.body;
      if (isAdminRoute && user !== null) {
        body.classList.add('admin');
      } else {
        body.classList.remove('admin');
      }
    };

    // Initial check
    const user = getCurrentUser();
    updateBodyClass(user);

    // Subscribe to auth changes
    const unsubscribe = onAuthChange((user: User | null) => {
      updateBodyClass(user);
    });

    return () => {
      unsubscribe();
      // Clean up on unmount
      if (typeof document !== 'undefined') {
        document.body.classList.remove('admin');
      }
    };
  }, [pathname]);

  // This component doesn't render anything
  return null;
}
