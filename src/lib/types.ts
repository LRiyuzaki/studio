import type { PersonalizedStudySuggestionsOutput as AIOutput } from '@/ai/flows/personalized-study-suggestions';

export type Option = {
  id: string;
  text: string;
  is_correct: boolean;
};

export type StudyUnitInfo = {
  number: number;
  name: string;
};

export type Question = {
  question_id: string;
  topic: string;
  question_text: string;
  options: Option[];
  correct_answer: string;
  study_unit: StudyUnitInfo;
  explanation: string;
};

export type Unit = {
  unitNumber: number;
  unitName: string;
  questions: Question[];
  totalQuestions: number;
};

export type Quiz = {
  id: string;
  name: string;
  questions: Question[];
  units: Unit[];
};

export type PerformanceData = {
  studyUnit: {
    number: number;
    name: string;
  };
  questionsAttempted: number;
  questionsCorrect: number;
  accuracy: number;
  averageResponseTime: number; // in seconds
};

export type SessionResult = {
  totalQuestions: number;
  attemptedQuestions: number;
  correctAnswers: number;
  accuracy: number;
  totalXP: number;
  performanceByUnit: PerformanceData[];
};

export type UserAnswer = {
  questionId: string;
  selectedOptionId: string;
  isCorrect: boolean;
  responseTime: number; // in ms
};

export type PersonalizedStudySuggestionsOutput = AIOutput;
