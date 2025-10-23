'use client';

import React, { createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged, getRedirectResult, GoogleAuthProvider } from 'firebase/auth';

interface FirebaseContextState {
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  user: User | null;
  isUserLoading: boolean;
}

const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

const createUserDocument = async (firestore: Firestore, user: User) => {
  const userDocRef = doc(firestore, 'users', user.uid);
  try {
    const userDoc = await getDoc(userDocRef);
    if (!userDoc.exists()) {
      await setDoc(userDocRef, {
        displayName: user.displayName,
        email: user.email,
        createdAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error("Error creating or checking user document:", error);
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
    // First, process the redirect result. This runs when the page loads after a redirect.
    getRedirectResult(auth)
      .then(async (result) => {
        if (result && result.user) {
          // User signed in via redirect.
          await createUserDocument(firestore, result.user);
          setUser(result.user);
        }
      })
      .catch((error) => {
        // Handle errors from the redirect flow.
        console.error("Error processing redirect result:", error);
      }).finally(() => {
        // After processing the redirect (or if there was no redirect),
        // set up the normal auth state listener.
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          if (firebaseUser) {
            // User is signed in. Make sure their document exists.
            // Check if it's a new user from a non-redirect flow (e.g., email/password signup)
            if (!user || user.uid !== firebaseUser.uid) {
               await createUserDocument(firestore, firebaseUser);
            }
            setUser(firebaseUser);
          } else {
            // User is signed out.
            setUser(null);
          }
          // Set loading to false only after the listener has run at least once.
          setIsUserLoading(false);
        });
        
        // Cleanup the listener on component unmount
        return () => unsubscribe();
      });
  }, [auth, firestore, user]);

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

export const useUser = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a FirebaseProvider.');
  }
  return { user: context.user, isUserLoading: context.isUserLoading };
};
