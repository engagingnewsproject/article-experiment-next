const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const csv = require('csv-writer').createObjectCsvWriter;

// Initialize Firebase Admin
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Helper function to convert Firestore timestamp to ISO string
function convertTimestamp(timestamp) {
  if (!timestamp) return null;
  if (timestamp.toDate) {
    return timestamp.toDate().toISOString();
  }
  return timestamp;
}

// Helper function to flatten nested objects for CSV export
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

async function exportLogs() {
  console.log('Exporting logs...');
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
      // Add derived fields for analysis
      date: convertTimestamp(data.timestamp) ? new Date(convertTimestamp(data.timestamp)).toISOString().split('T')[0] : '',
      hour: convertTimestamp(data.timestamp) ? new Date(convertTimestamp(data.timestamp)).getHours() : '',
      dayOfWeek: convertTimestamp(data.timestamp) ? new Date(convertTimestamp(data.timestamp)).getDay() : '',
    });
  });

  // Export as JSON
  fs.writeFileSync('./research-exports/logs.json', JSON.stringify(logs, null, 2));
  
  // Export as CSV
  if (logs.length > 0) {
    const csvWriter = csv({
      path: './research-exports/logs.csv',
      header: Object.keys(logs[0]).map(key => ({ id: key, title: key }))
    });
    await csvWriter.writeRecords(logs);
  }
  
  console.log(`Exported ${logs.length} log entries`);
  return logs;
}

async function exportArticles() {
  console.log('Exporting articles...');
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
      authorEmail: data.author?.email || '',
      authorBioPersonal: data.author?.bio?.personal || '',
      authorBioBasic: data.author?.bio?.basic || '',
      authorImageSrc: data.author?.image?.src || '',
      commentsDisplay: data.comments_display || false,
      explainBox: Array.isArray(data.explain_box) ? data.explain_box.join('; ') : data.explain_box || '',
      themes: Array.isArray(data.themes) ? data.themes.map(t => t.content).join('; ') : '',
      summary: data.summary || '',
      // Metadata
      whoSpokeTo: Array.isArray(data.metadata?.who_spoke_to) ? data.metadata.who_spoke_to.join('; ') : '',
      whereWritten: data.metadata?.where_written || '',
      editor: data.metadata?.editor || '',
      corrections: data.metadata?.corrections || '',
      versionHistory: data.metadata?.version_history || '',
      category: data.metadata?.category || '',
      tags: Array.isArray(data.metadata?.tags) ? data.metadata.tags.join('; ') : '',
      // Derived fields
      wordCount: data.content ? data.content.split(/\s+/).length : 0,
      hasDefaultComments: Array.isArray(data.default_comments) && data.default_comments.length > 0,
      defaultCommentsCount: Array.isArray(data.default_comments) ? data.default_comments.length : 0,
    });
  });

  // Export as JSON
  fs.writeFileSync('./research-exports/articles.json', JSON.stringify(articles, null, 2));
  
  // Export as CSV
  if (articles.length > 0) {
    const csvWriter = csv({
      path: './research-exports/articles.csv',
      header: Object.keys(articles[0]).map(key => ({ id: key, title: key }))
    });
    await csvWriter.writeRecords(articles);
  }
  
  console.log(`Exported ${articles.length} articles`);
  return articles;
}

async function exportComments() {
  console.log('Exporting comments...');
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
        // Flatten replies for analysis
        replies: Array.isArray(comment.replies) ? comment.replies.map(r => ({
          id: r.id || '',
          content: r.content || '',
          name: r.name || '',
          upvotes: r.upvotes || 0,
          downvotes: r.downvotes || 0,
          createdAt: r.createdAt || '',
          parentId: comment.id || '',
          grandParentId: comment.parentId || '',
        })) : []
      });
    });
  });

  // Export as JSON
  fs.writeFileSync('./research-exports/comments.json', JSON.stringify(allComments, null, 2));
  
  // Export as CSV (flattened)
  if (allComments.length > 0) {
    const flattenedComments = allComments.map(comment => {
      const flattened = flattenObject(comment);
      // Remove the replies array from CSV as it's complex
      delete flattened.replies;
      return flattened;
    });
    
    const csvWriter = csv({
      path: './research-exports/comments.csv',
      header: Object.keys(flattenedComments[0]).map(key => ({ id: key, title: key }))
    });
    await csvWriter.writeRecords(flattenedComments);
  }
  
  console.log(`Exported ${allComments.length} comments`);
  return allComments;
}

async function exportAuthors() {
  console.log('Exporting authors...');
  const authorsRef = db.collection('authors');
  const snapshot = await authorsRef.get();
  
  const authors = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    authors.push({
      id: doc.id,
      name: data.name || '',
      email: data.email || '',
      bioPersonal: data.bio?.personal || '',
      bioBasic: data.bio?.basic || '',
      imageSrc: data.image?.src || '',
      imageAlt: data.image?.alt || '',
      createdAt: data.createdAt || '',
    });
  });

  // Export as JSON
  fs.writeFileSync('./research-exports/authors.json', JSON.stringify(authors, null, 2));
  
  // Export as CSV
  if (authors.length > 0) {
    const csvWriter = csv({
      path: './research-exports/authors.csv',
      header: Object.keys(authors[0]).map(key => ({ id: key, title: key }))
    });
    await csvWriter.writeRecords(authors);
  }
  
  console.log(`Exported ${authors.length} authors`);
  return authors;
}

async function generateResearchSummary(logs, articles, comments, authors) {
  console.log('Generating research summary...');
  
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

  // Export summary
  fs.writeFileSync('./research-exports/research-summary.json', JSON.stringify(summary, null, 2));
  
  console.log('Research summary generated');
  return summary;
}

async function exportAllResearchData() {
  // Create research-exports directory
  if (!fs.existsSync('./research-exports')) {
    fs.mkdirSync('./research-exports', { recursive: true });
  }

  console.log('Starting comprehensive data export for research...');
  
  try {
    const [logs, articles, comments, authors] = await Promise.all([
      exportLogs(),
      exportArticles(),
      exportComments(),
      exportAuthors()
    ]);

    await generateResearchSummary(logs, articles, comments, authors);

    console.log('\n=== EXPORT COMPLETE ===');
    console.log('Files exported to ./research-exports/:');
    console.log('- logs.json & logs.csv');
    console.log('- articles.json & articles.csv');
    console.log('- comments.json & comments.csv');
    console.log('- authors.json & authors.csv');
    console.log('- research-summary.json');
    console.log('\nData ready for research analysis!');
    
  } catch (error) {
    console.error('Error during export:', error);
    throw error;
  }
}

// Run the export
exportAllResearchData()
  .then(() => {
    console.log('Export completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Export failed:', error);
    process.exit(1);
  }); 