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
  options: string[];
  correct: string;
  explanation?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  points?: number;
}

export interface CourseProgress {
  courseId: string;
  completedTopics: string[];
  unitProgress: Record<string, UnitProgress>;
  totalXP: number;
  currentStreak: number;
  lastStudyDate: string;
  quizHistory: QuizResult[];
  badges: Badge[];
  level: number;
}

export interface UnitProgress {
  unitId: string;
  completedTopics: string[];
  totalTopics: number;
  completionPercentage: number;
  xpEarned: number;
  accuracy: number;
}

export interface QuizResult {
  topicId: string;
  topicTitle: string;
  score: number;
  total: number;
  percentage: number;
  answers: string[];
  completedAt: string;
  mode: 'study' | 'test' | 'practice' | 'timed';
  timeSpent: number;
  unitId: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedAt?: string;
}

export type QuizMode = 'study' | 'test' | 'practice' | 'timed';

export interface QuizState {
  currentIndex: number;
  score: number;
  answers: string[];
  startTime: number;
  finished: boolean;
  mode: QuizMode;
  timePerQuestion?: number;
}
