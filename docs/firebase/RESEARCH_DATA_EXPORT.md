# Research Data Export Guide

This guide explains how to export and analyze data from the Article Experiment project for research purposes.

## Overview

The Article Experiment project stores data in Firebase Firestore with the following collections:
- **logs**: User interactions and events
- **articles**: Article content and metadata
- **authors**: Author information
- **comments**: User comments and engagement

## Export Options

### Option 1: Local File Export (Recommended)

Export data to local files in multiple formats (JSON, CSV) for analysis in statistical software.

```bash
# Install dependencies
npm install

# Export all data to ./research-exports/
npm run export-research
```

This creates:
- `logs.json` & `logs.csv` - User interaction logs
- `articles.json` & `articles.csv` - Article content and metadata
- `comments.json` & `comments.csv` - User comments
- `authors.json` & `authors.csv` - Author information
- `research-summary.json` - Summary statistics

### Option 2: Google Sheets Export

Export data directly to Google Sheets for collaborative analysis.

#### Setup Google Sheets Integration:

1. **Create a Google Service Account:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable Google Sheets API
   - Create a Service Account
   - Download the JSON key file

2. **Set up environment variables:**
   ```bash
   export GOOGLE_SHEET_ID="your-google-sheet-id"
   export GOOGLE_SERVICE_ACCOUNT_EMAIL="your-service-account@project.iam.gserviceaccount.com"
   export GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   ```

3. **Create and share a Google Sheet:**
   - Create a new Google Sheet
   - Share it with your service account email (Editor access)
   - Copy the Sheet ID from the URL

4. **Run the export:**
   ```bash
   npm run export-google-sheets
   ```

### Option 3: Web Dashboard

Access a web-based dashboard for real-time data viewing and export.

```bash
# Start the development server
npm run dev

# Navigate to: http://localhost:3000/admin/research-dashboard
```

Features:
- Real-time statistics
- Filter by date range and action type
- Export filtered data to CSV
- View recent activity

## Data Structure

### Logs Collection
Each log entry contains:
- `id`: Unique identifier
- `url`: Page URL where event occurred
- `identifier`: Article ID or context identifier
- `userId`: Anonymous user identifier
- `ipAddress`: User's IP address (if available)
- `action`: Type of action (e.g., "Page View", "Click", "Comment")
- `label`: Descriptive label for the event
- `comment`: Additional details
- `timestamp`: When the event occurred
- `date`: Date only (for analysis)
- `hour`: Hour of day (0-23)
- `dayOfWeek`: Day of week (0-6, Sunday=0)

### Articles Collection
Each article contains:
- `id`: Unique identifier
- `title`: Article title
- `slug`: URL-friendly identifier
- `content`: Full article content
- `createdAt`/`updatedAt`: Timestamps
- `anonymous`: Whether author is anonymous
- `pubdate`: Publication date
- `author`: Author information (name, email, bio, image)
- `comments_display`: Whether comments are shown
- `explain_box`: Trust project explanation content
- `themes`: Article themes
- `summary`: Article summary
- `metadata`: Additional metadata (sources, editor, etc.)
- `default_comments`: Pre-loaded comments
- `wordCount`: Calculated word count
- `hasDefaultComments`: Whether article has comments
- `defaultCommentsCount`: Number of default comments

### Comments Collection
Each comment contains:
- `id`: Unique identifier
- `articleId`: Associated article ID
- `articleSlug`/`articleTitle`: Article reference
- `content`: Comment text
- `name`: Commenter name
- `createdAt`: Creation timestamp
- `parentId`: Parent comment ID (for replies)
- `upvotes`/`downvotes`: Engagement metrics
- `isDefaultComment`: Whether it's a pre-loaded comment
- `replyCount`: Number of replies

## Analysis Examples

### User Engagement Analysis
```python
import pandas as pd

# Load logs data
logs_df = pd.read_csv('research-exports/logs.csv')

# Analyze user engagement by action type
action_counts = logs_df['action'].value_counts()
print("User actions by type:")
print(action_counts)

# Analyze engagement over time
logs_df['timestamp'] = pd.to_datetime(logs_df['timestamp'])
daily_engagement = logs_df.groupby(logs_df['timestamp'].dt.date).size()
print("Daily engagement:")
print(daily_engagement)
```

### Article Performance Analysis
```python
import pandas as pd

# Load articles data
articles_df = pd.read_csv('research-exports/articles.csv')

# Analyze article characteristics
print("Average word count:", articles_df['wordCount'].mean())
print("Articles with comments:", articles_df['hasDefaultComments'].sum())
print("Average comments per article:", articles_df['defaultCommentsCount'].mean())

# Analyze by author
author_stats = articles_df.groupby('authorName').agg({
    'wordCount': ['mean', 'count'],
    'defaultCommentsCount': 'mean'
})
print("Author statistics:")
print(author_stats)
```

### Comment Engagement Analysis
```python
import pandas as pd

# Load comments data
comments_df = pd.read_csv('research-exports/comments.csv')

# Analyze comment engagement
print("Average upvotes:", comments_df['upvotes'].mean())
print("Average downvotes:", comments_df['downvotes'].mean())
print("Total replies:", comments_df['replyCount'].sum())

# Find most engaging comments
top_comments = comments_df.nlargest(10, 'upvotes')
print("Top comments by upvotes:")
print(top_comments[['content', 'upvotes', 'articleTitle']])
```

## Research Considerations

### Privacy and Ethics
- User IDs are anonymized
- IP addresses are collected but should be handled carefully
- Consider data retention policies
- Ensure compliance with research ethics requirements

### Data Quality
- Check for missing data in timestamps
- Verify user ID consistency
- Look for duplicate entries
- Validate comment content

### Statistical Analysis
- Use appropriate statistical tests for your research questions
- Consider time-series analysis for engagement patterns
- Account for multiple comparisons if testing multiple hypotheses
- Document your analysis methodology

## Troubleshooting

### Common Issues

1. **Permission Denied Errors:**
   - Ensure Firebase service account has proper permissions
   - Check Google Sheets sharing settings
   - Verify environment variables are set correctly

2. **Missing Data:**
   - Check Firestore security rules
   - Verify collection names match exactly
   - Ensure timestamps are in correct format

3. **Export Failures:**
   - Check available disk space
   - Verify network connectivity
   - Review error logs for specific issues

### Getting Help

For technical issues:
1. Check the console output for error messages
2. Verify your Firebase configuration
3. Ensure all dependencies are installed
4. Check file permissions in the export directory

## Advanced Usage

### Custom Exports
You can modify the export scripts to include additional fields or filters:

```javascript
// In exportResearchData.js, add custom fields
const customLogs = logs.map(log => ({
  ...log,
  customField: calculateCustomValue(log),
  derivedMetric: computeMetric(log)
}));
```

### Automated Exports
Set up cron jobs for regular data exports:

```bash
# Export data daily at 2 AM
0 2 * * * cd /path/to/project && npm run export-research
```

### Data Validation
Add validation checks to ensure data quality:

```javascript
// Validate log entries
const validLogs = logs.filter(log => 
  log.timestamp && 
  log.userId && 
  log.action
);
```

## Contact

For questions about data structure or research methodology, contact the research team. 