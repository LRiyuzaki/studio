'use client';

import React, { createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged, getRedirectResult, GoogleAuthProvider } from 'firebase/auth';

interface FirebaseContextState {
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  user: User | null;
  isUserLoading: boolean;
}

const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

export const FirebaseProvider: React.FC<{ children: ReactNode; firebaseApp: FirebaseApp; firestore: Firestore; auth: Auth; }> = ({
  children,
  firebaseApp,
  firestore,
  auth,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setIsUserLoading(false);
    });

    // Handle the redirect result from Google Sign-In
    getRedirectResult(auth)
      .then(async (result) => {
        if (result && result.user) {
          // This is the signed-in user
          const user = result.user;
          // Check if it's a new user
          const userDocRef = doc(firestore, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          if (!userDoc.exists()) {
            // New user, create their document in Firestore
            await setDoc(userDocRef, {
              displayName: user.displayName,
              email: user.email,
              createdAt: new Date().toISOString(),
            });
          }
        }
      }).catch((error) => {
        // Handle Errors here.
        console.error("Error during Google sign-in redirect:", error);
      }).finally(() => {
        // In either case, auth state will be handled by onAuthStateChanged,
        // but we can stop any top-level loading indicators here if needed.
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
