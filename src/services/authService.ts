import {
    createUserWithEmailAndPassword,
    fetchSignInMethodsForEmail,
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
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    throw new Error('Enter your email address first.');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error('Enter a valid email address.');
  }

  const methods = await fetchSignInMethodsForEmail(auth, normalizedEmail);
  if (methods.includes('google.com') && !methods.includes('password')) {
    throw new Error('This account uses Google Sign-In. Continue with Google instead of resetting a password.');
  }

  try {
    await sendPasswordResetEmail(auth, normalizedEmail);
  } catch (error: unknown) {
    const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
    if (code.includes('too-many-requests')) {
      throw new Error('Too many reset attempts. Wait a few minutes and try again.');
    }
    if (code.includes('operation-not-allowed')) {
      throw new Error('Password reset is not enabled in Firebase Authentication.');
    }
    if (code.includes('network-request-failed')) {
      throw new Error('Check your internet connection and try again.');
    }
    throw new Error('The password reset email could not be sent. Please try again.');
  }
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
