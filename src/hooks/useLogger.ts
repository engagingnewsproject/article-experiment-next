import { getClientIP, logEvent } from '@/lib/logger';
import { useCallback } from 'react';
import type { QualtricsData } from './useQualtrics';
import { useStudyId } from './useStudyId';

export function useLogger(qualtricsData: QualtricsData = {}, articleStudyId?: string) {
  const { studyId: urlStudyId } = useStudyId();
  // Use article's studyId if provided, otherwise fall back to URL studyId
  const effectiveStudyId = articleStudyId || urlStudyId;
  
  const log = useCallback(async (
    action: string,
    label: string,
    details: string,
    identifier: string,
    userId: string,
    articleTitle?: string
  ) => {
    const ipAddress = await getClientIP();
    
    await logEvent({
      url: window.location.href,
      identifier,
      articleTitle,
      userId,
      ipAddress,
      action,
      label,
      details,
      qualtricsResponseId: qualtricsData.responseId,
      qualtricsSurveyId: qualtricsData.surveyId,
      studyId: effectiveStudyId,
    });
  }, [qualtricsData, effectiveStudyId]);

  const logClick = useCallback(async (
    label: string,
    comment: string,
    identifier: string,
    userId: string,
    articleTitle?: string
  ) => {
    await log('Click', label, comment, identifier, userId, articleTitle);
  }, [log]);

  const logPageView = useCallback(async (
    pageTitle: string,
    identifier: string,
    userId: string,
    articleTitle?: string
  ) => {
    await log('Page View', pageTitle, 'Loaded', identifier, userId, articleTitle);
      }, [log]);

    const logPageViewTime = useCallback(async (
    pageTitle: string,
    identifier: string,
    timeSpent: number,
    userId: string,
    articleTitle?: string
  ) => {
    const timeSpentToString = (ms: number) => { 
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSec = seconds % 60;
        return `${minutes}m ${remainingSec}s`;
    }
    await log('Time Spent', pageTitle, timeSpentToString(timeSpent), identifier, userId, articleTitle);
  }, [log]);

  const logComment = useCallback(async (
    pageTitle: string,
    name: string,
    comment: string,
    identifier: string,
    userId: string,
    articleTitle?: string,
    isReply?: boolean,
  ) => {
    await log(isReply ? 'Reply' : 'Comment', pageTitle, `${name}: ${comment}`, identifier, userId, articleTitle);
  }, [log]);

  return {
    log,
    logClick,
    logPageView,
    logPageViewTime,
    logComment,
  };
}
