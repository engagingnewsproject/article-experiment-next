/**
 * Helper script to set up .env.dev and .env.prod files from existing .env.local
 * 
 * This script:
 * 1. Reads your current .env.local (assumed to be production)
 * 2. Creates .env.prod with production config
 * 3. Creates .env.dev with dev project ID (article-experiment-next-dev)
 * 
 * Usage: node scripts/setupEnvFiles.js
 */

const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const envLocalPath = path.join(projectRoot, '.env.local');
const envDevPath = path.join(projectRoot, '.env.dev');
const envProdPath = path.join(projectRoot, '.env.prod');

// Check if .env.local exists
if (!fs.existsSync(envLocalPath)) {
  console.error('❌ .env.local not found');
  console.error('   Please create .env.local first with your Firebase configuration.');
  process.exit(1);
}

// Read current .env.local
const envLocalContent = fs.readFileSync(envLocalPath, 'utf8');

// Create .env.prod (copy of current .env.local)
fs.writeFileSync(envProdPath, envLocalContent, 'utf8');
console.log('✅ Created .env.prod (copied from .env.local)');

// Create .env.dev (replace project ID with dev project)
let envDevContent = envLocalContent;
// Replace project ID
envDevContent = envDevContent.replace(
  /NEXT_PUBLIC_FIREBASE_PROJECT_ID=.*/g,
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID=article-experiment-next-dev'
);
// Replace auth domain (if it contains the project ID)
envDevContent = envDevContent.replace(
  /NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=.*article-experiment-next\.firebaseapp\.com/g,
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=article-experiment-next-dev.firebaseapp.com'
);
// Replace storage bucket (if it contains the project ID)
envDevContent = envDevContent.replace(
  /NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=.*article-experiment-next\.appspot\.com/g,
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=article-experiment-next-dev.appspot.com'
);

fs.writeFileSync(envDevPath, envDevContent, 'utf8');
console.log('✅ Created .env.dev (updated project ID to article-experiment-next-dev)');
console.log('');
console.log('⚠️  IMPORTANT: Please verify .env.dev has the correct Firebase config values');
console.log('   for the dev project. Some values (API keys, etc.) may need manual updates.');
console.log('');
console.log('Next steps:');
console.log('  1. Review .env.dev and .env.prod with the correct Firebase config for each project');
console.log('  2. Use npm run dev (loads .env.dev) or npm run dev:prod (loads .env.prod)');
