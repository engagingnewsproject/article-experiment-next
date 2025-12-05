/**
 * Export script to download all data from PRODUCTION Firestore.
 * 
 * This script:
 * - Connects to production Firestore (not emulator)
 * - Exports all collections: articles, comments, logs, studies, projectConfigs, authors
 * - Handles nested subcollections (comments under articles)
 * - Saves data to firestore-data/ directory
 * 
 * Usage: node scripts/exportProductionData.js
 * 
 * WARNING: This connects to PRODUCTION. Make sure NEXT_PUBLIC_USE_LIVE_FIRESTORE is NOT set.
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin - connects to PRODUCTION
const serviceAccount = require('../serviceAccountKey.json');

// DO NOT set FIRESTORE_EMULATOR_HOST - we want production
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

/**
 * Exports a top-level collection to a JSON file.
 */
async function exportCollection(collectionPath, outputPath) {
  console.log(`Exporting collection: ${collectionPath}...`);
  const collectionRef = db.collection(collectionPath);
  const snapshot = await collectionRef.get();
  
  const data = {};
  snapshot.forEach(doc => {
    data[doc.id] = doc.data();
  });

  // Create directory if it doesn't exist
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Write to file
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
  console.log(`  ✓ Exported ${snapshot.size} documents from ${collectionPath} to ${outputPath}`);
  return snapshot.size;
}

/**
 * Exports comments subcollection for all articles.
 * Comments are stored as: articles/{articleId}/comments/{commentId}
 */
async function exportComments(outputDir) {
  console.log('Exporting comments subcollections...');
  
  // Get all articles first
  const articlesRef = db.collection('articles');
  const articlesSnapshot = await articlesRef.get();
  
  const allComments = {};
  let totalComments = 0;
  
  for (const articleDoc of articlesSnapshot.docs) {
    const articleId = articleDoc.id;
    const commentsRef = db.collection('articles').doc(articleId).collection('comments');
    const commentsSnapshot = await commentsRef.get();
    
    if (commentsSnapshot.size > 0) {
      allComments[articleId] = {};
      commentsSnapshot.forEach(commentDoc => {
        allComments[articleId][commentDoc.id] = commentDoc.data();
        totalComments++;
      });
    }
  }
  
  const outputPath = path.join(outputDir, 'comments.json');
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(outputPath, JSON.stringify(allComments, null, 2));
  console.log(`  ✓ Exported ${totalComments} comments from ${Object.keys(allComments).length} articles to ${outputPath}`);
  return totalComments;
}

/**
 * Main export function.
 */
async function exportAllData() {
  const outputDir = path.resolve(__dirname, '../firestore-data');
  
  console.log('='.repeat(60));
  console.log('EXPORTING FROM PRODUCTION FIRESTORE');
  console.log('='.repeat(60));
  console.log(`Output directory: ${outputDir}`);
  console.log('');
  
  let totalDocs = 0;
  
  try {
    // Export top-level collections
    totalDocs += await exportCollection('articles', path.join(outputDir, 'articles.json'));
    totalDocs += await exportCollection('authors', path.join(outputDir, 'authors.json'));
    totalDocs += await exportCollection('studies', path.join(outputDir, 'studies.json'));
    totalDocs += await exportCollection('projectConfigs', path.join(outputDir, 'projectConfigs.json'));
    totalDocs += await exportCollection('logs', path.join(outputDir, 'logs.json'));
    
    // Export subcollections
    const commentCount = await exportComments(outputDir);
    totalDocs += commentCount;
    
    console.log('');
    console.log('='.repeat(60));
    console.log(`✓ Export completed successfully!`);
    console.log(`  Total documents exported: ${totalDocs}`);
    console.log(`  Data saved to: ${outputDir}`);
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('');
    console.error('='.repeat(60));
    console.error('❌ Error exporting data:', error);
    console.error('='.repeat(60));
    throw error;
  }
}

// Run export
exportAllData()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

