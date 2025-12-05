/**
 * Import script to load Firestore data into the LOCAL EMULATOR.
 * 
 * This script:
 * - Connects to Firestore emulator (localhost:8080)
 * - Imports all collections: articles, comments, logs, studies, projectConfigs, authors
 * - Handles nested subcollections (comments under articles)
 * - Loads data from firestore-data/ directory
 * 
 * Usage: node scripts/importFirestoreData.js
 * 
 * IMPORTANT: This imports to the EMULATOR. Make sure the emulator is running.
 */

console.log('[import] importFirestoreData.js started');
console.log('[import] CWD:', process.cwd());
console.log('Running importFirestoreData.js...');

// Set emulator host to ensure we connect to emulator, not production
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const serviceAccount = require('../serviceAccountKey.json');

// This must match your emulator project ID!
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'article-experiment-next',
});

const db = admin.firestore();

console.log('Using project ID:', admin.instanceId().app.options.projectId);
console.log('Connecting to emulator at:', process.env.FIRESTORE_EMULATOR_HOST);
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
  console.log('='.repeat(60));
  console.log('IMPORTING TO FIRESTORE EMULATOR');
  console.log('='.repeat(60));
  console.log(`Data directory: ${dataDir}`);
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
    console.log('>>> importFirestoreData.js finished');
    console.log('[import] importFirestoreData.js finished');
    process.exit(0);
  })
  .catch(error => {
    console.error('[import] Error importing data:', error);
    process.exit(1);
  }); 