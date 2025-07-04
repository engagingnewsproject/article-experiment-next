const admin = require('firebase-admin');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const fs = require('fs');

// Initialize Firebase Admin
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Google Sheets configuration
// You'll need to create a Google Service Account and share your Google Sheet with it
const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID || 'your-google-sheet-id-here';
const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || 'your-service-account@project.iam.gserviceaccount.com';

// Helper function to convert Firestore timestamp to ISO string
function convertTimestamp(timestamp) {
  if (!timestamp) return null;
  if (timestamp.toDate) {
    return timestamp.toDate().toISOString();
  }
  return timestamp;
}

// Helper function to flatten nested objects for spreadsheet
function flattenObject(obj, prefix = '') {
  const flattened = {};
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const newKey = prefix ? `${prefix}_${key}` : key;
      
      if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key]) && obj[key].toDate === undefined) {
        Object.assign(flattened, flattenObject(obj[key], newKey));
      } else {
        flattened[newKey] = Array.isArray(obj[key]) ? obj[key].join('; ') : obj[key];
      }
    }
  }
  
  return flattened;
}

async function exportLogsToSheet(doc) {
  console.log('Exporting logs to Google Sheets...');
  
  const logsRef = db.collection('logs');
  const snapshot = await logsRef.get();
  
  const logs = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    logs.push({
      id: doc.id,
      url: data.url || '',
      identifier: data.identifier || '',
      userId: data.userId || '',
      ipAddress: data.ipAddress || '',
      action: data.action || '',
      label: data.label || '',
      comment: data.comment || '',
      timestamp: convertTimestamp(data.timestamp),
      date: convertTimestamp(data.timestamp) ? new Date(convertTimestamp(data.timestamp)).toISOString().split('T')[0] : '',
      hour: convertTimestamp(data.timestamp) ? new Date(convertTimestamp(data.timestamp)).getHours() : '',
      dayOfWeek: convertTimestamp(data.timestamp) ? new Date(convertTimestamp(data.timestamp)).getDay() : '',
    });
  });

  // Create or get the logs sheet
  let sheet = doc.sheetsByTitle['User Logs'];
  if (!sheet) {
    sheet = await doc.addSheet({ title: 'User Logs' });
  }

  // Clear existing data
  await sheet.clear();

  // Add headers
  if (logs.length > 0) {
    const headers = Object.keys(logs[0]);
    await sheet.addRow(headers);
    
    // Add data rows
    for (const log of logs) {
      await sheet.addRow(Object.values(log));
    }
  }

  console.log(`Exported ${logs.length} log entries to Google Sheets`);
  return logs;
}

async function exportArticlesToSheet(doc) {
  console.log('Exporting articles to Google Sheets...');
  
  const articlesRef = db.collection('articles');
  const snapshot = await articlesRef.get();
  
  const articles = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    articles.push({
      id: doc.id,
      title: data.title || '',
      slug: data.slug || '',
      content: data.content || '',
      createdAt: convertTimestamp(data.createdAt),
      updatedAt: convertTimestamp(data.updatedAt),
      anonymous: data.anonymous || false,
      pubdate: data.pubdate || '',
      authorName: data.author?.name || '',
      authorBioPersonal: data.author?.bio?.personal || '',
      authorBioBasic: data.author?.bio?.basic || '',
      authorImageSrc: data.author?.image?.src || '',
      commentsDisplay: data.comments_display || false,
      explainBox: Array.isArray(data.explain_box) ? data.explain_box.join('; ') : data.explain_box || '',
      themes: Array.isArray(data.themes) ? data.themes.map(t => t.content).join('; ') : '',
      summary: data.summary || '',
      whoSpokeTo: Array.isArray(data.metadata?.who_spoke_to) ? data.metadata.who_spoke_to.join('; ') : '',
      whereWritten: data.metadata?.where_written || '',
      editor: data.metadata?.editor || '',
      corrections: data.metadata?.corrections || '',
      versionHistory: data.metadata?.version_history || '',
      category: data.metadata?.category || '',
      tags: Array.isArray(data.metadata?.tags) ? data.metadata.tags.join('; ') : '',
      wordCount: data.content ? data.content.split(/\s+/).length : 0,
      hasDefaultComments: Array.isArray(data.default_comments) && data.default_comments.length > 0,
      defaultCommentsCount: Array.isArray(data.default_comments) ? data.default_comments.length : 0,
    });
  });

  // Create or get the articles sheet
  let sheet = doc.sheetsByTitle['Articles'];
  if (!sheet) {
    sheet = await doc.addSheet({ title: 'Articles' });
  }

  // Clear existing data
  await sheet.clear();

  // Add headers
  if (articles.length > 0) {
    const headers = Object.keys(articles[0]);
    await sheet.addRow(headers);
    
    // Add data rows
    for (const article of articles) {
      await sheet.addRow(Object.values(article));
    }
  }

  console.log(`Exported ${articles.length} articles to Google Sheets`);
  return articles;
}

