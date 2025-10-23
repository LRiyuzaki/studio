'use client';
import { Course, CourseProgress, QuizResult, QuizMode } from './types';
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
} from 'firebase/firestore';
import { setDocumentNonBlocking, deleteDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

/**
 * Saves a Course object to Firestore.
 * @param {Firestore} firestore - The Firestore instance.
 * @param {Course} course - The course to save.
 * @param {string} userId - The ID of the user owning the course.
 * @returns {Promise<void>}
 */
export async function saveCourse(firestore: any, course: Course, userId: string): Promise<void> {
    const courseWithMeta = { ...course, ownerId: userId, createdAt: new Date().toISOString() };
    const courseRef = doc(firestore, 'courses', course.courseId);
    // Use the non-blocking update for optimistic UI and proper error handling
    setDocumentNonBlocking(courseRef, courseWithMeta, {});
}

/**
 * Retrieves all courses for a specific user from Firestore.
 * @param {Firestore} firestore - The Firestore instance.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<Course[]>} A promise that resolves to an array of courses.
 */
export async function getCourses(firestore: any, userId: string): Promise<Course[]> {
  try {
    const coursesRef = collection(firestore, 'courses');
    const q = query(coursesRef, where('ownerId', '==', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as Course);
  } catch (error) {
    const permissionError = new FirestorePermissionError({
      path: `courses`,
      operation: 'list'
    });
    errorEmitter.emit('permission-error', permissionError);
    // Return empty array or handle as appropriate for your UI
    return [];
  }
}

/**
 * Retrieves a single course by its ID from Firestore.
 * @param {Firestore} firestore - The Firestore instance.
 * @param {string} courseId - The ID of the course to retrieve.
 * @returns {Promise<Course | null>} The found course, or null.
 */
export async function getCourse(firestore: any, courseId: string): Promise<Course | null> {
    try {
        const courseRef = doc(firestore, 'courses', courseId);
        const docSnap = await getDoc(courseRef);
        return docSnap.exists() ? (docSnap.data() as Course) : null;
    } catch (error) {
        const permissionError = new FirestorePermissionError({
            path: `courses/${courseId}`,
            operation: 'get'
        });
        errorEmitter.emit('permission-error', permissionError);
        return null;
    }
}

/**
 * Deletes a course and all associated progress from Firestore.
 * @param {Firestore} firestore - The Firestore instance.
 * @param {string} courseId - The ID of the course to delete.
 * @returns {Promise<void>}
 */
export async function deleteCourse(firestore: any, courseId: string): Promise<void> {
    const courseRef = doc(firestore, 'courses', courseId);
    deleteDocumentNonBlocking(courseRef);
    // In a real app, you would also clean up progress documents,
    // possibly with a Cloud Function triggered on course deletion.
}


/**
 * Initializes a new progress object for a given course.
 * @param {string} courseId - The ID of the course.
 * @returns {CourseProgress} The new, default progress object.
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
 * Retrieves the progress for a specific course from Firestore for a given user.
 * @param {Firestore} firestore - The Firestore instance.
 * @param {string} userId - The ID of the user.
 * @param {string} courseId - The ID of the course.
 * @returns {Promise<CourseProgress>} The user's progress object.
 */
export async function getProgress(firestore: any, userId: string, courseId: string): Promise<CourseProgress> {
  try {
    const progressRef = doc(firestore, 'users', userId, 'progress', courseId);
    const docSnap = await getDoc(progressRef);
    if (docSnap.exists()) {
      return docSnap.data() as CourseProgress;
    }
    return initProgress(courseId);
  } catch (error) {
    const permissionError = new FirestorePermissionError({
        path: `users/${userId}/progress/${courseId}`,
        operation: 'get'
    });
    errorEmitter.emit('permission-error', permissionError);
    return initProgress(courseId); // Return default progress on error
  }
}

/**
 * Saves a progress object to Firestore for a given user.
 * Uses a non-blocking update.
 * @param {Firestore} firestore - The Firestore instance.
 * @param {string} userId - The ID of the user.
 * @param {CourseProgress} progress - The progress object to save.
 */
export function saveProgress(firestore: any, userId: string, progress: CourseProgress): void {
  const progressRef = doc(firestore, 'users', userId, 'progress', progress.courseId);
  // Using merge: true to avoid overwriting the whole document if we only update parts
  setDocumentNonBlocking(progressRef, progress, { merge: true });
}

/**
 * Resets the progress for a specific course to its initial state in Firestore.
 * @param {Firestore} firestore - The Firestore instance.
 * @param {string} userId - The ID of the user.
 * @param {string} courseId - The ID of the course.
 * @returns {Promise<CourseProgress>} The new, initial progress object.
 */
export async function resetProgress(firestore: any, userId: string, courseId: string): Promise<CourseProgress> {
  const newProgress = initProgress(courseId);
  const progressRef = doc(firestore, 'users', userId, 'progress', courseId);
  // This is a destructive action, so we can await it, but still handle errors.
  setDoc(progressRef, newProgress).catch(error => {
      const permissionError = new FirestorePermissionError({
          path: progressRef.path,
          operation: 'write',
          requestResourceData: newProgress
      });
      errorEmitter.emit('permission-error', permissionError);
  });
  return newProgress;
}

/**
 * Updates the user's progress after they complete a quiz.
 * @param firestore The Firestore instance.
 * @param userId The ID of the user.
 * @param courseId The course ID.
 * @param topicId The topic ID of the completed quiz.
 * @param topicTitle The title of the topic.
 * @param unitId The parent unit ID.
 * @param score The number of correct answers.
 * @param total The total number of questions.
 * @param answers The user's answers.
 * @param mode The quiz mode.
 * @param timeSpent Time spent in seconds.
 * @returns The updated progress object.
 */
export async function updateProgressAfterQuiz(
  firestore: any,
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
  const progress = await getProgress(firestore, userId, courseId);
  const course = await getCourse(firestore, courseId);
  if (!course) return progress;

  // Mark topic as complete if 100% score AND it was a topic-specific quiz
  if (topicId !== 'all' && score === total && !progress.completedTopics.includes(topicId)) {
    progress.completedTopics.push(topicId);
  }

  // Update XP and level
  const xpEarned = score * 10 + (score === total ? 50 : 0);
  progress.totalXP += xpEarned;
  progress.level = Math.floor(progress.totalXP / 500) + 1;

  // Recalculate unit progress based on completed topics
  course.units.forEach(unit => {
    const completedInUnit = unit.topics.filter(t => progress.completedTopics.includes(t.topicId)).length;
    progress.unitProgress[unit.unitId] = {
      completionPercentage: unit.topics.length > 0 ? Math.round((completedInUnit / unit.topics.length) * 100) : 0,
    };
  });

  // Create quiz result
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
    unitScores: {}, // Default to empty object
  };

  // If comprehensive quiz, calculate unit-specific scores
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

  saveProgress(firestore, userId, progress);
  return progress;
}


/**
 * Resets comprehensive quiz progress for a specific mode.
 * @param {Firestore} firestore - The Firestore instance.
 * @param {string} userId - The user ID.
 * @param {string} courseId - The course ID.
 * @param {QuizMode} mode - The quiz mode to reset.
 */
export async function resetComprehensiveQuizModeProgress(firestore: any, userId: string, courseId: string, mode: QuizMode) {
  const progress = await getProgress(firestore, userId, courseId);
  progress.quizHistory = progress.quizHistory.filter(
    result => !(result.topicId === 'all' && result.mode === mode)
  );
  saveProgress(firestore, userId, progress);
}

/**
 * Gathers all MCQs from a course to be used in comprehensive quizzes.
 * This is a helper function that was previously in course-parser.
 * @param {Course} course - The course object.
 * @returns {MCQ[]} An array of all MCQs.
 */
function getAllMCQs(course: Course) {
    const allMCQs: any[] = [];
    course.units.forEach(unit => {
        unit.topics.forEach(topic => {
            allMCQs.push(...topic.mcqs);
        });
    });
    return allMCQs;
}

/**
 * Gets overall stats for a user.
 * @param {Firestore} firestore - The Firestore instance.
 * @param {string} userId - The user ID.
 * @returns {Promise<any>} An object with overall stats.
 */
export async function getOverallStats(firestore: any, userId:string) {
  const courses = await getCourses(firestore, userId);
  let totalQuizzes = 0;
  let totalXP = 0;
  
  for (const course of courses) {
    const progress = await getProgress(firestore, userId, course.courseId);
    totalQuizzes += progress.quizHistory.length;
    totalXP += progress.totalXP;
  }
  
  return { totalCourses: courses.length, totalQuizzes, totalXP };
}
