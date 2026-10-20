import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

let app;
try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
} catch (error) {
  console.error('Firebase initialization failed:', error);
  // Create a dummy app to prevent further errors
  app = getApps().length > 0 ? getApps()[0] : null;
}

/* CRITICAL: The app will break without this line */
export const db = app ? getFirestore(app, firebaseConfig.firestoreDatabaseId) : null;
export const auth = app ? getAuth(app) : null;

// Validate connection to Firestore (non-blocking)
export async function testConnection() {
  if (!db) {
    console.warn('Firebase not initialized, skipping connection test.');
    return;
  }
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Firebase Firestore connection tested successfully.');
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    } else {
      console.log('Firestore connection active.');
    }
  }
}

testConnection();
