/**
 * Script to fix malformed timestamp fields in dev Firestore logs collection.
 *
 * Log documents sometimes have timestamp stored as a map { _seconds, _nanoseconds }
 * instead of a native Firestore Timestamp. This script converts those to proper
 * Timestamp values.
 *
 * - Connects to the dev Firebase project (article-experiment-next-dev)
 * - Reads all documents from the logs collection
 * - Detects map-style timestamps and converts to Firestore Timestamp
 * - Updates documents back to Firestore
 *
 * Usage:
 *   node scripts/fixLogTimestamps.js              # dry run (no writes)
 *   node scripts/fixLogTimestamps.js --apply      # apply fixes
 *   node scripts/fixLogTimestamps.js --limit=10   # process only 10 docs (for testing)
 *   node scripts/fixLogTimestamps.js --find-bad   # only list docs with bad timestamps
 *
 * IMPORTANT: This modifies the LIVE DEV PROJECT. Ensure you're using the correct project.
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const DEV_PROJECT_ID = 'article-experiment-next-dev';

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

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: DEV_PROJECT_ID,
});

const db = admin.firestore();

console.log('='.repeat(60));
console.log('FIXING LOG TIMESTAMPS IN DEV FIREBASE PROJECT');
console.log('='.repeat(60));
console.log(`Project ID: ${DEV_PROJECT_ID}`);
console.log('');

/**
 * Returns true if the value is a valid Firestore Timestamp (native or serialized map).
 *
 * @param {unknown} timestamp - The timestamp field to check
 * @returns {boolean}
 */
function isValidFirestoreTimestamp(timestamp) {
  if (!timestamp) return false;

  if (typeof timestamp.toDate === 'function') {
    try {
      const date = timestamp.toDate();
      return !isNaN(date.getTime());
    } catch {
      return false;
    }
  }

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
 * Returns true if the value is a map-style timestamp (needs conversion).
 *
 * @param {unknown} timestamp - The timestamp field to check
 * @returns {boolean}
 */
function isMapTimestamp(timestamp) {
  return (
    timestamp &&
    typeof timestamp === 'object' &&
    timestamp._seconds !== undefined &&
    typeof timestamp._seconds === 'number'
  );
}

/**
 * Converts a map-style or other timestamp to a Firestore Timestamp.
 *
 * @param {unknown} timestamp - The value to convert
 * @returns {admin.firestore.Timestamp}
 */
function normalizeTimestamp(timestamp) {
  if (timestamp && typeof timestamp.toDate === 'function') {
    return admin.firestore.Timestamp.fromDate(timestamp.toDate());
  }

  if (isMapTimestamp(timestamp)) {
    const ns = timestamp._nanoseconds ?? 0;
    return new admin.firestore.Timestamp(timestamp._seconds, ns);
  }

  if (timestamp && (typeof timestamp === 'string' || typeof timestamp === 'number')) {
    const date = new Date(timestamp);
    if (!isNaN(date.getTime())) {
      return admin.firestore.Timestamp.fromDate(date);
    }
  }

  console.warn('  ⚠ No valid timestamp; using now() as fallback');
  return admin.firestore.Timestamp.now();
}

/**
 * Fixes timestamp field for all documents in the logs collection.
 *
 * @param {{ apply: boolean, limit?: number }} options - apply: write changes; limit: max docs to process
 */
async function fixLogTimestamps(options) {
  const { apply, limit } = options;
  const logsRef = db.collection('logs');
  const snapshot =
    limit != null && limit > 0
      ? await logsRef.limit(limit).get()
      : await logsRef.get();
  console.log(`Found ${snapshot.size} log document(s)\n`);

  let fixedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const docSnapshot of snapshot.docs) {
    const id = docSnapshot.id;
    const data = docSnapshot.data();
    const timestamp = data.timestamp;

    if (!timestamp) {
      skippedCount++;
      continue;
    }

    if (!isMapTimestamp(timestamp)) {
      skippedCount++;
      continue;
    }

    const normalized = normalizeTimestamp(timestamp);

    if (apply) {
      try {
        await docSnapshot.ref.update({ timestamp: normalized });
        fixedCount++;
        console.log(`  ✓ ${id} → ${normalized.toDate().toISOString()}`);
      } catch (err) {
        errorCount++;
        console.error(`  ❌ ${id}: ${err.message}`);
      }
    } else {
      fixedCount++;
      console.log(`  [dry run] ${id} → would set ${normalized.toDate().toISOString()}`);
    }
  }

  console.log('');
  console.log('='.repeat(60));
  console.log(apply ? 'Timestamp fix completed' : 'Dry run completed (no changes written)');
  console.log(`  Would fix / fixed: ${fixedCount}`);
  console.log(`  Skipped (valid or missing): ${skippedCount}`);
  console.log(`  Errors: ${errorCount}`);
  console.log('='.repeat(60));
}

/**
 * Lists log document IDs that have map-style timestamps.
 */
async function findBadTimestamps() {
  const snapshot = await db.collection('logs').get();
  const bad = [];

  for (const docSnapshot of snapshot.docs) {
    const ts = docSnapshot.get('timestamp');
    if (ts && isMapTimestamp(ts)) {
      bad.push({ id: docSnapshot.id, timestamp: ts });
    }
  }

  console.log(`Documents with map-style timestamp: ${bad.length}\n`);
  bad.slice(0, 20).forEach(({ id, timestamp }) => {
    console.log(`  ${id}  _seconds: ${timestamp._seconds}, _nanoseconds: ${timestamp._nanoseconds}`);
  });
  if (bad.length > 20) {
    console.log(`  ... and ${bad.length - 20} more`);
  }
}

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const limitArg = args.find((a) => a.startsWith('--limit='));
const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : undefined;
const findBad = args.includes('--find-bad');

if (!apply) {
  console.log('DRY RUN (no writes). Use --apply to update documents.\n');
}

if (findBad) {
  findBadTimestamps()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
} else {
  fixLogTimestamps({ apply, limit })
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
