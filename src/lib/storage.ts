import { Course, CourseProgress, QuizResult, QuizMode } from './types';
import { db } from './idb';
import { getTopicById } from './course-parser';

const PROGRESS_STORAGE_KEY = 'mcq_course_progress';

/**
 * Saves a Course object to IndexedDB.
 * @param {Course} course - The course to save.
 * @returns {Promise<void>}
 */
export async function saveCourse(course: Course): Promise<void> {
  await db.courses.put(course);
}

/**
 * Retrieves all courses from IndexedDB.
 * @returns {Promise<Course[]>} A promise that resolves to an array of courses.
 */
export async function getCourses(): Promise<Course[]> {
  return await db.courses.toArray();
}

/**
 * Retrieves a single course by its ID from IndexedDB.
 * @param {string} courseId - The ID of the course to retrieve.
 * @returns {Promise<Course | undefined>} The found course, or undefined.
 */
export async function getCourse(courseId: string): Promise<Course | undefined> {
  return await db.courses.get(courseId);
}

/**
 * Deletes a course from IndexedDB and its associated progress from localStorage.
 * @param {string} courseId - The ID of the course to delete.
 * @returns {Promise<void>}
 */
export async function deleteCourse(courseId: string): Promise<void> {
  await db.courses.delete(courseId);
  deleteProgress(courseId);
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
    currentStreak: 0,
    lastStudyDate: '',
    quizHistory: [],
    level: 1,
  };
}

/**
 * Retrieves the progress for a specific course from localStorage.
 * If no progress is found, it initializes a new one.
 * It also handles migrating old progress objects to include new fields.
 * @param {string} courseId - The ID of the course.
 * @returns {CourseProgress} The user's progress object.
 */
export function getProgress(courseId: string): CourseProgress {
  if (typeof window === 'undefined') return initProgress(courseId);
  const stored = localStorage.getItem(`${PROGRESS_STORAGE_KEY}_${courseId}`);
  if (!stored) return initProgress(courseId);
  
  const progress = JSON.parse(stored);
  
  // Migration for older progress objects that might be missing new fields
  if (!progress.level) {
    progress.level = Math.floor(progress.totalXP / 500) + 1;
  }

  return progress;
}

/**
 * Saves a progress object to localStorage.
 * @param {CourseProgress} progress - The progress object to save.
 */
export function saveProgress(progress: CourseProgress): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`${PROGRESS_STORAGE_KEY}_${progress.courseId}`, JSON.stringify(progress));
}

/**
 * Deletes the progress for a specific course from localStorage.
 * @param {string} courseId - The ID of the course whose progress should be deleted.
 */
export function deleteProgress(courseId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(`${PROGRESS_STORAGE_KEY}_${courseId}`);
}

/**
 * Resets the progress for a specific course to its initial state.
 * @param {string} courseId - The ID of the course whose progress should be reset.
 * @returns {CourseProgress} The new, initial progress object.
 */
export function resetProgress(courseId: string): CourseProgress {
  const newProgress = initProgress(courseId);
  saveProgress(newProgress);
  return newProgress;
}


/**
 * Updates the user's progress after they complete a quiz.
 * This function handles XP, streaks, levels, and quiz history.
 * @param {string} courseId - The course ID.
 * @param {string} topicId - The topic ID of the completed quiz.
 * @param {string} topicTitle - The title of the topic.
 * @param {string} unitId - The parent unit ID of the topic.
 * @param {number} score - The number of correct answers.
 * @param {number} total - The total number of questions.
 * @param {(string|null)[]} answers - The user's answers.
 * @param {QuizMode} mode - The mode the quiz was taken in.
 * @param {number} timeSpent - The total time spent in seconds.
 * @returns {Promise<CourseProgress>} The updated progress object.
 */
