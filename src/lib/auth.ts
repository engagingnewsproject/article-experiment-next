/**
 * Firebase Authentication module for research dashboard.
 * 
 * This module:
 * - Provides Firebase Authentication integration
 * - Manages user authentication state
 * - Handles session management
 * 
 * Access control is managed entirely through Firebase Authentication.
 * Only users with valid Firebase Auth accounts can access the dashboard.
 * 
 * @module auth
 */

import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  User,
  onAuthStateChanged,
  UserCredential
} from 'firebase/auth';
import { auth } from './firebase';

/**
 * Authentication session interface.
 */
export interface AuthSession {
  isAuthenticated: boolean;
  email: string;
  timestamp: number;
  uid?: string;
}

/**
 * Signs in a user with email and password using Firebase Authentication.
 * 
 * @param email - User's email address
 * @param password - User's password
 * @returns Promise that resolves to UserCredential on success
 * @throws Error if credentials are invalid
 */
export async function signIn(email: string, password: string): Promise<UserCredential> {
  try {
    // Sign in with Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential;
  } catch (error: unknown) {
    // Re-throw with more user-friendly message
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    // Handle common Firebase Auth errors
    if (errorMessage.includes('auth/user-not-found') || errorMessage.includes('auth/wrong-password')) {
      throw new Error('Invalid email or password.');
    } else if (errorMessage.includes('auth/invalid-email')) {
      throw new Error('Invalid email address.');
    } else if (errorMessage.includes('auth/too-many-requests')) {
      throw new Error('Too many failed attempts. Please try again later.');
    }
    
    throw error;
  }
}

/**
 * Signs out the current user.
 * 
 * @returns Promise that resolves when sign out is complete
 */
export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

/**
 * Gets the current authenticated user.
 * 
 * @returns The current User object, or null if not authenticated
 */
export function getCurrentUser(): User | null {
  return auth.currentUser;
}

/**
 * Creates an AuthSession object from a Firebase User.
 * 
 * @param user - Firebase User object
 * @returns AuthSession object
 */
export function createSessionFromUser(user: User): AuthSession {
  if (!user.email) {
    throw new Error('User does not have an email address');
  }
  
  return {
    isAuthenticated: true,
    email: user.email.toLowerCase(),
    uid: user.uid,
    timestamp: Date.now()
  };
}

/**
 * Gets the current authentication session.
 * This checks Firebase Auth state synchronously.
 * 
 * @returns AuthSession object if authenticated, null otherwise
 */
export function getCurrentSession(): AuthSession | null {
  const user = getCurrentUser();
  if (!user || !user.email) {
    return null;
  }
  
  return createSessionFromUser(user);
}

/**
 * Subscribes to authentication state changes.
 * 
 * @param callback - Function called when auth state changes
 * @returns Unsubscribe function
 */
export function onAuthChange(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

// Legacy functions for backward compatibility
// These maintain the same interface as the old password-based auth

/**
 * Clears the current authentication session by signing out.
 * 
 * @deprecated Use signOut() instead. This is kept for backward compatibility.
 */
export async function clearSession(): Promise<void> {
  await signOut();
} 