import { useCallback } from 'react';
import { logEvent, getClientIP } from '@/lib/logger';

export function useLogger() {
  const log = useCallback(async (
    action: string,
    label: string,
    comment: string,
    identifier: string,
    userId: string
  ) => {
    const ipAddress = await getClientIP();
    
    await logEvent({
      url: window.location.href,
      identifier,
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
    userId: string
  ) => {
    await log('click', label, comment, identifier, userId);
  }, [log]);

  const logPageView = useCallback(async (
    pageTitle: string,
    identifier: string,
    userId: string
  ) => {
    await log('Page View', pageTitle, 'Loaded', identifier, userId);
  }, [log]);

  const logComment = useCallback(async (
    name: string,
    comment: string,
    identifier: string,
    userId: string
  ) => {
    await log('Comment', 'Add Comment', `${name}: ${comment}`, identifier, userId);
  }, [log]);

  return {
    log,
    logClick,
    logPageView,
    logComment,
  };
}
