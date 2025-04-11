import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Article Experiment',
  description: 'A research platform for studying article engagement',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
