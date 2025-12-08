# Qualtrics Logging Verification Guide

This document explains how to verify that logging works correctly when articles are embedded in Qualtrics surveys, especially after the multi-study support changes.

## How Logging Works in Qualtrics

When an article is embedded in a Qualtrics survey:

1. **Qualtrics sends data via postMessage**: The survey sends `responseId` and optionally `surveyId` to the embedded article iframe
2. **Article receives data**: The `useQualtrics` hook listens for postMessage events and stores the data
3. **Study ID is determined**: The article's `studyId` field (from Firestore) takes precedence over URL-based study ID
4. **All logs include both**: Every log entry includes both the Qualtrics data and the study ID

## Data Flow

```
Qualtrics Survey
    ↓ (postMessage)
useQualtrics hook → qualtricsData { responseId, surveyId }
    ↓
ArticleClient → passes qualtricsData to ArticleContent
    ↓
ArticleContent → extracts article.studyId, passes both to useLogger
    ↓
useLogger → combines articleStudyId + qualtricsData → logEvent
    ↓
Firestore 'logs' collection
```

## What Gets Logged

Every log entry in Firestore includes:

- **Standard fields**: `url`, `identifier`, `articleTitle`, `userId`, `ipAddress`, `action`, `label`, `details`, `timestamp`
- **Qualtrics fields**: `qualtricsResponseId`, `qualtricsSurveyId` (if provided)
- **Study field**: `studyId` (from article document or URL parameter)

## Verification Steps

### 1. Check Browser Console (Development Mode)

When running in development mode, the logger will output debug information:

1. Open the article in a browser (embedded in Qualtrics or standalone)
2. Open browser DevTools console
3. Look for `[Logger] Initialized with:` message showing:
   - `articleStudyId`: The study ID from the article document
   - `urlStudyId`: The study ID from URL parameter (if any)
   - `effectiveStudyId`: Which one is being used (article takes precedence)
   - `qualtricsResponseId`: The Qualtrics response ID (if received)
   - `qualtricsSurveyId`: The Qualtrics survey ID (if received)
   - `isEmbedded`: Whether the article is in an iframe

### 2. Verify Qualtrics Data Reception

1. In the browser console, you should see: `"Received Qualtrics data (legacy format): {qualtricsResponseId: '...'}"`
2. If you don't see this, check that:
   - The Qualtrics JavaScript is correctly sending postMessage
   - The iframe has loaded before the message is sent
   - There are no CORS/security errors in the console

### 3. Test Logging Actions

Perform these actions and verify logs are created:

- **Page View**: Load the article (should log automatically if enabled)
- **Click**: Click any link in the article content
- **Comment**: Submit a comment
- **Vote**: Upvote or downvote a comment

For each action, check the console for `[Logger] Logging event:` messages showing the studyId and qualtricsResponseId.

### 4. Verify Firestore Logs

1. Go to Firebase Console → Firestore Database
2. Navigate to the `logs` collection
3. Find recent log entries
4. Verify each entry has:
   - `studyId` field (should match the article's study)
   - `qualtricsResponseId` field (if embedded in Qualtrics)
   - `qualtricsSurveyId` field (if provided by Qualtrics)

### 5. Test Study ID Priority

The study ID is determined in this order:

1. **Article's studyId field** (from Firestore document) - **HIGHEST PRIORITY**
2. **URL parameter** (`?study=xxx`) - Fallback if article has no studyId
3. **Default study** (`'eonc'`) - Final fallback

To test:

- **Article with studyId**: Create an article with `studyId: 'test-study'` and embed it. Logs should show `studyId: 'test-study'` even without URL parameter.
- **Article without studyId + URL param**: Load article with `?study=other-study`. Logs should show `studyId: 'other-study'`.
- **Article without studyId + no URL param**: Load article without study param. Logs should show `studyId: 'eonc'` (default).

## Common Issues and Solutions

### Issue: studyId is missing or incorrect

**Symptoms**: Logs show `studyId: 'eonc'` when it should be different, or `studyId` is undefined.

**Solutions**:
1. Verify the article document in Firestore has a `studyId` field
2. Check that `ArticleClient.tsx` explicitly preserves `studyId` when passing to `ArticleContent`
3. Verify `convertToPlainObject` in `page.tsx` preserves the `studyId` field

### Issue: Qualtrics data is missing

**Symptoms**: Logs don't have `qualtricsResponseId` or `qualtricsSurveyId` fields.

**Solutions**:
1. Check Qualtrics JavaScript is sending postMessage correctly
2. Verify `useQualtrics` hook is receiving the message (check console)
3. Ensure `qualtricsData` is being passed through all components:
   - `ArticleClient` → `ArticleContent` → `useLogger`
   - `ArticleContent` → `Comments` → `CommentList` → `useLogger`

### Issue: Logs are created but fields are undefined

**Symptoms**: Log entries exist but `studyId` or `qualtricsResponseId` are `undefined`.

**Solutions**:
1. Check that `useLogger` is receiving both `articleStudyId` and `qualtricsData`
2. Verify the `effectiveStudyId` calculation: `articleStudyId || urlStudyId`
3. Check that `logEvent` in `logger.ts` properly handles undefined values (it filters them out)

## Testing Checklist

- [ ] Article loads in Qualtrics iframe
- [ ] Browser console shows Qualtrics data received
- [ ] Browser console shows logger initialized with correct studyId
- [ ] Click events are logged with studyId and qualtricsResponseId
- [ ] Comment submissions are logged with studyId and qualtricsResponseId
- [ ] Vote actions are logged with studyId and qualtricsResponseId
- [ ] Firestore logs collection has entries with both studyId and qualtricsResponseId
- [ ] Article without studyId falls back to URL parameter correctly
- [ ] Article without studyId and no URL param uses default studyId

## Files Involved

- `src/hooks/useQualtrics.ts` - Receives Qualtrics data via postMessage
- `src/hooks/useLogger.ts` - Combines studyId and Qualtrics data for logging
- `src/lib/logger.ts` - Saves log entries to Firestore
- `src/app/articles/[slug]/ArticleClient.tsx` - Passes article data (including studyId) and Qualtrics data
- `src/components/ArticleContent.tsx` - Extracts studyId from article and passes to logger
- `src/components/Comments.tsx` - Passes studyId and Qualtrics data to comment components
- `src/components/CommentList.tsx` - Uses logger with studyId and Qualtrics data
- `src/components/CommentVoteSection.tsx` - Uses logger with studyId and Qualtrics data

## Recent Changes

After the multi-study support rebase, the following ensures logging works correctly:

1. **Explicit studyId preservation**: `ArticleClient.tsx` now explicitly preserves `studyId` when creating the article object for `ArticleContent`
2. **Study ID priority**: `useLogger` prioritizes article's `studyId` over URL-based study ID
3. **Debug logging**: Added development-mode console logs to help verify data flow
4. **Data flow verification**: All components now properly pass both `studyId` and `qualtricsData` through the component tree

