/**
 * Import script to load Firestore data into the LIVE DEV FIREBASE PROJECT.
 * 
 * This script:
 * - Connects to live dev Firebase project (article-experiment-next-dev)
 * - Imports all collections: articles, comments, logs, studies, projectConfigs, authors
 * - Handles nested subcollections (comments under articles)
 * - Loads data from firestore-data/ directory
 * 
 * Usage: node scripts/importFirestoreDataToDev.js
 * 
 * IMPORTANT: This imports to LIVE DEV PROJECT. Make sure you're using the correct project!
 * Run: firebase use dev
 */

console.log('[import] importFirestoreDataToDev.js started');
console.log('[import] CWD:', process.cwd());
console.log('Running importFirestoreDataToDev.js...');

// DO NOT set FIRESTORE_EMULATOR_HOST - we want to connect to live Firebase
// process.env.FIRESTORE_EMULATOR_HOST is intentionally NOT set

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Use DEV project ID
const DEV_PROJECT_ID = 'article-experiment-next-dev';

// Try to use dev-specific service account key, fall back to default
let serviceAccount;
const devServiceAccountPath = path.resolve(__dirname, '../serviceAccountKey-dev.json');
const defaultServiceAccountPath = path.resolve(__dirname, '../serviceAccountKey.json');

if (fs.existsSync(devServiceAccountPath)) {
  console.log('Using dev-specific service account key: serviceAccountKey-dev.json');
  serviceAccount = require(devServiceAccountPath);
} else if (fs.existsSync(defaultServiceAccountPath)) {
  console.log('Using default service account key: serviceAccountKey.json');
  console.log('⚠️  Note: Make sure this key has access to the dev project!');
  serviceAccount = require(defaultServiceAccountPath);
} else {
  throw new Error('No service account key found! Please download one from Firebase Console.');
}

// Initialize Firebase Admin with dev project
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: DEV_PROJECT_ID,
});

const db = admin.firestore();

console.log('='.repeat(60));
console.log('IMPORTING TO LIVE DEV FIREBASE PROJECT');
console.log('='.repeat(60));
console.log(`Project ID: ${DEV_PROJECT_ID}`);
console.log(`Connecting to: LIVE Firebase (not emulator)`);
console.log('');

const dataDir = path.resolve(__dirname, '../firestore-data');

/**
 * Imports a top-level collection from a JSON file.
 */
async function importCollection(collectionPath, inputPath) {
  if (!fs.existsSync(inputPath)) {
    console.log(`  ⚠ Skipping ${collectionPath} - file not found: ${inputPath}`);
    return 0;
  }
  
  console.log(`Importing collection: ${collectionPath}...`);
  const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  
  let count = 0;
  for (const [docId, docData] of Object.entries(data)) {
    await db.collection(collectionPath).doc(docId).set(docData);
    count++;
  }
  
  console.log(`  ✓ Imported ${count} documents to ${collectionPath}`);
  return count;
}

/**
 * Imports comments subcollections for articles.
 * Comments are stored as: articles/{articleId}/comments/{commentId}
 */
async function importComments(inputPath) {
  if (!fs.existsSync(inputPath)) {
    console.log(`  ⚠ Skipping comments - file not found: ${inputPath}`);
    return 0;
  }
  
  console.log('Importing comments subcollections...');
  const allComments = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  
  let totalComments = 0;
  for (const [articleId, comments] of Object.entries(allComments)) {
    for (const [commentId, commentData] of Object.entries(comments)) {
      await db.collection('articles').doc(articleId).collection('comments').doc(commentId).set(commentData);
      totalComments++;
    }
  }
  
  console.log(`  ✓ Imported ${totalComments} comments from ${Object.keys(allComments).length} articles`);
  return totalComments;
}

/**
 * Main import function.
 */
async function importAllData() {
  console.log(`Data directory: ${dataDir}`);
  console.log('');
  
  // Confirm before proceeding
  console.log('⚠️  WARNING: This will import data to LIVE DEV Firebase project!');
  console.log(`   Project: ${DEV_PROJECT_ID}`);
  console.log('');
  
  let totalDocs = 0;
  
  try {
    // Import top-level collections
    totalDocs += await importCollection('articles', path.join(dataDir, 'articles.json'));
    totalDocs += await importCollection('authors', path.join(dataDir, 'authors.json'));
    totalDocs += await importCollection('studies', path.join(dataDir, 'studies.json'));
    totalDocs += await importCollection('projectConfigs', path.join(dataDir, 'projectConfigs.json'));
    totalDocs += await importCollection('logs', path.join(dataDir, 'logs.json'));
    
    // Import subcollections
    const commentCount = await importComments(path.join(dataDir, 'comments.json'));
    totalDocs += commentCount;
    
    console.log('');
    console.log('='.repeat(60));
    console.log(`✓ Import completed successfully!`);
    console.log(`  Total documents imported: ${totalDocs}`);
    console.log(`  Project: ${DEV_PROJECT_ID}`);
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('');
    console.error('='.repeat(60));
    console.error('❌ Error importing data:', error);
    console.error('='.repeat(60));
    throw error;
  }
}

importAllData()
  .then(() => {
    console.log('>>> importFirestoreDataToDev.js finished');
    console.log('[import] importFirestoreDataToDev.js finished');
    process.exit(0);
  })
  .catch(error => {
    console.error('[import] Error importing data:', error);
    process.exit(1);
  });
