'use server';
import { z } from 'zod';
import type { PersonalizedStudySuggestionsOutput as AIOutput } from '@/ai/flows/personalized-study-suggestions';
import { QuizSchema } from '@/schemas/QuizSchema';


// Infer the Quiz type from the Zod schema
export type Quiz = z.infer<typeof QuizSchema> & {
    // Frontend-specific properties can be added here if needed
    units: Unit[];
    ownerId?: string;
};

export type Question = Quiz['questions'][0];
export type Option = Question['options'][0];
export type StudyUnitInfo = Question['study_unit'];

export type Unit = {
  unitNumber: number;
  unitName: string;
  questions: Question[];
  totalQuestions: number;
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
  performanceByUnit: PerformanceData[];
  totalXp: number;
  newBadges: Achievement[];
};

export type UserAnswer = {
  questionId: string;
  selectedOptionId: string;
  isCorrect: boolean;
  responseTime: number; // in ms
};

export type QuizProgress = {
  answers: UserAnswer[];
  completion: number;
  accuracy: number;
  xp: number;
  streak: number;
  averageResponseTime?: number;
};

export type UnitProgress = {
  [unitNumber: number]: QuizProgress;
};

// Represents the structure for a single quiz's progress in Firestore
export type QuizProgressDocument = {
    [unitNumber: number]: QuizProgress;
}

// Represents all progress for a user, as stored in our Zustand store.
// The key is the quizId.
export type AllProgress = {
  [quizId: string]: UnitProgress;
};


export type PersonalizedStudySuggestionsOutput = AIOutput;


export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
}