async function exportCommentsToSheet(doc) {
  console.log('Exporting comments to Google Sheets...');
  
  const articlesRef = db.collection('articles');
  const snapshot = await articlesRef.get();
  
  const allComments = [];
  snapshot.forEach(doc => {
    const articleData = doc.data();
    const articleId = doc.id;
    const defaultComments = articleData.default_comments || [];
    
    defaultComments.forEach((comment, index) => {
      allComments.push({
        id: comment.id || `default_${articleId}_${index}`,
        articleId: articleId,
        articleSlug: articleData.slug || '',
        articleTitle: articleData.title || '',
        content: comment.content || '',
        name: comment.name || '',
        createdAt: comment.createdAt || '',
        parentId: comment.parentId || '',
        upvotes: comment.upvotes || 0,
        downvotes: comment.downvotes || 0,
        isDefaultComment: true,
        replyCount: Array.isArray(comment.replies) ? comment.replies.length : 0,
      });
    });
  });

  // Create or get the comments sheet
  let sheet = doc.sheetsByTitle['Comments'];
  if (!sheet) {
    sheet = await doc.addSheet({ title: 'Comments' });
  }

  // Clear existing data
  await sheet.clear();

  // Add headers
  if (allComments.length > 0) {
    const headers = Object.keys(allComments[0]);
    await sheet.addRow(headers);
    
    // Add data rows
    for (const comment of allComments) {
      await sheet.addRow(Object.values(comment));
    }
  }

  console.log(`Exported ${allComments.length} comments to Google Sheets`);
  return allComments;
}

async function exportAuthorsToSheet(doc) {
  console.log('Exporting authors to Google Sheets...');
  
  const authorsRef = db.collection('authors');
  const snapshot = await authorsRef.get();
  
  const authors = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    authors.push({
      id: doc.id,
      name: data.name || '',
      bioPersonal: data.bio?.personal || '',
      bioBasic: data.bio?.basic || '',
      imageSrc: data.image?.src || '',
      imageAlt: data.image?.alt || '',
      createdAt: data.createdAt || '',
    });
  });

  // Create or get the authors sheet
  let sheet = doc.sheetsByTitle['Authors'];
  if (!sheet) {
    sheet = await doc.addSheet({ title: 'Authors' });
  }

  // Clear existing data
  await sheet.clear();

  // Add headers
  if (authors.length > 0) {
    const headers = Object.keys(authors[0]);
    await sheet.addRow(headers);
    
    // Add data rows
    for (const author of authors) {
      await sheet.addRow(Object.values(author));
    }
  }

  console.log(`Exported ${authors.length} authors to Google Sheets`);
  return authors;
}

