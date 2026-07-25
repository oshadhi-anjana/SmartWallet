import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId:
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const requiredFirebaseValues = [
  firebaseConfig.apiKey,
  firebaseConfig.authDomain,
  firebaseConfig.projectId,
  firebaseConfig.storageBucket,
  firebaseConfig.messagingSenderId,
  firebaseConfig.appId,
];

if (requiredFirebaseValues.some((value) => !value)) {
  throw new Error(
    'Firebase configuration is incomplete. Check the EXPO_PUBLIC_FIREBASE variables in the .env file.'
  );
}

// Prevent Firebase from being initialized more than once during development.
const firebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const firebaseAuth = getAuth(firebaseApp);
const firestoreDatabase = getFirestore(firebaseApp);

export {
  firebaseApp,
  firebaseAuth,
  firestoreDatabase,
};