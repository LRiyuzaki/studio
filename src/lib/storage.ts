// lib/storage.ts
import { Course, CourseProgress, QuizResult, UnitProgress } from './types';

const STORAGE_KEYS = {
  COURSES: 'mcq_courses',
  PROGRESS: 'mcq_course_progress',
};

// Save course to localStorage
export function saveCourse(course: Course): void {
  if (typeof window === 'undefined') return;
  
  const courses = getCourses();
  const existingIndex = courses.findIndex(c => c.courseId === course.courseId);
  
  if (existingIndex >= 0) {
    courses[existingIndex] = course;
  } else {
    courses.push(course);
  }
  
  localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(courses));
}

// Get all courses
export function getCourses(): Course[] {
  if (typeof window === 'undefined') return [];
  
  const stored = localStorage.getItem(STORAGE_KEYS.COURSES);
  return stored ? JSON.parse(stored) : [];
}

// Get single course
export function getCourse(courseId: string): Course | null {
  const courses = getCourses();
  return courses.find(c => c.courseId === courseId) || null;
}

// Delete course
export function deleteCourse(courseId: string): void {
  if (typeof window === 'undefined') return;
  
  const courses = getCourses().filter(c => c.courseId !== courseId);
  localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(courses));
  
  // Also delete progress
  deleteProgress(courseId);
}

// Initialize progress for a course
export function initProgress(courseId: string): CourseProgress {
  return {
    courseId,
    completedTopics: [],
    unitProgress: {},
    totalXP: 0,
    currentStreak: 0,
    lastStudyDate: '',
    quizHistory: [],
  };
}

// Get course progress
export function getProgress(courseId: string): CourseProgress {
  if (typeof window === 'undefined') return initProgress(courseId);
  
  const stored = localStorage.getItem(`${STORAGE_KEYS.PROGRESS}_${courseId}`);
  return stored ? JSON.parse(stored) : initProgress(courseId);
}

// Save progress
export function saveProgress(progress: CourseProgress): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`${STORAGE_KEYS.PROGRESS}_${progress.courseId}`, JSON.stringify(progress));
}

// Delete progress
export function deleteProgress(courseId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(`${STORAGE_KEYS.PROGRESS}_${courseId}`);
}

// Update progress after quiz completion
export function updateProgressAfterQuiz(
  courseId: string,
  topicId: string,
  topicTitle: string,
  unitId: string,
  score: number,
  total: number,
  answers: string[],
  mode: 'study' | 'test' | 'practice',
  timeSpent: number
): CourseProgress {
  const progress = getProgress(courseId);
  
  // Add to completed topics if not already completed
  if (!progress.completedTopics.includes(topicId)) {
    progress.completedTopics.push(topicId);
  }
  
  // Calculate XP: 10 per correct + bonus for perfect score
  const xpEarned = score * 10 + (score === total ? 50 : 0);
  progress.totalXP += xpEarned;
  
  // Update unit progress
  if (!progress.unitProgress[unitId]) {
    const course = getCourse(courseId);
    const unit = course?.units.find(u => u.unitId === unitId);
    progress.unitProgress[unitId] = {
      unitId,
      completedTopics: [],
      totalTopics: unit?.topics.length || 0,
      completionPercentage: 0,
      xpEarned: 0,
    };
  }
  
  const unitProgress = progress.unitProgress[unitId];
  if (!unitProgress.completedTopics.includes(topicId)) {
    unitProgress.completedTopics.push(topicId);
  }
  unitProgress.completionPercentage = Math.round(
    (unitProgress.completedTopics.length / unitProgress.totalTopics) * 100
  );
  unitProgress.xpEarned += xpEarned;
  
  // Update streak
  const today = new Date().toDateString();
  if (progress.lastStudyDate === today) {
    // Same day, streak continues
  } else {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (progress.lastStudyDate === yesterday.toDateString()) {
      progress.currentStreak++;
    } else {
      progress.currentStreak = 1;
    }
  }
  progress.lastStudyDate = today;
  
  // Add to quiz history
  const quizResult: QuizResult = {
    topicId,
    topicTitle,
    score,
    total,
    percentage: Math.round((score / total) * 100),
    answers,
    completedAt: new Date().toISOString(),
    mode,
    timeSpent,
  };
  progress.quizHistory.push(quizResult);
  
  saveProgress(progress);
  return progress;
}

// Calculate overall course completion
export function getCourseCompletion(courseId: string): number {
  const course = getCourse(courseId);
  if (!course) return 0;
  
  const progress = getProgress(courseId);
  
  let totalTopics = 0;
  course.units.forEach(unit => {
    totalTopics += unit.topics.length;
  });
  
  if (totalTopics === 0) return 0;
  
  return Math.round((progress.completedTopics.length / totalTopics) * 100);
}
