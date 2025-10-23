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
    // This effect runs once on mount to handle the redirect result and then set up the auth state listener.
    const processRedirectAndListen = async () => {
      try {
        // First, process the redirect result. This will resolve with the user if they are coming back from a sign-in.
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          // A user signed in via redirect.
          await createUserDocument(firestore, result.user);
          setUser(result.user);
        }
      } catch (error) {
        // Handle errors from getRedirectResult, such as `auth/account-exists-with-different-credential`
        console.error("Error during redirect result processing:", error);
      } finally {
        // After processing the redirect (or if there was no redirect), set up the normal auth state listener.
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          if (firebaseUser) {
            // User is signed in. Ensure document exists.
            if (!user) { // Only create doc if user is not already set from redirect
                await createUserDocument(firestore, firebaseUser);
            }
            setUser(firebaseUser);
          } else {
            // User is signed out.
            setUser(null);
          }
          // Set loading to false once we have a definitive user state.
          setIsUserLoading(false);
        });
        
        // Return the unsubscribe function for cleanup.
        return unsubscribe;
      }
    };

    const unsubscribePromise = processRedirectAndListen();

    // Cleanup function that will be called when the component unmounts.
    return () => {
      unsubscribePromise.then(unsubscribe => {
        if (unsubscribe) {
          unsubscribe();
        }
      });
    };
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
