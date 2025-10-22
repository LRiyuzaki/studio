'use client';

import { createContext, useContext, useMemo } from 'react';
import type { FirebaseApp } from 'firebase/app';
import { initializeApp, getApps, getApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import { getAuth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from './config';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

// Initialize Firebase app
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth: Auth = getAuth(app);
const firestore: Firestore = getFirestore(app);

interface FirebaseContextValue {
  app: FirebaseApp | null;
  auth: Auth | null;
  firestore: Firestore | null;
}

const FirebaseContext = createContext<FirebaseContextValue>({
  app: null,
  auth: null,
  firestore: null,
});

export function FirebaseProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const value = useMemo(() => ({ app, auth, firestore }), []);
  return (
    <FirebaseContext.Provider value={value}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
}

export const useFirebase = () => useContext(FirebaseContext);

export const useFirebaseApp = () => {
  const context = useContext(FirebaseContext);
  if (!context.app) {
    throw new Error('useFirebaseApp must be used within a FirebaseProvider');
  }
  return context.app;
};

export const useAuth = () => {
  const context = useContext(FirebaseContext);
  if (!context.auth) {
    throw new Error('useAuth must be used within a FirebaseProvider');
  }
  return context.auth;
};

export const useFirestore = () => {
    const context = useContext(FirebaseContext);
    if (!context.firestore) {
        throw new Error('useFirestore must be used within a FirebaseProvider');
    }
    return context.firestore;
};