export async function updateProgressAfterQuiz(
  courseId: string,
  topicId: string,
  topicTitle: string,
  unitId: string,
  score: number,
  total: number,
  answers: (string|null)[],
  mode: QuizMode,
  timeSpent: number
): Promise<CourseProgress> {
  const progress = getProgress(courseId);
  const course = await getCourse(courseId);
  if (!course) return progress;

  // For single-topic quizzes, mark as complete if score is 100%
  if (topicId !== 'all' && score === total && !progress.completedTopics.includes(topicId)) {
    progress.completedTopics.push(topicId);
  }
  
  const xpEarned = score * 10 + (score === total ? 50 : 0);
  progress.totalXP += xpEarned;
  progress.level = Math.floor(progress.totalXP / 500) + 1;
  
  // Recalculate all unit progresses based on completed topics
  course.units.forEach(unit => {
    if (!progress.unitProgress[unit.unitId]) {
        progress.unitProgress[unit.unitId] = {
            unitId: unit.unitId,
            completedTopics: [],
            totalTopics: unit.topics.length || 0,
            completionPercentage: 0,
            xpEarned: 0,
            accuracy: 0,
        };
    }
    const unitProgress = progress.unitProgress[unit.unitId];
    unitProgress.completedTopics = unit.topics
        .map(t => t.topicId)
        .filter(tid => progress.completedTopics.includes(tid));

    if (unitProgress.totalTopics > 0) {
        unitProgress.completionPercentage = Math.round(
            (unitProgress.completedTopics.length / unitProgress.totalTopics) * 100
        );
    }
  });
  
  // Update study streak
  const today = new Date().toDateString();
  if (progress.lastStudyDate !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (progress.lastStudyDate === yesterday.toDateString()) {
      progress.currentStreak++;
    } else {
      progress.currentStreak = 1;
    }
    progress.lastStudyDate = today;
  }

  // --- Create Quiz Result ---
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
    unitId,
  };

  // If comprehensive quiz, calculate per-unit scores
  if (topicId === 'all') {
    const allMCQs = course.units.flatMap(u => u.topics.flatMap(t => t.mcqs));
    const unitScores: Record<string, { score: number; total: number }> = {};
    
    // Initialize unitScores for all units
    course.units.forEach(unit => {
        unitScores[unit.unitId] = { score: 0, total: 0 };
    });

    answers.forEach((answer, index) => {
        const mcq = allMCQs[index];
        const parentUnit = course.units.find(u => u.topics.some(t => t.mcqs.some(m => m.questionId === mcq.questionId)));

        if (parentUnit) {
            unitScores[parentUnit.unitId].total++;
            if (answer === mcq.correct) {
                unitScores[parentUnit.unitId].score++;
            }
        }
    });
    quizResult.unitScores = unitScores;
  }

  progress.quizHistory.push(quizResult);
  
  saveProgress(progress);
  return progress;
}


/**
 * Calculates the overall completion percentage for a course.
 * @param {string} courseId - The ID of the course.
 * @returns {Promise<number>} The completion percentage (0-100).
 */
export async function getCourseCompletion(courseId: string): Promise<number> {
  const course = await getCourse(courseId);
  if (!course) return 0;
  
  const progress = getProgress(courseId);
  let totalTopics = 0;
  course.units.forEach(unit => {
    totalTopics += unit.topics.length;
  });
  
  if (totalTopics === 0) return 0;
  return Math.round((progress.completedTopics.length / totalTopics) * 100);
}

/**
 * Calculates overall statistics across all courses (total courses, quizzes, and XP).
 * @returns {Promise<{totalCourses: number, totalQuizzes: number, totalXP: number}>} An object with the overall stats.
 */
export async function getOverallStats() {
  if (typeof window === 'undefined') {
    return { totalCourses: 0, totalQuizzes: 0, totalXP: 0 };
  }
  const courses = await getCourses();
  const totalCourses = courses.length;
  let totalQuizzes = 0;
  let totalXP = 0;
  
  courses.forEach(course => {
    const progress = getProgress(course.courseId);
    totalQuizzes += progress.quizHistory.length;
    totalXP += progress.totalXP;
  });
  
  return { totalCourses, totalQuizzes, totalXP };
}

/**
 * Resets the comprehensive quiz progress for a specific mode.
 * @param {string} courseId - The ID of the course.
 * @param {QuizMode} mode - The quiz mode to reset.
 */
export function resetComprehensiveQuizModeProgress(courseId: string, mode: QuizMode) {
  const progress = getProgress(courseId);
  progress.quizHistory = progress.quizHistory.filter(
    result => !(result.topicId === 'all' && result.mode === mode)
  );
  saveProgress(progress);
}
