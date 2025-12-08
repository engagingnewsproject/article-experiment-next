/**
 * Firebase initialization and configuration module.
 * 
 * This module:
 * - Initializes the Firebase application
 * - Configures Firebase services
 * - Sets up Firestore database connection
 * - Manages environment variables for Firebase configuration
 * 
 * @module firebase
 */

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

/**
 * Firebase configuration object.
 * 
 * This object:
 * - Contains all necessary Firebase configuration parameters
 * - Uses environment variables for sensitive information
 * - Provides connection details for Firebase services
 * 
 * @type {Object}
 * @property {string} apiKey - Firebase API key
 * @property {string} authDomain - Firebase authentication domain
 * @property {string} projectId - Firebase project ID
 * @property {string} storageBucket - Firebase storage bucket
 * @property {string} messagingSenderId - Firebase messaging sender ID
 * @property {string} appId - Firebase application ID
 */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/**
 * Initializes Firebase application.
 * 
 * This initialization:
 * - Checks for existing Firebase instances
 * - Creates new instance if none exists
 * - Prevents multiple initializations
 * 
 * @type {FirebaseApp}
 */
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

/**
 * Firestore database instance.
 * 
 * This instance:
 * - Provides access to Firestore database
 * - Enables database operations
 * - Maintains single connection
 * 
 * @type {Firestore}
 */
export const db = getFirestore(app);

// Connect to emulator in development
// CRITICAL: This must happen BEFORE any Firestore operations
// In Next.js, check both NODE_ENV and hostname to detect development
const isDevelopmentEnv = process.env.NODE_ENV === 'development';
const isLocalhost = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const isDevelopment = isDevelopmentEnv || isLocalhost;
const useLiveFirestore = process.env.NEXT_PUBLIC_USE_LIVE_FIRESTORE === 'true';
const shouldUseEmulator = isDevelopment && !useLiveFirestore;

// Debug logging in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('[Firebase Config]', {
    NODE_ENV: process.env.NODE_ENV,
    isDevelopmentEnv,
    isLocalhost,
    isDevelopment,
    NEXT_PUBLIC_USE_LIVE_FIRESTORE: process.env.NEXT_PUBLIC_USE_LIVE_FIRESTORE,
    useLiveFirestore,
    shouldUseEmulator,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
}

// Use a global flag to prevent multiple connection attempts (works across hot reloads)
const globalKey = '__firestoreEmulatorConnected';
const windowKey = '__firestoreEmulatorConnected';

// Check if already connected (server-side)
const isConnectedServer = typeof global !== 'undefined' && (global as any)[globalKey];
// Check if already connected (client-side)
const isConnectedClient = typeof window !== 'undefined' && (window as any)[windowKey];
const isAlreadyConnected = isConnectedServer || isConnectedClient;

// Log when using live Firestore (not emulator)
if (!shouldUseEmulator && typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('✅ Using LIVE Firestore (not emulator)');
  console.log(`   Project: ${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'unknown'}`);
}

// Connect to emulator - must happen on both server and client in Next.js
if (shouldUseEmulator && !isAlreadyConnected) {
  try {
    // CRITICAL: connectFirestoreEmulator must be called immediately after getFirestore
    // and before any database operations
    connectFirestoreEmulator(db, 'localhost', 8080);
    
    // Mark as connected on both server and client
    if (typeof global !== 'undefined') {
      (global as any)[globalKey] = true;
    }
    if (typeof window !== 'undefined') {
      (window as any)[windowKey] = true;
    }
    
    // Log connection status (only in browser to avoid duplicate logs)
    if (typeof window !== 'undefined') {
      console.log('✅ Connected to Firestore emulator at localhost:8080');
    }
  } catch (error) {
    // Ignore if already connected (can happen with Next.js SSR/hot reload)
    const errorMessage = (error as Error).message || '';
    if (errorMessage.includes('already been called') || errorMessage.includes('already connected')) {
      // Mark as connected even if error says already connected
      if (typeof global !== 'undefined') {
        (global as any)[globalKey] = true;
      }
      if (typeof window !== 'undefined') {
        (window as any)[windowKey] = true;
      }
      if (typeof window !== 'undefined') {
        console.log('✅ Firestore emulator already connected (from previous load)');
      }
    } else {
      // Log actual errors
      console.error('❌ Failed to connect to Firestore emulator:', error);
      console.error('   Make sure the emulator is running on localhost:8080');
      console.error('   Check: npm run emulator');
    }
  }
} 