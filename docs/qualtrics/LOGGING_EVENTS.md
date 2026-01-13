# Logging Events Reference

This document lists all events that are logged to Firestore and what data is captured for each.

## Log Entry Structure

Every log entry in Firestore includes these fields:

| Field | Type | Description |
|-------|------|-------------|
| `url` | string | The URL where the event happened (window.location.href) |
| `identifier` | string | Unique identifier for the context (usually article ID) |
| `articleTitle` | string? | The title of the article (optional) |
| `userId` | string | The user's ID (from localStorage) or 'anonymous' |
| `ipAddress` | string? | The user's public IP address (from api.ipify.org) |
| `action` | string | The type of action (see actions below) |
| `label` | string | A label describing the event in detail |
| `details` | string | Additional details about the event |
| `timestamp` | Date | Server-generated timestamp (Firestore serverTimestamp) |
| `qualtricsResponseId` | string? | Qualtrics survey response ID (if embedded in survey) |
| `qualtricsSurveyId` | string? | Qualtrics survey ID (if embedded in survey) |
| `studyId` | string? | Study/Project identifier (e.g., 'eonc', 'msc') |

## Logged Events

### 1. Page View
**Action:** `"Page View"`  
**Status:** Currently **commented out** (not actively logging)  
**Location:** `src/components/ArticleContent.tsx` (lines 144-177)

**When it would log:**
- When an article page loads
- Only once per article (prevents duplicates when Qualtrics data arrives)

**Data captured:**
- `action`: `"Page View"`
- `label`: Article title
- `details`: `"Loaded"`
- `identifier`: Article ID
- `articleTitle`: Article title

**Note:** This logging is currently disabled. To enable it, uncomment the `useEffect` block in `ArticleContent.tsx`.

---

### 2. Time Spent
**Action:** `"Time Spent"`  
**Status:** Currently **commented out** (not actively logging)  
**Location:** `src/components/ArticleContent.tsx` (lines 152-161)

**When it would log:**
- When user leaves the page (beforeunload event)
- Calculates total time spent on the article

**Data captured:**
- `action`: `"Time Spent"`
- `label`: Article title
- `details`: Time spent formatted as `"Xm Ys"` (e.g., "5m 23s")
- `identifier`: Article ID
- `articleTitle`: Article title

**Note:** This logging is currently disabled. To enable it, uncomment the `useEffect` block in `ArticleContent.tsx`.

---

### 3. Article Link Click
**Action:** `"Click"`  
**Status:** ✅ **Active**  
**Location:** `src/components/ArticleContent.tsx` (lines 182-195)

**When it logs:**
- When a user clicks any link (`<a>` tag) within the article content

**Data captured:**
- `action`: `"Click"`
- `label`: `"Article Link: {linkText}"` (the text of the clicked link)
- `details`: The URL of the clicked link
- `identifier`: Article ID
- `articleTitle`: Article title

**Example:**
```javascript
{
  action: "Click",
  label: "Article Link: Read more about this topic",
  details: "https://example.com/article",
  identifier: "article-123",
  articleTitle: "Main Article Title"
}
```

---

### 4. Comment Submission
**Action:** `"Comment"`  
**Status:** ✅ **Active**  
**Location:** `src/components/ArticleContent.tsx` (lines 296-304)

**When it logs:**
- When a user submits a new top-level comment on an article

**Data captured:**
- `action`: `"Comment"`
- `label`: Article title
- `details`: `"{commenterName}: {commentContent}"`
- `identifier`: Article ID
- `articleTitle`: Article title

**Example:**
```javascript
{
  action: "Comment",
  label: "Main Article Title",
  details: "John Doe: This is a great article!",
  identifier: "article-123",
  articleTitle: "Main Article Title"
}
```

---

### 5. Reply Submission
**Action:** `"Reply"`  
**Status:** ✅ **Active**  
**Location:** `src/components/CommentList.tsx` (lines 124-131)

**When it logs:**
- When a user submits a reply to an existing comment

**Data captured:**
- `action`: `"Reply"`
- `label`: Article title (or identifier if title not available)
- `details`: `"{replyAuthorName}: {replyContent}"`
- `identifier`: Article ID
- `articleTitle`: Article title

