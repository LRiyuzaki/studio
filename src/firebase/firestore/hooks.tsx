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

export function useCollection<T>(path: string | null, ...queryConstraints: any[]) {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const stringifiedQueryConstraints = JSON.stringify(queryConstraints);

  useEffect(() => {
    // Moved firestore access into useEffect
    const getFirestore = async () => {
        const { useFirestore } = await import('@/firebase/provider');
        return useFirestore();
    }

    let unsubscribe: () => void = () => {};

    const fetchData = async () => {
        setLoading(true);

        // Conditional fetching based on path
        if (!path) {
            setData([]);
            setLoading(false);
            return;
        }

        try {
            const { getFirestore, collection, query, onSnapshot } = await import('firebase/firestore');
            const { initializeFirebase } = await import('@/firebase');
            
            const firestoreInstance = initializeFirebase().firestore as Firestore;

            if (!firestoreInstance) {
                setLoading(false);
                return;
            }

            const collRef = collection(firestoreInstance, path) as CollectionReference<T>;
            const q = query(collRef, ...queryConstraints);

            unsubscribe = onSnapshot(
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
        } catch (err: any) {
            console.error("Error in useCollection setup:", err);
            setError(err);
            setLoading(false);
        }
    }

    fetchData();

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, stringifiedQueryConstraints]);

  return { data, loading, error };
}

export function useDoc<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let unsubscribe: () => void = () => {};

    const fetchData = async () => {
        setLoading(true);

        if (!path) {
            setData(null);
            setLoading(false);
            return;
        };

        try {
            const { getFirestore, doc, onSnapshot } = await import('firebase/firestore');
            const { initializeFirebase } = await import('@/firebase');
            const firestoreInstance = initializeFirebase().firestore as Firestore;

            if (!firestoreInstance) {
                setLoading(false);
                return;
            }

            const docRef = doc(firestoreInstance, path) as DocumentReference<T>;

            unsubscribe = onSnapshot(
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
        } catch(err: any) {
            console.error("Error in useDoc setup:", err);
            setError(err);
            setLoading(false);
        }
    }

    fetchData();
    
    return () => unsubscribe();
  }, [path]);

  return { data, loading, error };
}

    