'use client';

import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

export const signUpWithEmail = async (email: string, password: string) => {
  const auth = getAuth();
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  // Signed up 
  const user = userCredential.user;
  return user;
};

export const signInWithEmail = async (email: string, password: string) => {
  const auth = getAuth();
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  // Signed in 
  const user = userCredential.user;
  return user;
};