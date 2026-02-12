/**
 * Root layout component for the Next.js application.
 * 
 * This component serves as the base layout for all pages in the application.
 * It includes:
 * - Global styles and CSS variables
 * - Google Analytics tracking setup
 * - Basic HTML structure with language specification
 * - Admin class on body when on admin routes
 * 
 * @component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to be rendered within the layout
 * @returns {JSX.Element} The root layout structure
 */

import '@/styles/globals.css';
import '@/styles/variables.css';
import type { Metadata } from 'next';
import { AdminClassManager } from './AdminClassManager';
import { DevProjectIndicator } from '@/components/DevProjectIndicator';
import GoogleAnalytics from '@/components/GoogleAnalytics';

/**
 * Metadata configuration for the application.
 * 
 * @type {Metadata}
 * @property {string} title - The title of the application
 * @property {string} description - A brief description of the application
 */
export const metadata: Metadata = {
  title: 'Article Experiment',
  description: 'Article experiment with Next.js',
};

/**
 * RootLayout component that wraps the entire application.
 * 
 * This component:
 * - Sets up the HTML document structure
 * - Initializes Google Analytics tracking
 * - Provides a consistent layout for all pages
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to be rendered
 * @returns {JSX.Element} The complete HTML structure with analytics and children
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <GoogleAnalytics />
      </head>
      <body>
        <AdminClassManager />
        {children}
        <DevProjectIndicator />
      </body>
    </html>
  );
} 