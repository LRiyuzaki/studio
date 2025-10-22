
'use client';

import { useState, useEffect } from 'react';
import {
  onSnapshot,
  collection,
  query,
  doc,
  type DocumentData,
  type CollectionReference,
  type Query,
  type DocumentReference,
  type Firestore,
} from 'firebase/firestore';
import { useFirestore } from '@/firebase/provider'; // Import useFirestore hook

// This file is no longer used and is kept for reference.
// The data fetching logic has been moved directly into the components
// that need it, like DashboardPage.tsx, to ensure that the firestore
// instance is available before any fetching is attempted.

export function useCollection<T>(path: string | null, ...queryConstraints: any[]) {
  const firestore = useFirestore(); // Use the hook to get firestore instance
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const stringifiedQueryConstraints = JSON.stringify(queryConstraints);

  useEffect(() => {
    if (!path || !firestore) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const collRef = collection(firestore, path) as CollectionReference<T>;
    const q = query(collRef, ...queryConstraints);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data: T[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setData(data);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error(`Error fetching collection ${path}:`, err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, stringifiedQueryConstraints, firestore]);

  return { data, loading, error };
}

export function useDoc<T>(path: string | null) {
  const firestore = useFirestore(); // Use the hook to get firestore instance
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!path || !firestore) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    const docRef = doc(firestore, path) as DocumentReference<T>;

    const unsubscribe = onSnapshot(
      docRef,
      (doc) => {
        if (doc.exists()) {
          setData({ id: doc.id, ...doc.data() } as T);
        } else {
          setData(null);
        }
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error(`Error fetching document ${path}:`, err);
        setError(err);
        setLoading(false);
      }
    );
    
    return () => unsubscribe();
  }, [path, firestore]);

  return { data, loading, error };
}
