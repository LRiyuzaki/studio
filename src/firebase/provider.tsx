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
    // This effect manages the user's authentication state.
    
    // First, process the redirect result. This is crucial for completing the
    // sign-in flow when returning from Google's sign-in page.
    getRedirectResult(auth)
      .then(async (result) => {
        if (result && result.user) {
          // A user has successfully signed in via redirect.
          // Create their document in Firestore if it doesn't exist.
          await createUserDocument(firestore, result.user);
          setUser(result.user);
        }
      })
      .catch((error) => {
        // Handle any errors that occurred during the redirect flow.
        console.error("Error processing redirect result:", error);
      }).finally(() => {
        // After processing the redirect (or if there was no redirect),
        // set up the primary authentication state listener.
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          if (firebaseUser) {
            // A user is signed in (either from the redirect, a password login, or a previous session).
            // We ensure their document exists. This might be redundant if the redirect
            // just happened, but it's a safe check for other login types.
            if (!user || user.uid !== firebaseUser.uid) {
               await createUserDocument(firestore, firebaseUser);
            }
            setUser(firebaseUser);
          } else {
            // The user is signed out.
            setUser(null);
          }
          // The initial auth state has been determined, so we can stop loading.
          setIsUserLoading(false);
        });
        
        // Return the cleanup function to unsubscribe from the listener on component unmount.
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
