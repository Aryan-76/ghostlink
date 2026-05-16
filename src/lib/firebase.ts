import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import aiStudioConfig from '../../firebase-applet-config.json';

// Production first: use env vars, fallback to AI Studio local config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || aiStudioConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || aiStudioConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || aiStudioConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || aiStudioConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || aiStudioConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || aiStudioConfig.appId,
};

const databaseId = import.meta.env.VITE_FIREBASE_DATABASE_ID || aiStudioConfig.firestoreDatabaseId;

// Diagnostic Check
if (!firebaseConfig.apiKey) {
  if (import.meta.env.PROD) {
    console.error("FIREBASE CRITICAL ERROR: VITE_FIREBASE_API_KEY is missing from environment variables.");
  } else {
    console.warn("FIREBASE WARNING: Using fallback local configuration since environment variables are not defined.");
  }
} else {
  console.log(`[Firebase Diagnostic] Initializing with Project ID: ${firebaseConfig.projectId}`);
  if (import.meta.env.VITE_FIREBASE_API_KEY) {
    console.log("[Firebase Diagnostic] Using environment variables for configuration.");
  } else {
    console.log("[Firebase Diagnostic] Using local firebase-applet-config.json for configuration.");
  }
}

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, databaseId);
export const auth = getAuth();

// Validate connection
async function testConnection() {
  try {
    console.log("[Firebase Diagnostic] Testing Firestore connection...");
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("[Firebase Diagnostic] Firestore connection probe completed.");
  } catch (error: any) {
    const message = error?.message || "";
    if(message.includes('the client is offline')) {
      console.error("FIREBASE OFFLINE: The client cannot reach the internet or Firebase servers.");
    } else if (message.includes('permission') || message.includes('insufficient')) {
      console.log("[Firebase Diagnostic] Connection reachable, but permission was denied (expected).");
    } else {
      console.error(`[Firebase Diagnostic] Connection Probe failed with error: ${error.code || 'unknown'}. Message: ${message}`);
      console.warn("ACTION REQUIRED: Ensure Firestore is enabled in your Firebase Console for project 'record-b02ff'.");
    }
  }
}
testConnection();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
