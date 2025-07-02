import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Describes the structure of a log entry stored in Firestore.
 * Each log records what happened, where, who did it, and when.
 */
export interface LogEntry {
  /** The URL where the event happened */
  url: string;
  /** A unique identifier for the context (e.g., article ID) */
  identifier: string;
  /** The user's ID, or 'anonymous' if not logged in */
  userId: string;
  /** The user's public IP address, if available */
  ipAddress?: string;
  /** The type of action (e.g., 'Page View', 'Click', 'Comment') */
  action: string;
  /** A label describing the event in more detail */
  label: string;
  /** Any extra comments or details about the event */
  details: string;
  /** The time the event was logged (set automatically) */
  timestamp: Date;
}

/**
 * Logs an event to the Firestore 'logs' collection.
 * 
 * @param entry - The event details to log (everything except timestamp).
 * @returns A promise that resolves when the log is saved.
 * 
 * This function:
 * - Adds a server-generated timestamp to the log entry.
 * - Saves the log entry as a new document in Firestore.
 * - Prints debug info to the console.
 */
export async function logEvent(entry: Omit<LogEntry, 'timestamp'>) {
  try {
    // console.log('Attempting to log event:', entry);
    const logsCollection = collection(db, 'logs');
    const docRef = await addDoc(logsCollection, {
      ...entry,
      timestamp: serverTimestamp(),
    });
    // console.log('Successfully logged event with ID:', docRef.id);
  } catch (error) {
    console.error('Error logging event:', error);
  }
}

/**
 * Gets the client's public IP address using an external service.
 * 
 * @returns The IP address as a string, or 'unknown' if it can't be determined.
 * 
 * This function:
 * - Makes a request to 'https://api.ipify.org?format=json'.
 * - Returns the IP address from the response.
 * - Prints the IP to the console for debugging.
 */
export async function getClientIP(): Promise<string> {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    // console.log('Retrieved client IP:', data.ip);
    return data.ip;
  } catch (error) {
    console.error('Error getting IP address:', error);
    return 'unknown';
  }
}
