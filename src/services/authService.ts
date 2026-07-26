import {
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    sendPasswordResetEmail,
    signInWithCredential,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

import { auth, db } from './firebase';

export async function registerUser(email: string, password: string, name?: string) {
  const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
  await updateProfile(result.user, { displayName: name?.trim() || null });

  await setDoc(doc(db, 'users', result.user.uid), {
    uid: result.user.uid,
    email: result.user.email,
    name: name?.trim() || '',
    createdAt: new Date().toISOString(),
  });

  return result.user;
}

export async function loginUser(email: string, password: string) {
  const result = await signInWithEmailAndPassword(auth, email.trim(), password);
  return result.user;
}

export async function requestPasswordReset(email: string) {
  const normalizedEmail = email.trim();
  if (!normalizedEmail) {
    throw new Error('Enter your email address first.');
  }
  await sendPasswordResetEmail(auth, normalizedEmail);
}

export async function loginWithGoogleIdToken(idToken: string) {
  const credential = GoogleAuthProvider.credential(idToken);
  const result = await signInWithCredential(auth, credential);

  const userRef = doc(db, 'users', result.user.uid);
  const existingProfile = await getDoc(userRef);
  const now = new Date().toISOString();

  await setDoc(
    userRef,
    {
      uid: result.user.uid,
      email: result.user.email,
      name: result.user.displayName ?? '',
      photoURL: result.user.photoURL ?? '',
      provider: 'google',
      lastLoginAt: now,
      ...(!existingProfile.exists() ? { createdAt: now } : {}),
    },
    { merge: true }
  );

  return result.user;
}

export async function logoutUser() {
  try {
    const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
    await GoogleSignin.signOut();
  } catch {
    // Email/password users and environments without the native module do not
    // have a Google session to clear.
  }
  await signOut(auth);
}
