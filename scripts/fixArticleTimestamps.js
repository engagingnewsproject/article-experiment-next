/**
 * Script to fix malformed createdAt timestamps in dev Firestore articles.
 * 
 * This script:
 * - Connects to the dev Firebase project (article-experiment-next-dev)
 * - Reads all articles
 * - Detects malformed createdAt timestamps
 * - Fixes them to proper Firestore Timestamp objects
 * - Updates articles back to Firestore
 * 
 * Usage: node scripts/fixArticleTimestamps.js
 * 
 * IMPORTANT: This modifies LIVE DEV PROJECT. Make sure you're using the correct project!
 * Run: firebase use dev
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

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
console.log('FIXING ARTICLE TIMESTAMPS IN DEV FIREBASE PROJECT');
console.log('='.repeat(60));
console.log(`Project ID: ${DEV_PROJECT_ID}`);
console.log('');

/**
 * Checks if a timestamp is a valid Firestore Timestamp.
 * 
 * @param {any} timestamp - The timestamp to check
 * @returns {boolean} True if it's a valid Firestore Timestamp
 */
function isValidFirestoreTimestamp(timestamp) {
  if (!timestamp) return false;
  
  // Check if it's a Firestore Timestamp object (has toDate method)
  if (timestamp && typeof timestamp.toDate === 'function') {
    try {
      const date = timestamp.toDate();
      return !isNaN(date.getTime());
    } catch {
      return false;
    }
  }
  
  // Check if it has _seconds and _nanoseconds (serialized Timestamp)
  if (timestamp._seconds !== undefined && timestamp._nanoseconds !== undefined) {
    try {
      const date = new Date(timestamp._seconds * 1000);
      return !isNaN(date.getTime());
    } catch {
      return false;
    }
  }
  
  return false;
}

/**
 * Converts various timestamp formats to a Firestore Timestamp.
 * 
 * @param {any} timestamp - The timestamp to convert
 * @param {string} pubdate - Article publication date as fallback
 * @returns {admin.firestore.Timestamp} A valid Firestore Timestamp
 */
function normalizeTimestamp(timestamp, pubdate) {
  // If it's already a valid Firestore Timestamp, return it
  if (timestamp && typeof timestamp.toDate === 'function') {
    return admin.firestore.Timestamp.fromDate(timestamp.toDate());
  }
  
  // If it has _seconds and _nanoseconds, convert it
  if (timestamp && timestamp._seconds !== undefined) {
    try {
      return admin.firestore.Timestamp.fromMillis(timestamp._seconds * 1000 + (timestamp._nanoseconds || 0) / 1000000);
    } catch (error) {
      console.warn('  ⚠ Could not convert _seconds/_nanoseconds format:', error.message);
    }
  }
  
  // Try to parse as Date from string/number
  if (timestamp) {
    try {
      const date = new Date(timestamp);
      if (!isNaN(date.getTime())) {
        return admin.firestore.Timestamp.fromDate(date);
      }
    } catch (error) {
      console.warn('  ⚠ Could not parse timestamp as Date:', error.message);
    }
  }
  
  // Fallback: try to parse pubdate
  if (pubdate) {
    try {
      const pubDate = new Date(pubdate);
      if (!isNaN(pubDate.getTime())) {
        console.log('  ℹ Using pubdate as fallback for createdAt');
        return admin.firestore.Timestamp.fromDate(pubDate);
      }
    } catch (error) {
      // Ignore pubdate parsing errors
    }
  }
  
  // Final fallback: use current time
  console.log('  ℹ Using current time as fallback for createdAt');
  return admin.firestore.Timestamp.now();
}

/**
 * Fixes timestamps for all articles in the collection.
 * 
 * @param {string|null} testArticleId - If provided, only fix this one article (for testing)
 * @param {boolean} shouldApply - If true, actually apply the updates (default: false in test mode)
 */
