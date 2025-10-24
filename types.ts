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
  questionId: string | number;
  question: string;
  options: string[];
  correct: string;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  firstAttemptRate: number | null;
  originalDifficulty: number;
  topicTitle?: string;
}

export interface RawQuestion {
  question_id: string | number;
  topic: string;
  question_text: string;
  options: { id: string, text: string }[];
  correct_answer: string;
  explanation?: string;
  difficulty?: number;
  first_attempt_rate?: number;
  study_unit: {
    number: number;
    name: string;
  };
}

export interface RawQuestionsFile {
  questions: RawQuestion[];
}

export interface CourseProgress {
  completedTopics: string[];
  totalXP: number;
  currentStreak: number;
  lastStudyDate: string | null;
  quizHistory: QuizHistoryItem[];
}

export interface QuizHistoryItem {
  topicId: string;
  topicTitle: string;
  score: number;
  total: number;
  percentage: number;
  completedAt: string;
  xpEarned: number;
  mode: 'topic' | 'unit' | 'all';
}

export interface ProgressData {
  [courseId: string]: CourseProgress;
}

export interface QuizState {
  questions: MCQ[];
  currentIndex: number;
  answers: (string | null)[];
  startTime: number;
  mode: 'topic' | 'unit' | 'all';
  topicId: string;
  topicTitle: string;
  isComplete: boolean;
  correctCount: number;
  wrongCount: number;
}

export interface QuizResults {
  correctAnswers: number;
  totalQuestions: number;
  percentage: number;
  xpEarned: number;
  review: {
    question: string;
    userAnswer: string | null;
    correctAnswer: string;
    isCorrect: boolean;
    explanation: string;
  }[];
}

export type PracticeMode = 'by-topic' | 'by-unit' | 'all-shuffled';

export interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string;
}
