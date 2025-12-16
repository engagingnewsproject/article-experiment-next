/**
 * Layout component for all admin routes.
 * 
 * This layout ensures all routes under /admin require authentication.
 * Uses AuthGuard to protect all child routes, making authentication DRY.
 * Includes AdminNav for consistent navigation across all admin pages.
 * 
 * @module admin/layout
 */

'use client';

import { AuthGuard } from '@/components/admin/AuthGuard';
import { AdminNav } from '@/components/admin/AdminNav';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <AdminNav />
      {children}
    </AuthGuard>
  );
}