'use client';

import { doc, setDoc, deleteDoc, serverTimestamp, collection, addDoc, Firestore } from 'firebase/firestore';
import type { Quiz } from '@/lib/types';

// NOTE: We are not awaiting these calls. This is intentional.
// We rely on optimistic updates and the real-time listener to update the UI.
// Error handling should be done via a centralized system if needed, not with try/catch here.

export const saveQuiz = (db: Firestore, userId: string, quizData: Quiz) => {
  if (!userId) return;
  const quizRef = doc(db, 'users', userId, 'quizzes', quizData.id);
  setDoc(quizRef, { ...quizData, ownerId: userId }, { merge: true });
};

export const deleteQuiz = (db: Firestore, userId: string, quizId: string) => {
  if (!userId) return;
  const quizRef = doc(db, 'users', userId, 'quizzes', quizId);
  deleteDoc(quizRef);
};

export const saveProgress = (db: Firestore, userId: string, quizId: string, progress: any) => {
    if (!userId) return;
    const progressRef = doc(db, 'users', userId, 'progress', quizId);
    setDoc(progressRef, progress, { merge: true });
}

export const resetProgress = (db: Firestore, userId: string, quizId: string) => {
    if (!userId) return;
    const progressRef = doc(db, 'users', userId, 'progress', quizId);
    deleteDoc(progressRef);
}
