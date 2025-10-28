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
    // Function to process Qualtrics data
    const processQualtricsData = (data: any) => {
      // Handle the new structured format
      if (data && data.type === 'QUALTRICS_DATA') {
        console.log('✅ Processed Qualtrics data:', data.payload);
        setQualtricsData(data.payload);
      }
      // Handle the legacy format
      else if (data && data.qualtricsResponseId) {
        console.log('✅ Processed Qualtrics data (legacy format):', data);
        setQualtricsData({
          responseId: data.qualtricsResponseId,
          surveyId: data.qualtricsSurveyId,
          embeddedData: data
        });
      }
    };

    // Listen for postMessage from Qualtrics
    const handleMessage = (event: MessageEvent) => {
      // Debug: Log all messages to see what's being received
      console.log('📨 Received postMessage:', {
        origin: event.origin,
        data: event.data,
        type: typeof event.data,
        keys: event.data ? Object.keys(event.data) : 'no data'
      });
      
      // Optional: Add origin validation for security
      // if (event.origin !== 'https://your-qualtrics-domain.com') return;
      
      processQualtricsData(event.data);
    };

    console.log('🔍 Setting up postMessage listener for Qualtrics data');
    window.addEventListener('message', handleMessage);
    
    // Also listen for messages sent to the direct method (window.receiveQualtricsData)
    // This acts as a backup in case postMessage timing is off

    // Also expose a way for Qualtrics to directly set data (fallback method)
    if (typeof window !== 'undefined') {
      (window as any).receiveQualtricsData = (data: QualtricsData) => {
        console.log('🔧 Received Qualtrics data (direct method):', data);
        processQualtricsData(data);
      };
    }
    
    // Request Qualtrics data from parent window if in iframe
    if (window.parent !== window) {
      console.log('🔍 App is running in an iframe, requesting Qualtrics data from parent');
      // Send a request to parent to resend the data
      setTimeout(() => {
        window.parent.postMessage({ type: 'REQUEST_QUALTRICS_DATA' }, '*');
        console.log('📤 Sent request for Qualtrics data to parent');
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

