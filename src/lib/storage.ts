'use client';
import { Course, CourseProgress, QuizResult, QuizMode, MCQ } from './types';
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  writeBatch,
  query,
  where,
  serverTimestamp,
  Firestore,
} from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

function getFirestoreInstance() {
  return initializeFirebase().firestore;
}

/**
 * Saves a Course object to Firestore.
 */
export async function saveCourse(course: Course, userId: string): Promise<void> {
  const firestore = getFirestoreInstance();
  const courseWithMeta = { ...course, ownerId: userId, createdAt: new Date().toISOString() };
  const courseRef = doc(firestore, 'courses', course.courseId);
  await setDoc(courseRef, courseWithMeta);
}

/**
 * Retrieves all courses for a specific user from Firestore.
 */
export async function getCourses(userId: string): Promise<Course[]> {
  const firestore = getFirestoreInstance();
  const coursesRef = collection(firestore, 'courses');
  const q = query(coursesRef, where('ownerId', '==', userId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data() as Course);
}

/**
 * Retrieves a single course by its ID from Firestore.
 */
export async function getCourse(userId: string, courseId: string): Promise<Course | null> {
    const firestore = getFirestoreInstance();
    const courseRef = doc(firestore, 'courses', courseId);
    const docSnap = await getDoc(courseRef);
    if (!docSnap.exists() || docSnap.data().ownerId !== userId) {
        return null;
    }
    return docSnap.data() as Course;
}

/**
 * Deletes a course from Firestore.
 */
export async function deleteCourse(userId: string, courseId: string): Promise<void> {
    const firestore = getFirestoreInstance();
    const courseRef = doc(firestore, 'courses', courseId);
    // Optional: Check ownership before deleting
    const courseSnap = await getDoc(courseRef);
    if (courseSnap.exists() && courseSnap.data().ownerId === userId) {
      await deleteDoc(courseRef);
    }
}

/**
 * Initializes a new progress object for a given course.
 */
export function initProgress(courseId: string): CourseProgress {
  return {
    courseId,
    completedTopics: [],
    unitProgress: {},
    totalXP: 0,
    quizHistory: [],
    level: 1,
    currentStreak: 0,
    lastStudyDate: '',
  };
}

/**
 * Retrieves or initializes progress for a user and course.
 */
export async function getProgress(userId: string, courseId: string): Promise<CourseProgress> {
  const firestore = getFirestoreInstance();
  const progressRef = doc(firestore, 'users', userId, 'progress', courseId);
  const docSnap = await getDoc(progressRef);
  if (docSnap.exists()) {
    return docSnap.data() as CourseProgress;
  }
  const newProgress = initProgress(courseId);
  await setDoc(progressRef, newProgress);
  return newProgress;
}

/**
 * Saves a progress object to Firestore for a given user.
 */
export async function saveProgress(userId: string, progress: CourseProgress): Promise<void> {
  const firestore = getFirestoreInstance();
  const progressRef = doc(firestore, 'users', userId, 'progress', progress.courseId);
  await setDoc(progressRef, progress, { merge: true });
}

/**
 * Resets the progress for a specific course to its initial state in Firestore.
 */
export async function resetProgress(userId: string, courseId: string): Promise<CourseProgress> {
  const newProgress = initProgress(courseId);
  await saveProgress(userId, newProgress);
  return newProgress;
}

/**
 * Updates the user's progress after they complete a quiz.
 */
export async function updateProgressAfterQuiz(
  userId: string,
  courseId: string,
  topicId: string,
  topicTitle: string,
  unitId: string,
  score: number,
  total: number,
  answers: (string | null)[],
  mode: QuizMode,
  timeSpent: number
): Promise<CourseProgress> {
  const firestore = getFirestoreInstance();
  const progress = await getProgress(userId, courseId);
  const course = await getCourse(userId, courseId);
  if (!course) return progress;

  if (topicId !== 'all' && score === total && !progress.completedTopics.includes(topicId)) {
    progress.completedTopics.push(topicId);
  }

  const xpEarned = score * 10 + (score === total ? 50 : 0);
  progress.totalXP += xpEarned;
  progress.level = Math.floor(progress.totalXP / 500) + 1;

  course.units.forEach(unit => {
    const completedInUnit = unit.topics.filter(t => progress.completedTopics.includes(t.topicId)).length;
    progress.unitProgress[unit.unitId] = {
      completionPercentage: unit.topics.length > 0 ? Math.round((completedInUnit / unit.topics.length) * 100) : 0,
    };
  });

  const quizResult: QuizResult = {
    topicId,
    topicTitle,
    score,
    total,
    percentage: total > 0 ? Math.round((score / total) * 100) : 0,
    answers,
    completedAt: new Date().toISOString(),
    mode,
    timeSpent,
    unitId: unitId,
    unitScores: {},
  };

  if (topicId === 'all') {
    const unitScores: Record<string, { score: number; total: number }> = {};
    const allMCQs = getAllMCQs(course);
    
    answers.forEach((userAnswer, index) => {
      const question = allMCQs[index];
      if (!question) return;
      const questionUnit = course.units.find(u => u.topics.some(t => t.mcqs.some(m => m.questionId === question.questionId)));
      if (!questionUnit) return;
      if (!unitScores[questionUnit.unitId]) {
        unitScores[questionUnit.unitId] = { score: 0, total: 0 };
      }
      unitScores[questionUnit.unitId].total++;
      if (userAnswer === question.correct) {
        unitScores[questionUnit.unitId].score++;
      }
    });
    quizResult.unitScores = unitScores;
  }

  progress.quizHistory.push(quizResult);

  await saveProgress(userId, progress);
  return progress;
}

/**
 * Resets comprehensive quiz progress for a specific mode.
 */
export async function resetComprehensiveQuizModeProgress(userId: string, courseId: string, mode: QuizMode): Promise<CourseProgress> {
  const progress = await getProgress(userId, courseId);
  progress.quizHistory = progress.quizHistory.filter(
    result => !(result.topicId === 'all' && result.mode === mode)
  );
  await saveProgress(userId, progress);
  return progress;
}

function getAllMCQs(course: Course): MCQ[] {
    const allMCQs: MCQ[] = [];
    course.units.forEach(unit => {
        unit.topics.forEach(topic => {
            allMCQs.push(...topic.mcqs);
        });
    });
    return allMCQs;
}

/**
 * Gets overall stats for a user across all their courses.
 */
export async function getOverallStats(userId:string) {
  const courses = await getCourses(userId);
  let totalQuizzes = 0;
  let totalXP = 0;
  
  for (const course of courses) {
    const progress = await getProgress(userId, course.courseId);
    totalQuizzes += progress.quizHistory.length;
    totalXP += progress.totalXP;
  }
  
  return { totalCourses: courses.length, totalQuizzes, totalXP };
}
