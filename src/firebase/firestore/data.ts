'use client';

import { doc, setDoc, deleteDoc, Firestore } from 'firebase/firestore';
import type { Quiz } from '@/lib/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export const saveQuiz = (db: Firestore, userId: string, quizData: Quiz) => {
  if (!userId) return;
  const quizRef = doc(db, 'users', userId, 'quizzes', quizData.id);
  const dataToSave = { ...quizData, ownerId: userId };
  setDoc(quizRef, dataToSave, { merge: true }).catch((serverError) => {
    const permissionError = new FirestorePermissionError({
      path: quizRef.path,
      operation: 'update', // or 'create' depending on context
      requestResourceData: dataToSave,
    }, serverError);
    errorEmitter.emit('permission-error', permissionError);
  });
};

export const deleteQuiz = (db: Firestore, userId: string, quizId: string) => {
  if (!userId) return;
  const quizRef = doc(db, 'users', userId, 'quizzes', quizId);
  deleteDoc(quizRef).catch((serverError) => {
    const permissionError = new FirestorePermissionError({
      path: quizRef.path,
      operation: 'delete',
    }, serverError);
    errorEmitter.emit('permission-error', permissionError);
  });
};

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
  deleteDoc(progressRef).catch((serverError) => {
    const permissionError = new FirestorePermissionError({
      path: progressRef.path,
      operation: 'delete',
    }, serverError);
    errorEmitter.emit('permission-error', permissionError);
  });
};
