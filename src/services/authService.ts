import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
} from 'firebase/auth';

import { auth } from './firebase';

export async function registerUser(email: string, password: string) {
  const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
  return result.user;
}

export async function loginUser(email: string, password: string) {
  const result = await signInWithEmailAndPassword(auth, email.trim(), password);
  return result.user;
}

export async function logoutUser() {
  await signOut(auth);
}
