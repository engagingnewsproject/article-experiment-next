# Common Tasks Guide

This guide provides step-by-step instructions for common development and research tasks.

## Development Tasks

### Adding a New Article

1. Navigate to `/admin` and authenticate
2. Click "Add Article" or go to `/admin/add-article`
3. Fill in the form:
   - **Title**: Article headline
   - **Slug**: URL-friendly identifier (auto-generated from title)
   - **Content**: Article body (supports HTML)
   - **Study**: Select the study this article belongs to
   - **Author**: Will inherit from study config
   - **Publication Date**: Set the date
   - **Feature Flags**: Enable/disable features (explain box, comments, etc.)
4. Click "Save Article"
5. Article will be available at `/articles/[slug]?study=[studyId]`

### Creating a New Study

1. Navigate to `/admin/manage-studies`
2. Click "Add New Study"
3. Enter:
   - **Study ID**: Unique identifier (e.g., `msc`, `eonc`)
   - **Study Name**: Display name
   - **Aliases**: Optional, for backward compatibility
4. Click "Save"
5. (Optional) Create study configuration at `/admin/manage-project-configs`

### Creating a Study Configuration

1. Navigate to `/admin/manage-project-configs`
2. Find your study in the list
3. Click "Create Config" if it doesn't exist
4. Fill in:
   - **Site Name**: The news site name (e.g., "The Gazette Star")
   - **Author Name**: Author's name
   - **Author Bio (Personal)**: Personal biography version
   - **Author Bio (Basic)**: Basic biography version
   - **Author Image**: URL to author photo
   - **Publication Date Format**: How dates display
   - **Feature Flags**: Which features are enabled
5. Click "Save"
6. New articles in this study will inherit this configuration

### Editing an Article

1. Navigate to `/admin` and find the article
2. Click "Edit" or go to `/admin/edit-article/[id]`
3. Make your changes
4. Click "Save Article"
5. Changes are reflected immediately

### Adding Default Comments to an Article

1. Navigate to `/admin/add-default-comments`
2. Select an article from the dropdown
3. Enter comment details:
   - **Name**: Commenter name
   - **Content**: Comment text
   - **Upvotes/Downvotes**: Initial vote counts
4. Click "Add Comment"
5. Comments appear for all users viewing that article

## Research Tasks

### Viewing User Activity Logs

1. Navigate to `/admin/research-dashboard`
2. Authenticate with Firebase credentials
3. Click "User Activity" tab
4. Use filters to narrow results:
   - **Study**: Filter by research study
   - **QT Response ID**: Filter by Qualtrics response ID
   - **Date Range**: Filter by time period
   - **Action Type**: Filter by action (Click, Comment, etc.)
   - **Article**: Filter by specific article
5. Click "Export Filtered Data" to download CSV/JSON

### Exporting Research Data

**Option 1: Via Dashboard**
1. Go to Research Dashboard
2. Apply filters as needed
3. Click "Export Filtered Data" button
4. Download CSV or JSON file

**Option 2: Via Command Line**
```bash
npm run export-research
```
This exports all data to `./research-exports/` directory.

### Filtering Logs by Qualtrics Response ID

1. In Research Dashboard, go to "User Activity" tab
2. Enter response ID in "QT Response ID" filter field
3. Or check "Only show rows with QT Response ID" to see all logs with response IDs
4. Table updates automatically

### Viewing Comments

1. Navigate to `/admin/research-dashboard`
2. Click "Comments" tab
3. Use filters:
   - **Study**: Filter by study
   - **QT Response ID**: Filter by Qualtrics response ID
   - **Article**: Filter by article
   - **Date Range**: Filter by time
4. Toggle "Show Default Comments" to include/exclude default comments
5. View comment details, upvotes, downvotes, and timestamps

## Qualtrics Integration Tasks

### Setting Up Qualtrics Survey

1. Create your Qualtrics survey
2. Add an "Embedded Data" question type
3. Add JavaScript to each question with an embedded article:
   - See [Qualtrics Integration Guide](./qualtrics/QUALTRICS_INTEGRATION.md)
   - Use the provided JavaScript code
   - Include retry logic and REQUEST_QUALTRICS_DATA handler
4. Embed article iframe in question
5. Test in Qualtrics preview mode

### Verifying Qualtrics Integration

1. Open article in Qualtrics preview
2. Open browser DevTools console (iframe console, not parent)
3. Look for logs:
   - `[useQualtrics] Received postMessage event`
   - `[useQualtrics] Processing legacy format`
   - `[Logger] Logging event` with `qualtricsResponseId`
4. Perform actions (click, comment, etc.)
5. Check Research Dashboard to verify response IDs are logged

## Data Management Tasks

### Importing Data to Dev Environment

```bash
# Make sure you're using dev project
firebase use dev

# Import data from firestore-data/ directory
npm run import-data:dev
```

### Exporting Production Data

```bash
# Switch to production project
firebase use prod

# Export all data
npm run export-production-data
```

### Using Dev vs Production Firebase

```bash
# Live dev project (article-experiment-next-dev)
npm run dev

# Live production project (article-experiment-next)
npm run dev:prod

# Local emulator only (all data/auth local; project: article-experiment-next-dev)
npm run dev:emulator
```

## Troubleshooting Common Issues

### Logs Not Showing in Dashboard

1. Check authentication - make sure you're logged in
2. Verify Firestore rules allow `list` permission for logs
3. Check browser console for errors
4. Verify you're connected to correct Firebase project

### Qualtrics Response IDs Not Logging

1. Check if Qualtrics JavaScript includes retry logic
2. Verify REQUEST_QUALTRICS_DATA handler is in Qualtrics code
3. Check iframe console (not parent console) for errors
4. Verify postMessage is being sent from Qualtrics
5. See [Qualtrics Verification Guide](./qualtrics/QUALTRICS_LOGGING_VERIFICATION.md)

### Articles Not Displaying

1. Check article has a `studyId` field
2. Verify study configuration exists
3. Check URL includes `?study=[studyId]` parameter
4. Verify article is published (not draft)

### Can't Access Admin Pages

1. Verify Firebase Auth is set up
2. Check user exists in Firebase Console → Authentication
3. Verify email is in allowed list (if using simple auth)
4. Clear browser localStorage and try again
5. Check Firebase project connection

## Quick Reference

### Important URLs

- **Home**: `/`
- **Article**: `/articles/[slug]?study=[studyId]`
- **Admin Dashboard**: `/admin`
- **Research Dashboard**: `/admin/research-dashboard`
- **Manage Studies**: `/admin/manage-studies`
- **Manage Configs**: `/admin/manage-project-configs`
- **Add Article**: `/admin/add-article`
- **Edit Article**: `/admin/edit-article/[id]`

### Key File Locations

- **Articles**: Firestore `articles/` collection
- **Logs**: Firestore `logs/` collection
- **Comments**: Firestore `articles/[id]/comments/` subcollection
- **Studies**: Firestore `studies/` collection
- **Configs**: Firestore `projectConfigs/` collection

### Environment Variables

- `.env.local` - Local development config
- `.env.dev` - Dev Firebase project config
- `.env.prod` - Production Firebase project config

See [Local Dev Setup](./dev/LOCAL_DEV_SETUP.md) for details.
