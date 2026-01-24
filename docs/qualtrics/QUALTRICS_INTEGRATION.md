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

### Basic Version (ResponseID Only)

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

### Enhanced Version (with Click Tracking for Prolific)

This version listens for click/interaction events from the embedded article and tracks them for Prolific:

```javascript
Qualtrics.SurveyEngine.addOnReady(function() {
    var responseId = "${e://Field/ResponseID}";
    var iframe = document.querySelector('iframe');
    
    // Initialize click counter in embedded data
    var clickCount = parseInt(Qualtrics.SurveyEngine.getEmbeddedData('ArticleClickCount') || '0');
    var interactionCount = parseInt(Qualtrics.SurveyEngine.getEmbeddedData('ArticleInteractionCount') || '0');
    
    // Function to send Qualtrics data to iframe
    function sendToIframe() {
        if (!responseId) {
            console.error('Qualtrics: ResponseID not found');
            return;
        }
        if (!iframe) {
            console.error('Qualtrics: No iframe found');
            return;
        }
        if (iframe && responseId) {
            iframe.contentWindow.postMessage({
                qualtricsResponseId: responseId
            }, '*');
            console.log('Qualtrics: Sent ResponseID to embedded app:', responseId);
        }
    }
    
    // Listen for requests from the iframe
    window.addEventListener('message', function(event) {
        // Handle requests for Qualtrics data
        if (event.data && event.data.type === 'REQUEST_QUALTRICS_DATA') {
            console.log('Qualtrics: Received request for data, resending...');
            setTimeout(sendToIframe, 100);
        }
        
        // Handle button clicks (Like/Share)
        if (event.data && event.data.type === 'ARTICLE_BUTTON_CLICK') {
            clickCount++;
            Qualtrics.SurveyEngine.setEmbeddedData('ArticleClickCount', clickCount.toString());
            Qualtrics.SurveyEngine.setEmbeddedData('LastButtonClick', event.data.buttonType);
            Qualtrics.SurveyEngine.setEmbeddedData('LastButtonClickTime', new Date().toISOString());
            
            console.log('Qualtrics: Article button clicked:', event.data.buttonType, 'Total clicks:', clickCount);
            
            // Trigger a synthetic click event on the parent page for Prolific tracking
            // This simulates a click on the parent page, which Prolific can detect
            var syntheticEvent = new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                view: window
            });
            document.body.dispatchEvent(syntheticEvent);
        }
        
        // Handle all other interactions (clicks, votes, comments, replies)
        if (event.data && event.data.type === 'ARTICLE_INTERACTION') {
            interactionCount++;
            Qualtrics.SurveyEngine.setEmbeddedData('ArticleInteractionCount', interactionCount.toString());
            Qualtrics.SurveyEngine.setEmbeddedData('LastInteractionType', event.data.interactionType);
            Qualtrics.SurveyEngine.setEmbeddedData('LastInteractionTime', new Date().toISOString());
            
            console.log('Qualtrics: Article interaction:', event.data.interactionType, 'Total interactions:', interactionCount);
            
            // Trigger a synthetic click event on the parent page for Prolific tracking
            var syntheticEvent = new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                view: window
            });
            document.body.dispatchEvent(syntheticEvent);
        }
    });
    
    // Send immediately
    sendToIframe();
    
    // Also retry sending every 500ms for the first 2 seconds to handle timing issues
    var retryCount = 0;
    var retryInterval = setInterval(function() {
        if (retryCount < 4) {
            sendToIframe();
            retryCount++;
        } else {
            clearInterval(retryInterval);
        }
    }, 500);
});
```

### Complete Version (Time Tracking + Click Tracking)

If you already have time-tracking JavaScript, here's the complete version that combines time tracking with click/interaction tracking:

