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
if (process.env.NODE_ENV === 'development') {
  connectFirestoreEmulator(db, 'localhost', 8080);
} 