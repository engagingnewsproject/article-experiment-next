/**
 * Script to delete logs from Firestore by IP address
 * 
 * Usage: node scripts/deleteLogsByIP.js <IP_ADDRESS>
 * Example: node scripts/deleteLogsByIP.js 76.175.68.20
 * 
 * This script will:
 * 1. Query all logs matching the specified IP address
 * 2. Show a preview of what will be deleted
 * 3. Ask for confirmation before deleting
 * 4. Delete the matching logs
 */

const admin = require('firebase-admin');
const readline = require('readline');

// Initialize Firebase Admin
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Get IP address from command line arguments
const ipAddress = process.argv[2];

if (!ipAddress) {
  console.error('Error: IP address is required');
  console.log('Usage: node scripts/deleteLogsByIP.js <IP_ADDRESS>');
  console.log('Example: node scripts/deleteLogsByIP.js 76.175.68.20');
  process.exit(1);
}

async function deleteLogsByIP() {
  try {
    console.log(`\n🔍 Searching for logs with IP address: ${ipAddress}...\n`);
    
    // Query logs by IP address
    const logsRef = db.collection('logs');
    const snapshot = await logsRef.where('ipAddress', '==', ipAddress).get();
    
    if (snapshot.empty) {
      console.log(`✅ No logs found with IP address: ${ipAddress}`);
      process.exit(0);
    }
    
    const logs = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      logs.push({
        id: doc.id,
        timestamp: data.timestamp?.toDate ? data.timestamp.toDate().toISOString() : data.timestamp,
        action: data.action,
        articleTitle: data.articleTitle || 'N/A',
        userId: data.userId,
        qualtricsResponseId: data.qualtricsResponseId || 'N/A'
      });
    });
    
    console.log(`📊 Found ${logs.length} log(s) with IP address: ${ipAddress}\n`);
    console.log('Preview of logs to be deleted:');
    console.log('─'.repeat(100));
    logs.slice(0, 10).forEach((log, index) => {
      console.log(`${index + 1}. [${log.timestamp}] ${log.action} - ${log.articleTitle}`);
      console.log(`   User: ${log.userId} | QT: ${log.qualtricsResponseId}`);
    });
    
    if (logs.length > 10) {
      console.log(`   ... and ${logs.length - 10} more`);
    }
    console.log('─'.repeat(100));
    
    // Ask for confirmation
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const answer = await new Promise(resolve => {
      rl.question(`\n⚠️  Are you sure you want to delete ${logs.length} log(s)? (yes/no): `, resolve);
    });
    
    rl.close();
    
    if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
      console.log('❌ Deletion cancelled.');
      process.exit(0);
    }
    
    // Delete logs in batches
    console.log('\n🗑️  Deleting logs...');
    const batchSize = 500; // Firestore batch limit
    const batches = [];
    
    for (let i = 0; i < logs.length; i += batchSize) {
      const batch = db.batch();
      const batchLogs = logs.slice(i, i + batchSize);
      
      batchLogs.forEach(log => {
        const docRef = logsRef.doc(log.id);
        batch.delete(docRef);
      });
      
      batches.push(batch);
    }
    
    // Execute batches
    for (let i = 0; i < batches.length; i++) {
      await batches[i].commit();
      console.log(`   Deleted batch ${i + 1}/${batches.length} (${Math.min(batchSize, logs.length - i * batchSize)} documents)`);
    }
    
    console.log(`\n✅ Successfully deleted ${logs.length} log(s) with IP address: ${ipAddress}`);
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error deleting logs:', error);
    process.exit(1);
  }
}

// Run the script
deleteLogsByIP();

