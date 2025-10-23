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

/**
 * Saves a Course object to Firestore.
 * @param {Firestore} firestore - The Firestore instance.
 * @param {Course} course - The course to save.
 * @param {string} userId - The ID of the user owning the course.
 */
export async function saveCourse(firestore: Firestore, course: Course, userId: string): Promise<void> {
  try {
    const courseWithMeta = { ...course, ownerId: userId, createdAt: new Date().toISOString() };
    const courseRef = doc(firestore, 'courses', course.courseId);
    await setDoc(courseRef, courseWithMeta);
  } catch (error) {
    console.error("Error saving course: ", error);
    // Optionally re-throw or handle the error in the UI
  }
}

/**
 * Retrieves all courses for a specific user from Firestore.
 * @param {Firestore} firestore - The Firestore instance.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<Course[]>} A promise that resolves to an array of courses.
 */
export async function getCourses(firestore: Firestore, userId: string): Promise<Course[]> {
  try {
    const coursesRef = collection(firestore, 'courses');
    const q = query(coursesRef, where('ownerId', '==', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as Course);
  } catch (error) {
    console.error("Error getting courses: ", error);
    return []; // Return empty array on error
  }
}

/**
 * Retrieves a single course by its ID from Firestore.
 * @param {Firestore} firestore - The Firestore instance.
 * @param {string} courseId - The ID of the course to retrieve.
 * @returns {Promise<Course | null>} The found course, or null.
 */
export async function getCourse(firestore: Firestore, courseId: string): Promise<Course | null> {
    try {
        const courseRef = doc(firestore, 'courses', courseId);
        const docSnap = await getDoc(courseRef);
        return docSnap.exists() ? (docSnap.data() as Course) : null;
    } catch (error) {
        console.error(`Error getting course ${courseId}: `, error);
        return null;
    }
}

/**
 * Deletes a course from Firestore.
 * @param {Firestore} firestore - The Firestore instance.
 * @param {string} courseId - The ID of the course to delete.
 */
export async function deleteCourse(firestore: Firestore, courseId: string): Promise<void> {
    try {
        const courseRef = doc(firestore, 'courses', courseId);
        await deleteDoc(courseRef);
    } catch (error) {
        console.error(`Error deleting course ${courseId}: `, error);
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
 * @param {Firestore} firestore - The Firestore instance.
 * @param {string} userId - The ID of the user.
 * @param {string} courseId - The ID of the course.
 * @returns {Promise<CourseProgress>} The user's progress object.
 */
export async function getProgress(firestore: Firestore, userId: string, courseId: string): Promise<CourseProgress> {
  try {
    const progressRef = doc(firestore, 'users', userId, 'progress', courseId);
    const docSnap = await getDoc(progressRef);
    if (docSnap.exists()) {
      return docSnap.data() as CourseProgress;
    }
    // If no progress exists, initialize and save it
    const newProgress = initProgress(courseId);
    await setDoc(progressRef, newProgress);
    return newProgress;
  } catch (error) {
    console.error(`Error getting progress for course ${courseId}: `, error);
    return initProgress(courseId); // Return default progress on error
  }
}

/**
 * Saves a progress object to Firestore for a given user.
 * @param {Firestore} firestore - The Firestore instance.
 * @param {string} userId - The ID of the user.
 * @param {CourseProgress} progress - The progress object to save.
 */
export async function saveProgress(firestore: Firestore, userId: string, progress: CourseProgress): Promise<void> {
  try {
    const progressRef = doc(firestore, 'users', userId, 'progress', progress.courseId);
    await setDoc(progressRef, progress, { merge: true });
  } catch (error) {
    console.error(`Error saving progress for course ${progress.courseId}: `, error);
  }
}

/**
 * Resets the progress for a specific course to its initial state in Firestore.
 */
export async function resetProgress(firestore: Firestore, userId: string, courseId: string): Promise<CourseProgress> {
  const newProgress = initProgress(courseId);
  try {
    const progressRef = doc(firestore, 'users', userId, 'progress', courseId);
    await setDoc(progressRef, newProgress);
  } catch (error) {
    console.error(`Error resetting progress for course ${courseId}: `, error);
  }
  return newProgress;
}

/**
 * Updates the user's progress after they complete a quiz.
 */
export async function updateProgressAfterQuiz(
  firestore: Firestore,
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

  await saveProgress(firestore, userId, progress);
  return progress;
}

/**
 * Resets comprehensive quiz progress for a specific mode.
 */
export async function resetComprehensiveQuizModeProgress(firestore: Firestore, userId: string, courseId: string, mode: QuizMode) {
  const progress = await getProgress(firestore, userId, courseId);
  progress.quizHistory = progress.quizHistory.filter(
    result => !(result.topicId === 'all' && result.mode === mode)
  );
  await saveProgress(firestore, userId, progress);
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
export async function getOverallStats(firestore: Firestore, userId:string) {
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
