'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './TrustProjectCallout.module.css';

export default function TrustProjectCallout() {
  const pathname = usePathname();
  const currentUrl = encodeURIComponent(pathname || '/');

  return (
    <aside className={styles.trustProject}>
      <div className={styles.trustProjectCallout__logo}>
        <Link href={`/about-the-trust-project/?referrer=${currentUrl}`}>
          <div className={styles.trustProject__logo}>
            {/* TODO: Add Trust Project SVG */}
            <svg className={styles.trustProject__svg} viewBox="0 0 24 24">
              <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.8L20 9l-8 4-8-4 8-4.2zM4 8.5l8 4v8.5l-8-4V8.5zm10 12.5v-8.5l8-4v8.5l-8 4z" />
            </svg>
          </div>
          <h4 className={styles.trustProject__title}>Trust Project</h4>
        </Link>
      </div>
      <div className={styles.trustProjectCallout__content}>
        <p>The Trust Project is a collaboration among news organizations around the world. Its goal is to create strategies that fulfill journalism's basic pledge: to serve society with a truthful, intelligent and comprehensive account of ideas and events.</p>
        <p>
          <Link href={`/about-the-trust-project/?referrer=${currentUrl}`}>
            Learn how the Trust Project evaluates the trustworthiness of a news organization.
          </Link>
        </p>
      </div>
    </aside>
  );
} 