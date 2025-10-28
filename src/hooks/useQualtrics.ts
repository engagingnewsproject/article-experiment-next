import { useState, useEffect } from 'react';

/**
 * Qualtrics metadata that can be received from the survey
 */
export interface QualtricsData {
  responseId?: string;
  surveyId?: string;
  userId?: string;
  embeddedData?: Record<string, any>;
}

/**
 * Custom hook to listen for Qualtrics data via postMessage
 * 
 * This hook:
 * - Listens for postMessage events from the Qualtrics survey parent window
 * - Stores Qualtrics metadata (responseId, surveyId, etc.)
 * - Provides the data for use in logging
 * 
 * @example
 * // Usage in a component:
 * const { qualtricsData } = useQualtrics();
 * console.log(qualtricsData.responseId);
 * 
 * @returns {QualtricsData} The current Qualtrics data
 */
export function useQualtrics() {
  const [qualtricsData, setQualtricsData] = useState<QualtricsData>({});

  useEffect(() => {
    // Function to process Qualtrics data
    const processQualtricsData = (data: any) => {
      // Handle the new structured format
      if (data && data.type === 'QUALTRICS_DATA') {
        setQualtricsData(data.payload);
      }
      // Handle the legacy format
      else if (data && data.qualtricsResponseId) {
        setQualtricsData({
          responseId: data.qualtricsResponseId,
          surveyId: data.qualtricsSurveyId,
          embeddedData: data
        });
      }
    };

    // Listen for postMessage from Qualtrics
    const handleMessage = (event: MessageEvent) => {
      // Optional: Add origin validation for security
      // if (event.origin !== 'https://your-qualtrics-domain.com') return;
      
      processQualtricsData(event.data);
    };

    window.addEventListener('message', handleMessage);

    // Also expose a way for Qualtrics to directly set data (fallback method)
    if (typeof window !== 'undefined') {
      (window as any).receiveQualtricsData = (data: QualtricsData) => {
        processQualtricsData(data);
      };
    }
    
    // Request Qualtrics data from parent window if in iframe
    if (window.parent !== window) {
      // Send a request to parent to resend the data (handles timing issues)
      setTimeout(() => {
        window.parent.postMessage({ type: 'REQUEST_QUALTRICS_DATA' }, '*');
      }, 100);
    }

    return () => {
      window.removeEventListener('message', handleMessage);
      if (typeof window !== 'undefined') {
        delete (window as any).receiveQualtricsData;
      }
    };
  }, []);

  return { qualtricsData };
}

