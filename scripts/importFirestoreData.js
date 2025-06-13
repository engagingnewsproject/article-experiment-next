process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'article-experiment-next',
});

const db = admin.firestore();

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
  await importCollection('articles', './firestore-data/articles.json');
  
  // Import authors
  await importCollection('authors', './firestore-data/authors.json');
}

importAllData()
  .then(() => {
    console.log('Import completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error importing data:', error);
    process.exit(1);
  }); 