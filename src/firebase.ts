import { initializeApp, FirebaseOptions } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer } from 'firebase/firestore';

// Map environment variables (standard for Vite/Vercel)
const config: FirebaseOptions = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Database ID logic with robust fallback
const rawDbId = import.meta.env.VITE_FIREBASE_FIRESTORE_DB_ID || 
                import.meta.env.VITE_FIREBASE_DATABASE_ID || 
                '(default)';

const dbId = (!rawDbId || rawDbId === '(default)') ? undefined : rawDbId;

// Initialize with safety check to prevent crash if config is partially missing
if (!config.apiKey || !config.projectId) {
  console.error('Firebase Configuration is incomplete. Check environment variables.');
}

const app = initializeApp(config);
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, dbId);

export const auth = getAuth(app);

// Test connection
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();
