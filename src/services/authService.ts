import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

import { auth, db } from './firebase';

export async function registerUser(email: string, password: string, name?: string) {
  const result = await createUserWithEmailAndPassword(auth, email.trim(), password);

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

export async function logoutUser() {
  await signOut(auth);
}
