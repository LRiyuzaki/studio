'use client';

import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updatePassword, deleteUser } from 'firebase/auth';

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

export const updateUserPassword = async (newPassword: string) => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
        await updatePassword(user, newPassword);
    } else {
        throw new Error("No user is currently signed in.");
    }
};

export const deleteUserAccount = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
        await deleteUser(user);
    } else {
        throw new Error("No user is currently signed in.");
    }
};
