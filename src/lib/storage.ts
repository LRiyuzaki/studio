// lib/storage.ts
import { Course, CourseProgress, QuizResult, Badge, QuizMode } from './types';
import { db } from './idb';

const PROGRESS_STORAGE_KEY = 'mcq_course_progress';

export async function saveCourse(course: Course): Promise<void> {
  await db.courses.put(course);
}

export async function getCourses(): Promise<Course[]> {
  return await db.courses.toArray();
}

export async function getCourse(courseId: string): Promise<Course | undefined> {
  return await db.courses.get(courseId);
}

export async function deleteCourse(courseId: string): Promise<void> {
  await db.courses.delete(courseId);
  deleteProgress(courseId);
}

function getDefaultBadges(): Badge[] {
  return [
    { id: 'first_quiz', name: 'First Steps', description: 'Complete your first quiz', icon: '🎯', earned: false },
    { id: 'perfect_score', name: 'Perfectionist', description: 'Score 100% on a quiz', icon: '💯', earned: false },
    { id: 'streak_7', name: 'Week Warrior', description: '7-day streak', icon: '🔥', earned: false },
    { id: 'level_10', name: 'Expert Learner', description: 'Reach level 10', icon: '⭐', earned: false },
    { id: 'course_complete', name: 'Course Master', description: 'Complete all topics in a course', icon: '🏆', earned: false },
    { id: 'speed_demon', name: 'Speed Demon', description: 'Complete a quiz with an average of <30s per question', icon: '⚡', earned: false },
  ];
}

export function initProgress(courseId: string): CourseProgress {
  return {
    courseId,
    completedTopics: [],
    unitProgress: {},
    totalXP: 0,
    currentStreak: 0,
    lastStudyDate: '',
    quizHistory: [],
    badges: getDefaultBadges(),
    level: 1,
  };
}

export function getProgress(courseId: string): CourseProgress {
  if (typeof window === 'undefined') return initProgress(courseId);
  const stored = localStorage.getItem(`${PROGRESS_STORAGE_KEY}_${courseId}`);
  if (!stored) return initProgress(courseId);
  
  const progress = JSON.parse(stored);
  
  if (!progress.badges) {
    progress.badges = getDefaultBadges();
  }
  if (!progress.level) {
    progress.level = Math.floor(progress.totalXP / 500) + 1;
  }

  return progress;
}

export function saveProgress(progress: CourseProgress): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`${PROGRESS_STORAGE_KEY}_${progress.courseId}`, JSON.stringify(progress));
}

export function deleteProgress(courseId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(`${PROGRESS_STORAGE_KEY}_${courseId}`);
}

async function checkBadges(progress: CourseProgress, course: Course): Promise<Badge[]> {
  const totalTopics = course.units.reduce((sum, unit) => sum + unit.topics.length, 0);

  return progress.badges.map(badge => {
    if (badge.earned) return badge;
    
    let shouldEarn = false;
    
    switch (badge.id) {
      case 'first_quiz':
        shouldEarn = progress.quizHistory.length >= 1;
        break;
      case 'perfect_score':
        shouldEarn = progress.quizHistory.some(q => q.percentage === 100);
        break;
      case 'streak_7':
        shouldEarn = progress.currentStreak >= 7;
        break;
      case 'level_10':
        shouldEarn = progress.level >= 10;
        break;
      case 'course_complete':
        shouldEarn = progress.completedTopics.length >= totalTopics && totalTopics > 0;
        break;
      case 'speed_demon':
        shouldEarn = progress.quizHistory.some(q => q.total > 0 && q.timeSpent / q.total < 30);
        break;
    }
    
    if (shouldEarn) {
      return { ...badge, earned: true, earnedAt: new Date().toISOString() };
    }
    return badge;
  });
}

export async function updateProgressAfterQuiz(
  courseId: string,
  topicId: string,
  topicTitle: string,
  unitId: string,
  score: number,
  total: number,
  answers: string[],
  mode: QuizMode,
  timeSpent: number
): Promise<CourseProgress> {
  const progress = getProgress(courseId);
  const course = await getCourse(courseId);
  if (!course) return progress;
  
  if (score === total && !progress.completedTopics.includes(topicId)) {
    progress.completedTopics.push(topicId);
  }
  
  const xpEarned = score * 10 + (score === total ? 50 : 0);
  progress.totalXP += xpEarned;
  progress.level = Math.floor(progress.totalXP / 500) + 1;
  
  if (!progress.unitProgress[unitId]) {
    const unit = course.units.find(u => u.unitId === unitId);
    progress.unitProgress[unitId] = {
      unitId,
      completedTopics: [],
      totalTopics: unit?.topics.length || 0,
      completionPercentage: 0,
      xpEarned: 0,
      accuracy: 0,
    };
  }
  
  const unitProgress = progress.unitProgress[unitId];
  if (score === total && !unitProgress.completedTopics.includes(topicId)) {
    unitProgress.completedTopics.push(topicId);
  }
  if (unitProgress.totalTopics > 0) {
    unitProgress.completionPercentage = Math.round(
      (unitProgress.completedTopics.length / unitProgress.totalTopics) * 100
    );
  }
  unitProgress.xpEarned += xpEarned;
  
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
  progress.quizHistory.push(quizResult);
  
  progress.badges = await checkBadges(progress, course);
  
  saveProgress(progress);
  return progress;
}

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

export async function getOverallStats() {
  if (typeof window === 'undefined') {
    return { totalCourses: 0, totalQuizzes: 0, totalXP: 0 };
  }
  const courses = await getCourses();
  let totalCourses = courses.length;
  let totalQuizzes = 0;
  let totalXP = 0;
  
  courses.forEach(course => {
    const progress = getProgress(course.courseId);
    totalQuizzes += progress.quizHistory.length;
    totalXP += progress.totalXP;
  });
  
  return { totalCourses, totalQuizzes, totalXP };
}
