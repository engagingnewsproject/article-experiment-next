/**
 * Layout component for all admin routes.
 * 
 * This layout ensures all routes under /admin require authentication.
 * Uses AuthGuard to protect all child routes, making authentication DRY.
 * 
 * @module admin/layout
 */

'use client';

import { AuthGuard } from '@/components/admin/AuthGuard';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthGuard>{children}</AuthGuard>;
}