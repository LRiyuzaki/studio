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
        id: user.uid,
        displayName: user.displayName,
        email: user.email,
        createdAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error("Error creating or checking user document:", error);
  }
};


/**
 * Provides Firebase services and user authentication state to its children via context.
 * It handles user creation in Firestore and listens for auth state changes.
 * @param {object} props - The props for the provider.
 * @param {ReactNode} props.children - The child components to render.
 * @param {FirebaseApp} props.firebaseApp - The Firebase app instance.
 * @param {Firestore} props.firestore - The Firestore instance.
 * @param {Auth} props.auth - The Firebase Auth instance.
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
    // This function handles the entire authentication state management
    const manageAuth = async () => {
      try {
        // First, check if the user is returning from a redirect sign-in
        const result = await getRedirectResult(auth);
        
        if (result && result.user) {
          // If they are, create their document and set the user state immediately
          await createUserDocument(firestore, result.user);
          setUser(result.user);
        }
      } catch (error) {
        // Handle potential errors from getRedirectResult
        console.error("Error processing redirect result:", error);
      }
      
      // After handling the redirect, set up the normal auth state listener.
      // This will handle all other cases (e.g., user is already logged in, logs out, etc.)
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          // User is signed in. Ensure document exists.
          await createUserDocument(firestore, firebaseUser);
          setUser(firebaseUser);
        } else {
          // User is signed out.
          setUser(null);
        }
        // Set loading to false once we have a definitive user state.
        setIsUserLoading(false);
      });
  
      // Cleanup function that will be called when the component unmounts.
      return () => {
        unsubscribe();
      };
    };

    // Run the authentication management function
    manageAuth();
    
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
