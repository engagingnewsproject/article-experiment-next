import { getClientIP, logEvent } from '@/lib/logger';
import { useCallback } from 'react';
import type { QualtricsData } from './useQualtrics';
import { useStudyId } from './useStudyId';

export function useLogger(qualtricsData: QualtricsData = {}, articleStudyId?: string) {
  const { studyId: urlStudyId } = useStudyId();
  // Use article's studyId if provided, otherwise fall back to URL studyId
  const effectiveStudyId = articleStudyId || urlStudyId;
  
  // Production-safe logging to verify studyId and Qualtrics data
  if (typeof window !== 'undefined') {
    const logKey = 'logger_init';
    if (!(window as any)[logKey]) {
      console.log('[Logger] Initialized with:', {
        articleStudyId,
        urlStudyId,
        effectiveStudyId,
        qualtricsResponseId: qualtricsData?.responseId,
        qualtricsSurveyId: qualtricsData?.surveyId,
        qualtricsData: qualtricsData,
        isEmbedded: window.parent !== window,
      });
      (window as any)[logKey] = true;
    }
  }
  
  const log = useCallback(async (
    action: string,
    label: string,
    details: string,
    identifier: string,
    userId: string,
    articleTitle?: string
  ) => {
    const ipAddress = await getClientIP();
    
    // Log entry that will be saved to Firestore
    const logEntry = {
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
    };
    
    // Production-safe logging for debugging
    console.log('[Logger] Logging event:', {
      action,
      label,
      studyId: effectiveStudyId,
      qualtricsResponseId: qualtricsData.responseId,
      qualtricsData: qualtricsData,
      identifier,
    });
    
    await logEvent(logEntry);
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
