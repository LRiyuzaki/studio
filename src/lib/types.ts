/**
 * Represents an entire course, including its metadata and hierarchical content structure.
 */
export interface Course {
  courseId: string;
  courseTitle: string;
  courseDescription: string;
  units: Unit[];
  createdAt: string;
}

/**
 * Represents a single unit within a course. A unit contains multiple topics.
 */
export interface Unit {
  unitId: string;
  unitTitle: string;
  unitDescription: string;
  topics: Topic[];
}

/**
 * Represents a single topic within a unit. A topic contains multiple MCQs.
 */
export interface Topic {
  topicId: string;
  topicTitle: string;
  topicDescription: string;
  mcqs: MCQ[];
}

/**
 * Represents a single Multiple-Choice Question.
 */
export interface MCQ {
  questionId: string;
  question: string;
  options: string[];
  correct: string;
  explanation?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  points?: number;
}

/**
 * Tracks a user's progress throughout an entire course.
 */
export interface CourseProgress {
  courseId: string;
  completedTopics: string[];
  unitProgress: Record<string, UnitProgress>;
  totalXP: number;
  currentStreak: number;
  lastStudyDate: string;
  quizHistory: QuizResult[];
  level: number;
}

/**
 * Tracks a user's progress within a single unit.
 */
export interface UnitProgress {
  unitId: string;
  completedTopics: string[];
  totalTopics: number;
  completionPercentage: number;
  xpEarned: number;
  accuracy: number;
}

/**
 * Stores the result of a single quiz attempt.
 */
export interface QuizResult {
  topicId: string;
  topicTitle: string;
  score: number;
  total: number;
  percentage: number;
  answers: (string | null)[];
  completedAt: string;
  mode: QuizMode;
  timeSpent: number;
  unitId: string;
  unitScores?: Record<string, { score: number; total: number }>;
}

/**
 * Defines the available modes for taking a quiz.
 */
export type QuizMode = 'practice' | 'exam';

/**
 * Represents the state of an active quiz session.
 */
export interface QuizState {
  currentIndex: number;
  score: number;
  answers: (string | null)[];
  startTime: number;
  finished: boolean;
  mode: QuizMode;
  timePerQuestion?: number;
}
