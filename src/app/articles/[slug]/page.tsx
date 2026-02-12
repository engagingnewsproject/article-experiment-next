/**
 * Article page — Server Component that pre-fetches article and study defaults
 * so the iframe (e.g. Qualtrics) gets HTML with the full article body on first paint.
 *
 * Data is fetched on the server; ArticlePageClient handles auth and interactivity only.
 */

import { Header } from '@/components/Header';
import { getArticleBySlug, type Article, type Comment } from '@/lib/firestore';
import { convertToPlainObject, commentsFromDefaultComments } from '@/lib/serialization';
import { getStudyDefaults, DEFAULT_STUDY_ID } from '@/lib/studies';
import type { ArticleConfig } from '@/lib/config';
import { Suspense } from 'react';
import ArticlePageClient from './ArticlePageClient';

type PageProps = {
  params: { slug: string };
  searchParams?: { study?: string; [key: string]: string | string[] | undefined };
};

/**
 * Not-found UI for article route (shared by server and client path).
 */
function ArticleNotFound({
  slug,
  studyId,
}: {
  slug: string;
  studyId?: string;
}) {
  return (
    <div className="max-w-4xl p-4 mx-auto">
      <Header />
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <h1 className="text-xl font-semibold text-red-800 mb-2">Article Not Found</h1>
        <p className="text-red-700">
          The article you are looking for could not be found.
        </p>
        <p className="mt-4 text-sm text-red-600">
          Slug: <code className="bg-red-100 px-2 py-1 rounded">{slug}</code>
          {studyId && (
            <>
              {' '}
              | Study: <code className="bg-red-100 px-2 py-1 rounded">{studyId}</code>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

export default async function ArticlePage({ params, searchParams }: PageProps) {
  const slug = params?.slug;
  const studyParam = searchParams?.study;
  const studyId = typeof studyParam === 'string' ? studyParam : undefined;

  if (!slug) {
    return (
      <div className="max-w-4xl p-4 mx-auto">
        <Header />
        <div className="p-4 text-red-600">Slug is not available</div>
      </div>
    );
  }

  // Fetch article and study defaults in parallel when possible (studyId from URL or default)
  const studyIdForFetch = studyId ?? DEFAULT_STUDY_ID;
  const [articleData, studyDefaultsFromParallel] = await Promise.all([
    (async () => {
      let data = await getArticleBySlug(slug, studyId);
      if (!data && studyId) data = await getArticleBySlug(slug, undefined);
      return data;
    })(),
    getStudyDefaults(studyIdForFetch),
  ]);

  if (!articleData) {
    return <ArticleNotFound slug={slug} studyId={studyId} />;
  }

  const article = convertToPlainObject(articleData) as Article;
  const rawComments = (articleData as Article & { default_comments?: unknown }).default_comments;
  const baseComments = commentsFromDefaultComments(rawComments);
  const comments: Comment[] = baseComments.map((c) => convertToPlainObject(c) as Comment);

  const effectiveStudyId =
    studyId ?? (article as Article & { studyId?: string }).studyId ?? DEFAULT_STUDY_ID;
  // Use parallel-fetched defaults if they match; otherwise fetch for article’s study
  const studyDefaults: ArticleConfig =
    effectiveStudyId === studyIdForFetch
      ? studyDefaultsFromParallel
      : await getStudyDefaults(
          typeof effectiveStudyId === 'string' ? effectiveStudyId : DEFAULT_STUDY_ID
        );

  return (
    <Suspense fallback={<div className="p-4">Loading...</div>}>
      <ArticlePageClient
        article={article}
        comments={comments}
        studyDefaults={studyDefaults}
        slug={slug}
      />
    </Suspense>
  );
}
