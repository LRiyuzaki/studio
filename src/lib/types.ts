// lib/types.ts
export interface Course {
  courseId: string;
  courseTitle: string;
  courseDescription: string;
  units: Unit[];
  createdAt: string;
}

export interface Unit {
  unitId: string;
  unitTitle: string;
  unitDescription: string;
  topics: Topic[];
}

export interface Topic {
  topicId: string;
  topicTitle: string;
  topicDescription: string;
  mcqs: MCQ[];
}

export interface MCQ {
  questionId: string;
  question: string;
  options: string[]; // Must be 4 options
  correct: string; // A, B, C, or D
  explanation?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  points?: number;
}

export interface CourseProgress {
  courseId: string;
  completedTopics: string[]; // Array of topicIds
  unitProgress: Record<string, UnitProgress>; // unitId -> progress
  totalXP: number;
  currentStreak: number;
  lastStudyDate: string;
  quizHistory: QuizResult[];
}

export interface UnitProgress {
  unitId: string;
  completedTopics: string[];
  totalTopics: number;
  completionPercentage: number;
  xpEarned: number;
}

export interface QuizResult {
  topicId: string;
  topicTitle: string;
  score: number;
  total: number;
  percentage: number;
  answers: string[];
  completedAt: string;
  mode: 'study' | 'test' | 'practice';
  timeSpent: number; // seconds
}

export type QuizMode = 'study' | 'test' | 'practice';