**Example:**
```javascript
{
  action: "Reply",
  label: "Main Article Title",
  details: "Jane Smith: I agree with your point!",
  identifier: "article-123",
  articleTitle: "Main Article Title"
}
```

---

### 6. Comment Upvote
**Action:** `"Upvote "` (note the trailing space)  
**Status:** ✅ **Active**  
**Location:** `src/components/CommentVoteSection.tsx` (lines 95-102)

**When it logs:**
- When a user clicks the upvote button on a comment or reply

**Data captured:**
- `action`: `"Upvote "`
- `label`: `"Upvote"`
- `details`: `"Voted on commentId: {commentId}"`
- `identifier`: Article ID
- `articleTitle`: Article title (optional)

**Example:**
```javascript
{
  action: "Upvote ",
  label: "Upvote",
  details: "Voted on commentId: comment-456",
  identifier: "article-123",
  articleTitle: "Main Article Title"
}
```

---

### 7. Comment Downvote
**Action:** `"Downvote "` (note the trailing space)  
**Status:** ✅ **Active**  
**Location:** `src/components/CommentVoteSection.tsx` (lines 95-102)

**When it logs:**
- When a user clicks the downvote button on a comment or reply

**Data captured:**
- `action`: `"Downvote "`
- `label`: `"Downvote"`
- `details`: `"Voted on commentId: {commentId}"`
- `identifier`: Article ID
- `articleTitle`: Article title (optional)

**Example:**
```javascript
{
  action: "Downvote ",
  label: "Downvote",
  details: "Voted on commentId: comment-456",
  identifier: "article-123",
  articleTitle: "Main Article Title"
}
```

---

### 8. Reveal Comments (Show More)
**Action:** `"Click"`  
**Status:** ✅ **Active**  
**Location:** `src/components/CommentList.tsx` (lines 301-304)

**When it logs:**
- When a user clicks "Show more" or similar button to reveal additional comments

**Data captured:**
- `action`: `"Click"`
- `label`: Article title
- `details`: `"Revealed comments"`
- `identifier`: Article ID
- `articleTitle`: Article title

**Example:**
```javascript
{
  action: "Click",
  label: "Main Article Title",
  details: "Revealed comments",
  identifier: "article-123",
  articleTitle: "Main Article Title"
}
```

---

## Summary of Active Logging

Currently, the following events are **actively being logged**:

1. ✅ **Article Link Clicks** - When users click links in article content
2. ✅ **Comment Submissions** - When users submit new comments
3. ✅ **Reply Submissions** - When users reply to comments
4. ✅ **Comment Upvotes** - When users upvote comments/replies
5. ✅ **Comment Downvotes** - When users downvote comments/replies
6. ✅ **Reveal Comments** - When users expand to see more comments

The following events are **currently disabled** (commented out):

1. ❌ **Page Views** - Article page loads
2. ❌ **Time Spent** - Time spent on article page

## Qualtrics Integration

When articles are embedded in Qualtrics surveys, all log entries automatically include:
- `qualtricsResponseId`: The unique survey response ID
- `qualtricsSurveyId`: The survey ID (if provided)

This allows linking article interactions with specific survey responses.

## Study ID

All log entries include a `studyId` field that identifies which research study/project the article belongs to. The studyId is determined in this priority order:

1. Article's `studyId` field (from Firestore document) - **Highest priority**
2. URL parameter (`?study=xxx`) - Fallback if article has no studyId
3. Default study (`'eonc'`) - Final fallback

## Firestore Collection

All logs are stored in the Firestore `logs` collection. Each log entry is a document with:
- Auto-generated document ID
- All fields listed above
- Server-generated `timestamp` field

## Querying Logs

To query logs in Firestore:

```javascript
// Get all logs for a specific article
const logsRef = collection(db, 'logs');
const q = query(logsRef, where('identifier', '==', 'article-123'));

// Get all logs for a specific Qualtrics response
const q = query(logsRef, where('qualtricsResponseId', '==', 'R_abc123'));

// Get all logs for a specific study
const q = query(logsRef, where('studyId', '==', 'eonc'));

// Get all comment submissions
const q = query(logsRef, where('action', '==', 'Comment'));
```

