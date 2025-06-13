const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function exportCollection(collectionPath, outputPath) {
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
  console.log(`Exported ${collectionPath} to ${outputPath}`);
}

async function exportAllData() {
  // Export articles
  await exportCollection('articles', './firestore-data/articles.json');
  
  // Export authors
  await exportCollection('authors', './firestore-data/authors.json');
}

exportAllData()
  .then(() => {
    console.log('Export completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error exporting data:', error);
    process.exit(1);
  }); 