```javascript
Qualtrics.SurveyEngine.addOnload(function() {
  // === Time tracking code ===
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
});

Qualtrics.SurveyEngine.addOnReady(function() {
  var responseId = "${e://Field/ResponseID}";
  var iframe = document.querySelector('iframe');
  
  // Initialize click/interaction counters
  var clickCount = parseInt(Qualtrics.SurveyEngine.getEmbeddedData('ArticleClickCount') || '0');
  var interactionCount = parseInt(Qualtrics.SurveyEngine.getEmbeddedData('ArticleInteractionCount') || '0');
  
  // Function to send Qualtrics data to iframe
  function sendToIframe() {
    if (!responseId) {
      console.error('Qualtrics: ResponseID not found');
      return;
    }
    if (!iframe) {
      console.error('Qualtrics: No iframe found');
      return;
    }
    if (iframe && responseId) {
      iframe.contentWindow.postMessage({
        qualtricsResponseId: responseId
      }, '*');
      console.log('Qualtrics: Sent ResponseID to embedded app:', responseId);
    }
  }
  
  // Listen for messages from the iframe
  window.addEventListener('message', function(event) {
    // Handle requests for Qualtrics data
    if (event.data && event.data.type === 'REQUEST_QUALTRICS_DATA') {
      console.log('Qualtrics: Received request for data, resending...');
      setTimeout(sendToIframe, 100);
    }
    
    // Handle button clicks (Like/Share)
    if (event.data && event.data.type === 'ARTICLE_BUTTON_CLICK') {
      clickCount++;
      Qualtrics.SurveyEngine.setEmbeddedData('ArticleClickCount', clickCount.toString());
      Qualtrics.SurveyEngine.setEmbeddedData('LastButtonClick', event.data.buttonType);
      Qualtrics.SurveyEngine.setEmbeddedData('LastButtonClickTime', new Date().toISOString());
      
      console.log('Qualtrics: Article button clicked:', event.data.buttonType, 'Total clicks:', clickCount);
      
      // Trigger synthetic click for Prolific tracking
      document.body.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
    }
    
    // Handle all other interactions
    if (event.data && event.data.type === 'ARTICLE_INTERACTION') {
      interactionCount++;
      Qualtrics.SurveyEngine.setEmbeddedData('ArticleInteractionCount', interactionCount.toString());
      Qualtrics.SurveyEngine.setEmbeddedData('LastInteractionType', event.data.interactionType);
      Qualtrics.SurveyEngine.setEmbeddedData('LastInteractionTime', new Date().toISOString());
      
      console.log('Qualtrics: Article interaction:', event.data.interactionType, 'Total interactions:', interactionCount);
      
      // Trigger synthetic click for Prolific tracking
      document.body.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
    }
  });
  
  // Send immediately
  sendToIframe();
  
  // Retry sending every 500ms for the first 2 seconds
  var retryCount = 0;
  var retryInterval = setInterval(function() {
    if (retryCount < 4) {
      sendToIframe();
      retryCount++;
    } else {
      clearInterval(retryInterval);
    }
  }, 500);
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

### In Firestore (Article App Logs)

All log entries will now include these Qualtrics fields:

- `qualtricsResponseId`: The unique survey response ID
- `qualtricsSurveyId`: The survey ID
- `qualtricsEmbeddedData`: Any embedded data you send (object)

### In Qualtrics Embedded Data (for Prolific)

When using the enhanced version with click tracking, the following embedded data fields are automatically created:

- `ArticleClickCount`: Total number of button clicks (Like/Share) in the article
- `ArticleInteractionCount`: Total number of all interactions (clicks, votes, comments, replies)
- `LastButtonClick`: Type of last button clicked ('like' or 'share')
- `LastButtonClickTime`: ISO timestamp of last button click
- `LastInteractionType`: Type of last interaction ('click', 'vote', 'comment', 'reply')
- `LastInteractionTime`: ISO timestamp of last interaction

These fields can be exported from Qualtrics and matched with Prolific participant data for analysis.

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

