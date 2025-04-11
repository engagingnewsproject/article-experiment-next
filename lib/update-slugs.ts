import { config } from 'dotenv';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc } from 'firebase/firestore';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables from .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(process.cwd(), '.env.local');
console.log('Loading environment variables from:', envPath);
config({ path: envPath });

// Validate required environment variables
const requiredEnvVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.error('Missing required environment variables:', missingVars);
  process.exit(1);
}

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

console.log('Initializing Firebase with config:', {
  ...firebaseConfig,
  apiKey: '***' // Don't log the actual API key
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Function to generate a slug from a title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric characters with hyphens
    .replace(/(^-|-$)/g, ''); // Remove leading/trailing hyphens
}

async function updateSlugs() {
  try {
    console.log('Fetching articles...');
    const articlesRef = collection(db, 'articles');
    console.log('Collection path:', articlesRef.path);
    
    const snapshot = await getDocs(articlesRef);
    console.log('Snapshot size:', snapshot.size);
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      console.log('Processing document:', doc.id);
      console.log('Document data:', data);
      
      const title = data.title;
      
      if (!title) {
        console.log(`Skipping document ${doc.id} - no title found`);
        skippedCount++;
        continue;
      }
      
      const slug = generateSlug(title);
      
      if (data.slug === slug) {
        console.log(`Skipping document ${doc.id} - slug already correct`);
        skippedCount++;
        continue;
      }
      
      console.log(`Updating document ${doc.id}:`);
      console.log(`  Title: ${title}`);
      console.log(`  Old slug: ${data.slug || 'none'}`);
      console.log(`  New slug: ${slug}`);
      
      await updateDoc(doc.ref, { slug });
      updatedCount++;
    }
    
    console.log('\nUpdate complete!');
    console.log(`Updated: ${updatedCount}`);
    console.log(`Skipped: ${skippedCount}`);
    console.log(`Total: ${snapshot.size}`);
    
  } catch (error) {
    console.error('Error updating slugs:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    process.exit(1);
  }
}

updateSlugs(); 