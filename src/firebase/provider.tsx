'use client';

import React, { createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged, getRedirectResult } from 'firebase/auth';

interface FirebaseContextState {
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  user: User | null;
  isUserLoading: boolean;
}

const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

const createUserDocument = async (firestore: Firestore, user: User) => {
    if (!firestore) return;
    const userDocRef = doc(firestore, 'users', user.uid);
    try {
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists()) {
            await setDoc(userDocRef, {
                id: user.uid,
                displayName: user.displayName,
                email: user.email,
                createdAt: serverTimestamp(),
            });
            console.log('User document created for:', user.uid);
        }
    } catch (error) {
        console.error("Error creating or checking user document:", error);
    }
};

/**
 * Provides Firebase services and user authentication state to its children via context.
 * It listens for auth state changes to provide the current user.
 * @param {object} props - The props for the provider.
 * @returns {JSX.Element} The rendered Firebase provider.
 */
export const FirebaseProvider: React.FC<{ children: ReactNode; firebaseApp: FirebaseApp; firestore: Firestore; auth: Auth; }> = ({
  children,
  firebaseApp,
  firestore,
  auth,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);

  useEffect(() => {
    // Listener for persistent authentication state
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setIsUserLoading(false);
    });

    // Handle the result of a redirect sign-in
    getRedirectResult(auth)
      .then((result) => {
        if (result && result.user) {
          // This is the user from the redirect
          setUser(result.user);
          createUserDocument(firestore, result.user);
        }
      })
      .catch((error) => {
        console.error("Firebase redirect result error:", error);
      })
      .finally(() => {
        setIsUserLoading(false);
      });

    // Cleanup the listener when the component unmounts.
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

/**
 * A custom hook to access Firebase services from the FirebaseContext.
 * Throws an error if used outside of a FirebaseProvider.
 * @returns {Required<FirebaseContextState>} The Firebase context value.
 */
export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }
  if (!context.auth || !context.firestore || !context.firebaseApp) {
    return { auth: null, firestore: null, firebaseApp: null, user: null, isUserLoading: true };
  }
  return context as Required<FirebaseContextState>;
};

/**
 * A custom hook to access the current user and their loading state from the FirebaseContext.
 * Throws an error if used outside of a FirebaseProvider.
 * @returns {{ user: User | null; isUserLoading: boolean; }} The user and their loading state.
 */
export const useUser = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a FirebaseProvider.');
  }
  return { user: context.user, isUserLoading: context.isUserLoading };
};
