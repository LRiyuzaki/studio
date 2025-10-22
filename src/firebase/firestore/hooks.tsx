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
} from 'firebase/firestore';
import { useFirestore } from '@/firebase';

export function useCollection<T>(path: string | null, ...queryConstraints: any[]) {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const firestore = useFirestore();

  useEffect(() => {
    if (!firestore || !path) {
      setData([]);
      setLoading(false);
      return;
    }

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
      },
      (err) => {
        console.error(err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firestore, path, ...queryConstraints]);

  return { data, loading, error };
}

export function useDoc<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const firestore = useFirestore();

  useEffect(() => {
    if (!firestore || !path) {
      setData(null);
      setLoading(false);
      return;
    };

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
      },
      (err) => {
        console.error(err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firestore, path]);

  return { data, loading, error };
}
