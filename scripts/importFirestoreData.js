console.log('[import] importFirestoreData.js started');
console.log('[import] CWD:', process.cwd());
console.log('Running importFirestoreData.js...');
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

const articlesPath = path.resolve(__dirname, '../firestore-data/articles.json');
const authorsPath = path.resolve(__dirname, '../firestore-data/authors.json');

async function importCollection(collectionPath, inputPath) {
  const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  
  for (const [docId, docData] of Object.entries(data)) {
    console.log(`Importing doc ${docId}...`);
    await db.collection(collectionPath).doc(docId).set(docData);
  }
  
  console.log(`Imported ${collectionPath} from ${inputPath}`);
}

async function importAllData() {
  // Import articles
  await importCollection('articles', articlesPath);
  
  // Import authors
  await importCollection('authors', authorsPath);
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