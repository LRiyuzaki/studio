'use client';

import React, { createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged, getRedirectResult, updateProfile } from 'firebase/auth';

interface FirebaseContextState {
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  user: User | null;
  isUserLoading: boolean;
}

const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

// Helper function to create a user document if it doesn't exist
const createUserDocument = async (firestore: Firestore, user: User) => {
  const userDocRef = doc(firestore, 'users', user.uid);
  const userDoc = await getDoc(userDocRef);
  if (!userDoc.exists()) {
    await setDoc(userDocRef, {
      displayName: user.displayName,
      email: user.email,
      createdAt: new Date().toISOString(),
    });
  }
};


export const FirebaseProvider: React.FC<{ children: ReactNode; firebaseApp: FirebaseApp; firestore: Firestore; auth: Auth; }> = ({
  children,
  firebaseApp,
  firestore,
  auth,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);

  useEffect(() => {
    // This listener is the single source of truth for the user's auth state.
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in. Create their document if it doesn't exist.
        await createUserDocument(firestore, firebaseUser);
      }
      setUser(firebaseUser);
      setIsUserLoading(false);
    });

    // Handle the redirect result from Google Sign-In.
    // This is separate from onAuthStateChanged and runs once on page load after a redirect.
    getRedirectResult(auth)
      .then(async (result) => {
        if (result && result.user) {
          // The user has just signed in via redirect.
          // The onAuthStateChanged listener above will handle the user state and doc creation.
        }
      }).catch((error) => {
        // Handle Errors here, like if the user closes the sign-in window.
        console.error("Error during Google sign-in redirect:", error);
      });

    return () => unsubscribe();
  }, [auth, firestore]);

  const value = useMemo(() => ({
    firebaseApp,
    firestore,
    auth,
    user,
    isUserLoading,
  }), [firebaseApp, firestore, auth, user, isUserLoading]);

  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  );
};

// Simplified hook to access all services and user state
export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }
  if (!context.auth || !context.firestore) {
    throw new Error('Firebase services not available. Check provider setup.');
  }
  return context as Required<FirebaseContextState>;
};

// Specific hook for user state
export const useUser = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a FirebaseProvider.');
  }
  return { user: context.user, isUserLoading: context.isUserLoading };
};
