
'use client';
import { Course, CourseProgress, QuizResult, QuizMode, UpdateProgressParams } from './types';
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  where,
  Firestore,
  getCountFromServer,
} from 'firebase/firestore';
import { getAllMCQs, getUnitForTopic } from './course-parser';
import { db } from './db';
import { courseCache, progressCache } from './cache';

/**
 * Saves a Course object to Firestore and all local caches (memory and Dexie).
 * @param {Firestore} firestore - The Firestore service instance.
 * @param {Course} course - The course object to save.
 * @param {string} userId - The ID of the user who owns the course.
 * @returns {Promise<void>} A promise that resolves when the course is saved.
 */
export async function saveCourse(firestore: Firestore, course: Course, userId: string): Promise<void> {
  const courseWithMeta = { 
    ...course, 
    ownerId: userId,
    createdAt: new Date().toISOString(),
  };
  const courseRef = doc(firestore, 'courses', course.courseId);
  
  await setDoc(courseRef, courseWithMeta);
  // Update caches
  await db.courses.put(courseWithMeta);
  courseCache.set(course.courseId, courseWithMeta);
  
  // Also initialize progress for the user who uploaded it.
  await getProgress(firestore, userId, course.courseId);
}

/**
 * Retrieves all courses owned by a user from Firestore and populates caches.
 * This function is the primary source of truth from the server.
 * @param {Firestore} firestore - The Firestore service instance.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<Course[]>} A promise that resolves to an array of courses.
 */
export async function getCourses(firestore: Firestore, userId: string): Promise<Course[]> {
    const coursesRef = collection(firestore, 'courses');
    const q = query(coursesRef, where('ownerId', '==', userId));
    const querySnapshot = await getDocs(q);
    const courses = querySnapshot.docs.map(doc => doc.data() as Course);
  
    if (courses.length > 0) {
      // Update caches to ensure they are always in sync
      await db.courses.bulkPut(courses);
      courses.forEach(course => courseCache.set(course.courseId, course));
    }
    
    return courses;
}


/**
 * Retrieves a single course by its ID from Firestore and updates caches.
 * This function is the primary source of truth from the server.
 * @param {Firestore} firestore - The Firestore service instance.
 * @param {string} userId - The ID of the user attempting to access the course.
 * @param {string} courseId - The ID of the course to retrieve.
 * @returns {Promise<Course | null>} A promise that resolves to the course object or null if not found.
 */
export async function getCourse(firestore: Firestore, userId: string, courseId: string): Promise<Course | null> {
    const courseRef = doc(firestore, 'courses', courseId);
    const docSnap = await getDoc(courseRef);
    if (!docSnap.exists()) {
        return null;
    }

    const course = docSnap.data() as Course;
    // Update caches
    await db.courses.put(course);
    courseCache.set(course.courseId, course);
    return course;
}

/**
 * Deletes a course from Firestore and all local caches.
 * @param {Firestore} firestore - The Firestore service instance.
 * @param {string} userId - The ID of the user requesting the deletion.
 * @param {string} courseId - The ID of the course to delete.
 * @returns {Promise<void>} A promise that resolves when the deletion is complete.
 */
export async function deleteCourse(firestore: Firestore, userId: string, courseId: string): Promise<void> {
    const courseRef = doc(firestore, 'courses', courseId);
    const courseSnap = await getDoc(courseRef);

    if (courseSnap.exists() && courseSnap.data().ownerId === userId) {
      const progressRef = doc(firestore, 'users', userId, 'progress', courseId);
      await Promise.all([
        deleteDoc(courseRef),
        deleteDoc(progressRef),
        // Clear caches
        db.courses.delete(courseId),
        db.progress.delete(courseId),
        courseCache.delete(courseId),
        progressCache.delete(courseId)
      ]);
    }
}

/**
 * Initializes a new, empty progress object for a given course.
 * @param {string} courseId - The ID of the course.
 * @param {string} userId - The ID of the user.
 * @returns {CourseProgress} The initial progress object.
 */
