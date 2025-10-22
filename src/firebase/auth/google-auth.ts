'use client';

import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';
import { toast } from '@/hooks/use-toast';

const provider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  const auth = getAuth();
  try {
    const result = await signInWithPopup(auth, provider);
    // This gives you a Google Access Token. You can use it to access the Google API.
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;
    // The signed-in user info.
    const user = result.user;
  } catch (error: any) {
    // Handle Errors here.
    toast({
      variant: "destructive",
      title: "Google Sign-In Failed",
      description: error.message,
    });
  }
};

export const signOut = async () => {
    const auth = getAuth();
    try {
        await firebaseSignOut(auth);
    } catch (error: any) {
        console.error('Error signing out:', error);
        toast({
          variant: "destructive",
          title: "Sign Out Failed",
          description: error.message,
        });
    }
};