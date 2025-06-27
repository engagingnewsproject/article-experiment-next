import { useCallback } from 'react';
import { logEvent, getClientIP } from '@/lib/logger';

export function useLogger() {
  const log = useCallback(async (
    action: string,
    label: string,
    comment: string,
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
      comment,
    });
  }, []);

  const logClick = useCallback(async (
    label: string,
    comment: string,
    identifier: string,
    userId: string,
    articleTitle?: string
  ) => {
    await log('click', label, comment, identifier, userId, articleTitle);
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
    articleTitle: string,
    name: string,
    comment: string,
    identifier: string,
    userId: string
  ) => {
    await log('Comment', 'Add Comment', `${name}: ${comment}`, identifier, userId, articleTitle);
  }, [log]);

  return {
    log,
    logClick,
    logPageView,
    logPageViewTime,
    logComment,
  };
}