export function initProgress(courseId: string, userId: string): CourseProgress {
  return {
    courseId,
    userId,
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
 * Retrieves a user's progress for a course from Firestore and updates caches.
 * If progress doesn't exist, it's created. This is the primary source of truth.
 * @param {Firestore} firestore - The Firestore service instance.
 * @param {string} userId - The ID of the user.
 * @param {string} courseId - The ID of the course.
 * @returns {Promise<CourseProgress>} A promise that resolves to the user's course progress.
 */
export async function getProgress(firestore: Firestore, userId: string, courseId: string): Promise<CourseProgress> {
  const progressRef = doc(firestore, 'users', userId, 'progress', courseId);
  const docSnap = await getDoc(progressRef);
  
  if (docSnap.exists()) {
    const progress = docSnap.data() as CourseProgress;
    await saveProgressToCache(progress);
    return progress;
  }
  
  const newProgress = initProgress(courseId, userId);
  await saveProgress(firestore, userId, newProgress); // This will also save to cache
  return newProgress;
}

/**
 * Saves a progress object to all caches (memory and Dexie).
 * @param {CourseProgress} progress - The progress object to save.
 * @returns {Promise<void>}
 */
async function saveProgressToCache(progress: CourseProgress): Promise<void> {
  await db.progress.put(progress);
  progressCache.set(progress.courseId, progress);
}


/**
 * Saves a progress object to Firestore and all local caches.
 * @param {Firestore} firestore - The Firestore service instance.
 * @param {string} userId - The ID of the user.
 * @param {CourseProgress} progress - The progress object to save.
 * @returns {Promise<void>} A promise that resolves when the progress is saved.
 */
export async function saveProgress(firestore: Firestore, userId: string, progress: CourseProgress): Promise<void> {
  const progressRef = doc(firestore, 'users', userId, 'progress', progress.courseId);
  await setDoc(progressRef, progress, { merge: true });
  await saveProgressToCache(progress);
}

/**
 * Resets the progress for a specific course to its initial state.
 * @param {Firestore} firestore - The Firestore service instance.
 * @param {string} userId - The ID of the user.
 * @param {string} courseId - The ID of the course to reset.
 * @returns {Promise<CourseProgress>} A promise that resolves to the new, reset progress object.
 */
export async function resetProgress(firestore: Firestore, userId: string, courseId: string): Promise<CourseProgress> {
  const newProgress = initProgress(courseId, userId);
  await saveProgress(firestore, userId, newProgress);
  return newProgress;
}

/**
 * Updates user progress after a quiz is completed, saving to both Firestore and local cache.
 * @param {Firestore} firestore - The Firestore service instance.
 * @param {UpdateProgressParams} params - An object containing all necessary parameters for the update.
 * @returns {Promise<CourseProgress>} A promise resolving to the updated course progress.
 */
export async function updateProgressAfterQuiz(firestore: Firestore, params: UpdateProgressParams): Promise<CourseProgress> {
  const {
    userId,
    courseId,
    topicId,
    score,
    total,
  } = params;

  // Since this is a critical update, fetch the latest progress and course directly.
  const progress = await getProgress(firestore, userId, courseId);
  const course = await getCourse(firestore, userId, courseId);
  if (!course) return progress;

  const topic = course.units.flatMap(u => u.topics).find(t => t.topicId === topicId);

  // Mark topic as completed if all questions were answered correctly
  if (topicId !== 'all' && score === total && !progress.completedTopics.includes(topicId)) {
    progress.completedTopics.push(topicId);
  }

  // Calculate XP and level
  const xpEarned = score * 10 + (score === total ? 50 : 0);
  progress.totalXP += xpEarned;
  progress.level = Math.floor(progress.totalXP / 500) + 1;

  // Recalculate unit completion percentages
  course.units.forEach(unit => {
    const completedInUnit = unit.topics.filter(t => progress.completedTopics.includes(t.topicId)).length;
    const completionPercentage = unit.topics.length > 0 ? Math.round((completedInUnit / unit.topics.length) * 100) : 0;
    progress.unitProgress[unit.unitId] = {
      completionPercentage,
    };
  });

  // Create quiz result record
  const quizResult: QuizResult = {
    ...params,
    topicTitle: topicId === 'all' ? 'Comprehensive Quiz' : topic?.topicTitle || 'Unknown Topic',
    unitId: topicId === 'all' ? 'all-units' : getUnitForTopic(course, topicId)?.unitId || 'unknown-unit',
    percentage: total > 0 ? Math.round((score / total) * 100) : 0,
    completedAt: new Date().toISOString(),
    unitScores: {},
  };

  // If it's a comprehensive quiz, calculate per-unit scores
  if (topicId === 'all') {
    const unitScores: Record<string, { score: number; total: number }> = {};
    const allMCQs = getAllMCQs(course);
    
    params.answers.forEach((userAnswer, index) => {
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

  await saveProgress(firestore, userId, progress);
  return progress;
}

/**
 * Resets comprehensive quiz progress for a specific mode by clearing its history.
 * @param {Firestore} firestore - The Firestore service instance.
 * @param {string} userId - The ID of the user.
 * @param {string} courseId - The ID of the course.
 * @param {QuizMode} mode - The quiz mode to reset ('practice' or 'exam').
 * @returns {Promise<CourseProgress>} A promise that resolves to the updated progress.
 */
export async function resetComprehensiveQuizModeProgress(firestore: Firestore, userId: string, courseId: string, mode: QuizMode): Promise<CourseProgress> {
  const progress = await getProgress(firestore, userId, courseId);
  progress.quizHistory = progress.quizHistory.filter(
    result => !(result.topicId === 'all' && result.mode === mode)
  );
  await saveProgress(firestore, userId, progress);
  return progress;
}

/**
 * Gets overall stats for a user across all their courses efficiently.
 * @param {Firestore} firestore - The Firestore service instance.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<{ totalCourses: number, totalQuizzes: number, totalXP: number }>} An object with the user's aggregate stats.
 */
export async function getOverallStats(firestore: Firestore, userId: string): Promise<{ totalCourses: number, totalQuizzes: number, totalXP: number }> {
  const coursesQuery = query(collection(firestore, 'courses'), where('ownerId', '==', userId));
  const coursesCountSnapshot = await getCountFromServer(coursesQuery);
  const totalCourses = coursesCountSnapshot.data().count;

  const progressCollectionRef = collection(firestore, 'users', userId, 'progress');
  const progressSnapshot = await getDocs(progressCollectionRef);
  
  let totalQuizzes = 0;
  let totalXP = 0;
  
  progressSnapshot.docs.forEach(doc => {
    const progress = doc.data() as CourseProgress;
    totalQuizzes += progress.quizHistory.length;
    totalXP += progress.totalXP;
  });
  
  return { totalCourses, totalQuizzes, totalXP };
}