async function fixArticleTimestamps(testArticleId = null, shouldApply = false) {
  if (testArticleId) {
    console.log(`🧪 TEST MODE: Fixing only article: ${testArticleId}\n`);
    const articleRef = db.collection('articles').doc(testArticleId);
    const docSnapshot = await articleRef.get();
    
    if (!docSnapshot.exists) {
      console.error(`❌ Article ${testArticleId} not found!`);
      process.exit(1);
    }
    
    const articleData = docSnapshot.data();
    const createdAt = articleData.createdAt;
    const updatedAt = articleData.updatedAt;
    
    console.log('Current article data:');
    console.log(`  createdAt:`, JSON.stringify(createdAt));
    console.log(`  updatedAt:`, JSON.stringify(updatedAt));
    console.log(`  pubdate:`, articleData.pubdate);
    console.log('');
    
    let needsUpdate = false;
    const updates = {};
    
    // Check and fix createdAt
    if (!isValidFirestoreTimestamp(createdAt)) {
      console.log(`📝 Fixing createdAt...`);
      updates.createdAt = normalizeTimestamp(createdAt, articleData.pubdate);
      console.log(`   New createdAt:`, updates.createdAt.toDate().toISOString());
      needsUpdate = true;
    } else {
      console.log(`✓ createdAt is already valid`);
    }
    
    // Check and fix updatedAt
    if (updatedAt && !isValidFirestoreTimestamp(updatedAt)) {
      console.log(`📝 Fixing updatedAt...`);
      updates.updatedAt = normalizeTimestamp(updatedAt, articleData.pubdate);
      console.log(`   New updatedAt:`, updates.updatedAt.toDate().toISOString());
      needsUpdate = true;
    } else if (updatedAt) {
      console.log(`✓ updatedAt is already valid`);
    }
    
    if (needsUpdate) {
      if (shouldApply) {
        console.log('\n💾 Applying update...');
        try {
          await docSnapshot.ref.update(updates);
          console.log(`✓ Successfully updated article ${testArticleId}`);
        } catch (error) {
          console.error(`❌ Error updating article:`, error.message);
          process.exit(1);
        }
      } else {
        console.log('\n⚠️  DRY RUN MODE: Would update with:', JSON.stringify({
          createdAt: updates.createdAt ? updates.createdAt.toDate().toISOString() : undefined,
          updatedAt: updates.updatedAt ? updates.updatedAt.toDate().toISOString() : undefined
        }, null, 2));
        console.log('\nTo actually apply the fix, run with --apply flag');
        console.log(`Example: npm run fix-timestamps:dev -- --test=${testArticleId} --apply`);
      }
      return;
    } else {
      console.log('\n✓ No fixes needed - timestamps are already valid!');
      return;
    }
  }
  
  console.log('Fetching all articles...');
  const articlesRef = db.collection('articles');
  const snapshot = await articlesRef.get();
  
  console.log(`Found ${snapshot.size} articles\n`);
  
  let fixedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  
  for (const docSnapshot of snapshot.docs) {
    const articleId = docSnapshot.id;
    const articleData = docSnapshot.data();
    const createdAt = articleData.createdAt;
    const updatedAt = articleData.updatedAt;
    
    let needsUpdate = false;
    const updates = {};
    
    // Check and fix createdAt
    if (!isValidFirestoreTimestamp(createdAt)) {
      console.log(`📝 Article ${articleId}: Fixing createdAt`);
      console.log(`   Current createdAt:`, JSON.stringify(createdAt));
      updates.createdAt = normalizeTimestamp(createdAt, articleData.pubdate);
      console.log(`   New createdAt:`, updates.createdAt.toDate().toISOString());
      needsUpdate = true;
    }
    
    // Check and fix updatedAt (optional, but good to fix)
    if (updatedAt && !isValidFirestoreTimestamp(updatedAt)) {
      console.log(`📝 Article ${articleId}: Fixing updatedAt`);
      console.log(`   Current updatedAt:`, JSON.stringify(updatedAt));
      updates.updatedAt = normalizeTimestamp(updatedAt, articleData.pubdate);
      console.log(`   New updatedAt:`, updates.updatedAt.toDate().toISOString());
      needsUpdate = true;
    }
    
    if (needsUpdate) {
      try {
        await docSnapshot.ref.update(updates);
        fixedCount++;
        console.log(`   ✓ Updated article ${articleId}\n`);
      } catch (error) {
        console.error(`   ❌ Error updating article ${articleId}:`, error.message);
        errorCount++;
      }
    } else {
      skippedCount++;
    }
  }
  
  console.log('');
  console.log('='.repeat(60));
  console.log('✓ Timestamp fix completed!');
  console.log(`  Fixed: ${fixedCount} articles`);
  console.log(`  Skipped (already valid): ${skippedCount} articles`);
  console.log(`  Errors: ${errorCount} articles`);
  console.log('='.repeat(60));
}

// Parse command line arguments
const args = process.argv.slice(2);
const testArg = args.find(arg => arg.startsWith('--test='));
const applyArg = args.includes('--apply');
const findBadArg = args.includes('--find-bad');

const testArticleId = testArg ? testArg.split('=')[1] : null;
const shouldApply = applyArg || !testArticleId; // Apply by default unless in test mode without --apply

if (testArticleId && !shouldApply) {
  console.log('🧪 Running in DRY RUN mode (no changes will be made)\n');
}

// Helper function to find articles with bad timestamps
async function findBadTimestamps() {
  console.log('🔍 Scanning articles for malformed timestamps...\n');
  const articlesRef = db.collection('articles');
  const snapshot = await articlesRef.get();
  
  const badArticles = [];
  
  for (const docSnapshot of snapshot.docs) {
    const articleId = docSnapshot.id;
    const articleData = docSnapshot.data();
    const createdAt = articleData.createdAt;
    const updatedAt = articleData.updatedAt;
    
    if (!isValidFirestoreTimestamp(createdAt) || (updatedAt && !isValidFirestoreTimestamp(updatedAt))) {
      badArticles.push({
        id: articleId,
        createdAt: JSON.stringify(createdAt),
        updatedAt: updatedAt ? JSON.stringify(updatedAt) : 'missing',
        pubdate: articleData.pubdate
      });
    }
  }
  
  if (badArticles.length === 0) {
    console.log('✓ No articles with malformed timestamps found!');
  } else {
    console.log(`Found ${badArticles.length} article(s) with malformed timestamps:\n`);
    badArticles.forEach((article, index) => {
      console.log(`${index + 1}. Article ID: ${article.id}`);
      console.log(`   createdAt: ${article.createdAt}`);
      console.log(`   updatedAt: ${article.updatedAt}`);
      console.log(`   pubdate: ${article.pubdate || 'missing'}`);
      console.log(`   Test command: npm run fix-timestamps:dev -- --test=${article.id}\n`);
    });
  }
}

if (findBadArg) {
  findBadTimestamps()
    .then(() => {
      console.log('>>> fixArticleTimestamps.js finished');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Error finding bad timestamps:', error);
      process.exit(1);
    });
  // Don't run the fix function when scanning
} else {
  // Run the fix
  fixArticleTimestamps(testArticleId, shouldApply)
    .then(() => {
      console.log('>>> fixArticleTimestamps.js finished');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Error fixing timestamps:', error);
      process.exit(1);
    });
}
