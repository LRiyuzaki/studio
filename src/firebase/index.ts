'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// This structure ensures that Firebase is initialized only once.
let firebaseApp: FirebaseApp;
if (!getApps().length) {
    firebaseApp = initializeApp(firebaseConfig);
} else {
    firebaseApp = getApp();
}

const auth = getAuth(firebaseApp);
const firestore = getFirestore(firebaseApp);

/**
 * Exports singleton instances of Firebase services.
 * This approach is friendly to fast refresh and bundlers like Turbopack
 * by ensuring services are initialized only once per application lifecycle.
 */
export { firebaseApp, auth, firestore };

export * from './provider';
export * from './client-provider';