async function createSummarySheet(doc, logs, articles, comments, authors) {
  console.log('Creating summary sheet...');
  
  const summary = {
    exportDate: new Date().toISOString(),
    totalRecords: {
      logs: logs.length,
      articles: articles.length,
      comments: comments.length,
      authors: authors.length
    },
    dateRange: {
      earliest: null,
      latest: null
    },
    userActivity: {
      uniqueUsers: new Set(logs.map(log => log.userId)).size,
      totalActions: logs.length,
      actionsByType: {}
    },
    articleStats: {
      averageWordCount: articles.reduce((sum, article) => sum + article.wordCount, 0) / articles.length || 0,
      articlesWithComments: articles.filter(article => article.hasDefaultComments).length,
      averageCommentsPerArticle: comments.length / articles.length || 0
    },
    commentStats: {
      averageUpvotes: comments.reduce((sum, comment) => sum + comment.upvotes, 0) / comments.length || 0,
      averageDownvotes: comments.reduce((sum, comment) => sum + comment.downvotes, 0) / comments.length || 0,
      totalReplies: comments.reduce((sum, comment) => sum + comment.replyCount, 0)
    }
  };

  // Calculate date range
  const timestamps = logs.map(log => log.timestamp).filter(Boolean);
  if (timestamps.length > 0) {
    summary.dateRange.earliest = new Date(Math.min(...timestamps.map(t => new Date(t)))).toISOString();
    summary.dateRange.latest = new Date(Math.max(...timestamps.map(t => new Date(t)))).toISOString();
  }

  // Calculate actions by type
  logs.forEach(log => {
    summary.userActivity.actionsByType[log.action] = (summary.userActivity.actionsByType[log.action] || 0) + 1;
  });

  // Create or get the summary sheet
  let sheet = doc.sheetsByTitle['Research Summary'];
  if (!sheet) {
    sheet = await doc.addSheet({ title: 'Research Summary' });
  }

  // Clear existing data
  await sheet.clear();

  // Add summary data
  await sheet.addRow(['Export Date', summary.exportDate]);
  await sheet.addRow(['']);
  await sheet.addRow(['Total Records']);
  await sheet.addRow(['Logs', summary.totalRecords.logs]);
  await sheet.addRow(['Articles', summary.totalRecords.articles]);
  await sheet.addRow(['Comments', summary.totalRecords.comments]);
  await sheet.addRow(['Authors', summary.totalRecords.authors]);
  await sheet.addRow(['']);
  await sheet.addRow(['Date Range']);
  await sheet.addRow(['Earliest', summary.dateRange.earliest]);
  await sheet.addRow(['Latest', summary.dateRange.latest]);
  await sheet.addRow(['']);
  await sheet.addRow(['User Activity']);
  await sheet.addRow(['Unique Users', summary.userActivity.uniqueUsers]);
  await sheet.addRow(['Total Actions', summary.userActivity.totalActions]);
  await sheet.addRow(['']);
  await sheet.addRow(['Actions by Type']);
  for (const [action, count] of Object.entries(summary.userActivity.actionsByType)) {
    await sheet.addRow([action, count]);
  }
  await sheet.addRow(['']);
  await sheet.addRow(['Article Statistics']);
  await sheet.addRow(['Average Word Count', Math.round(summary.articleStats.averageWordCount)]);
  await sheet.addRow(['Articles with Comments', summary.articleStats.articlesWithComments]);
  await sheet.addRow(['Average Comments per Article', Math.round(summary.articleStats.averageCommentsPerArticle * 100) / 100]);
  await sheet.addRow(['']);
  await sheet.addRow(['Comment Statistics']);
  await sheet.addRow(['Average Upvotes', Math.round(summary.commentStats.averageUpvotes * 100) / 100]);
  await sheet.addRow(['Average Downvotes', Math.round(summary.commentStats.averageDownvotes * 100) / 100]);
  await sheet.addRow(['Total Replies', summary.commentStats.totalReplies]);

  console.log('Summary sheet created');
}

async function exportToGoogleSheets() {
  if (!GOOGLE_SHEET_ID || GOOGLE_SHEET_ID === 'your-google-sheet-id-here') {
    console.error('Please set GOOGLE_SHEET_ID environment variable or update the script');
    console.log('To set up Google Sheets export:');
    console.log('1. Create a Google Service Account in Google Cloud Console');
    console.log('2. Download the service account key JSON file');
    console.log('3. Create a Google Sheet and share it with the service account email');
    console.log('4. Set GOOGLE_SHEET_ID environment variable');
    process.exit(1);
  }

  try {
    // Initialize Google Sheets
    const doc = new GoogleSpreadsheet(GOOGLE_SHEET_ID);
    
    // Authenticate with service account
    await doc.useServiceAccountAuth({
      client_email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY || 'your-private-key-here',
    });

    await doc.loadInfo();
    console.log(`Connected to Google Sheet: ${doc.title}`);

    // Export all data
    const [logs, articles, comments, authors] = await Promise.all([
      exportLogsToSheet(doc),
      exportArticlesToSheet(doc),
      exportCommentsToSheet(doc),
      exportAuthorsToSheet(doc)
    ]);

    await createSummarySheet(doc, logs, articles, comments, authors);

    console.log('\n=== GOOGLE SHEETS EXPORT COMPLETE ===');
    console.log(`Data exported to: https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}`);
    console.log('Sheets created:');
    console.log('- User Logs');
    console.log('- Articles');
    console.log('- Comments');
    console.log('- Authors');
    console.log('- Research Summary');
    
  } catch (error) {
    console.error('Error exporting to Google Sheets:', error);
    throw error;
  }
}

// Run the export
exportToGoogleSheets()
  .then(() => {
    console.log('Google Sheets export completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Google Sheets export failed:', error);
    process.exit(1);
  }); 