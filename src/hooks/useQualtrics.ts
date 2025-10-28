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

  // Debug: Log when qualtricsData changes
  useEffect(() => {
    console.log('🔵 Qualtrics data state updated:', qualtricsData);
  }, [qualtricsData]);

  useEffect(() => {
    // Listen for postMessage from Qualtrics
    const handleMessage = (event: MessageEvent) => {
      // Debug: Log all messages to see what's being received
      console.log('📨 Received postMessage:', {
        origin: event.origin,
        data: event.data,
        type: typeof event.data
      });
      
      // Optional: Add origin validation for security
      // if (event.origin !== 'https://your-qualtrics-domain.com') return;
      
      // Handle the new structured format
      if (event.data && event.data.type === 'QUALTRICS_DATA') {
        console.log('✅ Received Qualtrics data:', event.data.payload);
        setQualtricsData(event.data.payload);
      }
      // Handle the legacy format they've been using
      else if (event.data && event.data.qualtricsResponseId) {
        console.log('✅ Received Qualtrics data (legacy format):', event.data);
        setQualtricsData({
          responseId: event.data.qualtricsResponseId,
          surveyId: event.data.qualtricsSurveyId,
          embeddedData: event.data
        });
      }
    };

    console.log('🔍 Setting up postMessage listener for Qualtrics data');
    window.addEventListener('message', handleMessage);

    // Also expose a way for Qualtrics to directly set data (fallback method)
    if (typeof window !== 'undefined') {
      (window as any).receiveQualtricsData = (data: QualtricsData) => {
        console.log('Received Qualtrics data (direct method):', data);
        setQualtricsData(data);
      };
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

