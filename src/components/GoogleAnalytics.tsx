'use client';

/**
 * Loads Google Analytics only when not embedded in an iframe (e.g. Qualtrics).
 * Uses lazyOnload so GA does not compete with first paint when it does load.
 */

import Script from 'next/script';
import { useEffect, useState } from 'react';

const measurementId = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID;

export default function GoogleAnalytics() {
  const [loadGa, setLoadGa] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !measurementId) return;
    if (window.parent !== window) return; // in iframe — skip GA
    setLoadGa(true);
  }, []);

  if (!loadGa || !measurementId) return null;

  return (
    <>
      <Script
        strategy="lazyOnload"
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
      />
      <Script
        id="google-analytics"
        strategy="lazyOnload"
        dangerouslySetInnerHTML={{
          __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${measurementId}', {
                page_path: window.location.pathname,
              });
            `,
        }}
      />
    </>
  );
}
