/**
 * Script to switch between dev and production Firebase project configurations.
 * 
 * Usage:
 *   node scripts/switchEnv.js dev    - Switch to dev project
 *   node scripts/switchEnv.js prod   - Switch to production project
 */

const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const envLocalPath = path.join(projectRoot, '.env.local');
const envDevPath = path.join(projectRoot, '.env.dev');
const envProdPath = path.join(projectRoot, '.env.prod');

const target = process.argv[2];

if (!target || !['dev', 'prod'].includes(target)) {
  console.error('❌ Usage: node scripts/switchEnv.js [dev|prod]');
  console.error('');
  console.error('Examples:');
  console.error('  node scripts/switchEnv.js dev   - Switch to dev project (article-experiment-next-dev)');
  console.error('  node scripts/switchEnv.js prod  - Switch to production project (article-experiment-next)');
  process.exit(1);
}

const sourceFile = target === 'dev' ? envDevPath : envProdPath;
const projectName = target === 'dev' ? 'article-experiment-next-dev' : 'article-experiment-next';

// Check if source file exists
if (!fs.existsSync(sourceFile)) {
  console.error(`❌ Source file not found: ${sourceFile}`);
  console.error('');
  console.error(`Please create ${path.basename(sourceFile)} with your ${target} Firebase configuration.`);
  console.error('You can copy your current .env.local and update the project ID.');
  process.exit(1);
}

// Read source file
const sourceContent = fs.readFileSync(sourceFile, 'utf8');

// Write to .env.local
fs.writeFileSync(envLocalPath, sourceContent, 'utf8');

console.log(`✅ Switched to ${target} Firebase project: ${projectName}`);
console.log(`   Updated: .env.local`);
console.log('');
console.log('⚠️  Note: Restart your dev server (npm run dev) for changes to take effect.');
