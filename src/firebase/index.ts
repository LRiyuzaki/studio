'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// Store initialized services
let firebaseServices: { firebaseApp: FirebaseApp; auth: Auth; firestore: Firestore; } | null = null;

/**
 * Initializes and returns a singleton instance of Firebase services.
 * This function ensures that Firebase is initialized only once.
 * @returns {{ firebaseApp: FirebaseApp; auth: Auth; firestore: Firestore; }} The initialized Firebase services.
 */
export function initializeFirebase() {
  if (firebaseServices) {
    return firebaseServices;
  }

  let firebaseApp: FirebaseApp;
  if (!getApps().length) {
    firebaseApp = initializeApp(firebaseConfig);
  } else {
    firebaseApp = getApp();
  }

  const auth = getAuth(firebaseApp);
  const firestore = getFirestore(firebaseApp);
  
  firebaseServices = { firebaseApp, auth, firestore };
  
  return firebaseServices;
}

export * from './provider';
export * from './client-provider';
