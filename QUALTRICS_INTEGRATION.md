# Qualtrics Integration Guide

This document explains how to integrate Qualtrics survey data with the article logging system.

## Overview

The application can now receive Qualtrics survey data (like `responseId`, `surveyId`, etc.) and include it in all user interaction logs. This allows you to link article interactions with specific survey responses.

## How It Works

1. **PostMessage Communication**: The article (embedded in an iframe) listens for `postMessage` events from the Qualtrics parent window
2. **Data Storage**: Qualtrics data is stored in the React component state
3. **Automatic Inclusion**: All logs (page views, clicks, comments, etc.) automatically include the Qualtrics data

## Adding Qualtrics JavaScript to Your Survey

Add this JavaScript to each question that has an embedded article iframe (in the question's "Add JavaScript" section).

```javascript
Qualtrics.SurveyEngine.addOnReady(function() {
    // Get the response ID from Qualtrics embedded data
    var responseId = "${e://Field/ResponseID}";
    
    // Select the iframe
    var iframe = document.querySelector('iframe');
    
    // Error handling
    if (!responseId) {
        console.error('Qualtrics: ResponseID not found');
    }
    
    if (!iframe) {
        console.error('Qualtrics: No iframe found');
    }
    
    // Send data to the article iframe via postMessage
    if (iframe && responseId) {
        iframe.contentWindow.postMessage({
            qualtricsResponseId: responseId
        }, '*'); // For production, replace '*' with your article domain for security
        
        console.log('Qualtrics: Sent ResponseID to embedded app:', responseId);
    }
});
```

### Combining with Your Existing Time-Tracking Code

If you already have time-tracking JavaScript on your questions (like the code shown in your screenshot), you can combine them. Here's how to add the responseId code to your existing block:

```javascript
Qualtrics.SurveyEngine.addOnload(function() {
  // === Your existing time-tracking code ===
  var blockStartTime = Date.now();
  
  window.addEventListener('load', function() {
    blockStartTime = Date.now();
  });

  jQuery('.NextButton').on('click', function() {
    var durationSeconds = ((Date.now() - blockStartTime) / 1000).toFixed(2);
    var blockName = Qualtrics.SurveyEngine.getEmbeddedData('CurrentBlockName');
    var fieldName = blockName + "Duration";

    Qualtrics.SurveyEngine.setEmbeddedData(fieldName, durationSeconds);
    Qualtrics.SurveyEngine.setEmbeddedData('BlockName', blockName);
    console.log(fieldName + " recorded:", durationSeconds);
  });
  
  // === New: Send responseId to embedded article ===
  var responseId = "${e://Field/ResponseID}";
  var iframe = document.querySelector('iframe');
  
  if (iframe && responseId) {
    iframe.contentWindow.postMessage({
      qualtricsResponseId: responseId
    }, '*');
    console.log('Qualtrics: Sent ResponseID to embedded app:', responseId);
  }
});
```

### Enhanced Version (with additional data)

If you want to send additional Qualtrics data (like `surveyId` or embedded fields), add them to the `postMessage` object:

```javascript
Qualtrics.SurveyEngine.addOnReady(function() {
    var responseId = "${e://Field/ResponseID}";
    var surveyId = Qualtrics.SurveyEngine.getSurveyId();
    var iframe = document.querySelector('iframe');
    
    if (iframe && responseId) {
        iframe.contentWindow.postMessage({
            qualtricsResponseId: responseId,
            qualtricsSurveyId: surveyId,
            // Add other embedded data as needed
        }, '*');
    }
});
```

## Testing

1. Add the JavaScript to each question that has an embedded article
2. Preview your survey with an article embedded
3. Open your article in a browser console - you should see: `"Received Qualtrics data (legacy format): {qualtricsResponseId: '...'}"`
4. Perform any action (load page, click link, comment) and check that the logs include the Qualtrics `responseId`

## What Gets Logged

All log entries will now include these Qualtrics fields:

- `qualtricsResponseId`: The unique survey response ID
- `qualtricsSurveyId`: The survey ID
- `qualtricsEmbeddedData`: Any embedded data you send (object)

## Security Note

For production, replace `'*'` in the postMessage origin with your article domain:

```javascript
iframe.contentWindow.postMessage({...}, 'https://your-article-domain.com');
```

Also uncomment the origin validation in `src/hooks/useQualtrics.ts` if needed.

## Troubleshooting

- **No data received**: Check that the iframe has loaded before sending the message
- **Security errors**: Make sure you're using the correct origin in postMessage
- **Console errors**: Check that the article URL matches the iframe selector

## Files Modified

- `src/hooks/useQualtrics.ts` (new file)
- `src/lib/logger.ts` (added Qualtrics fields)
- `src/hooks/useLogger.ts` (added Qualtrics data parameter)
- `src/app/articles/[slug]/ArticleClient.tsx` (added useQualtrics hook)
- `src/components/ArticleContent.tsx` (pass Qualtrics data to logger)
- `src/components/Comments.tsx` (pass Qualtrics data through)
- `src/components/CommentList.tsx` (pass Qualtrics data through)

