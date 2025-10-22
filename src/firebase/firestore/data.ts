'use client';

import { doc, setDoc, deleteDoc, Firestore } from 'firebase/firestore';
import type { Quiz } from '@/lib/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { db } from '@/lib/db';

// This function now writes to the local IndexedDB first (offline-first)
export const saveQuiz = async (quizData: Quiz) => {
  // The 'ownerId' should be added before syncing to Firestore, not here.
  await db.quizzes.put(quizData);
  // Later, a sync mechanism will push this to Firestore.
};

// This function now deletes from the local IndexedDB
export const deleteQuiz = async (quizId: string) => {
  await db.quizzes.delete(quizId);
  // Later, a sync mechanism will delete this from Firestore.
};

// This function remains for syncing progress to Firestore.
export const saveProgress = (db: Firestore, userId: string, quizId: string, progress: any) => {
  if (!userId) return;
  const progressRef = doc(db, 'users', userId, 'progress', quizId);
  setDoc(progressRef, progress, { merge: true }).catch((serverError) => {
    const permissionError = new FirestorePermissionError({
      path: progressRef.path,
      operation: 'update',
      requestResourceData: progress,
    }, serverError);
    errorEmitter.emit('permission-error', permissionError);
  });
};

export const resetProgress = (db: Firestore, userId: string, quizId: string) => {
  if (!userId) return;
  const progressRef = doc(db, 'users', userId, 'progress', quizId);
  // This operation is destructive and should also be queued for offline.
  // For now, it remains an online-only operation.
  deleteDoc(progressRef).catch((serverError) => {
    const permissionError = new FirestorePermissionError({
      path: progressRef.path,
      operation: 'delete',
    }, serverError);
    errorEmitter.emit('permission-error', permissionError);
  });
};
