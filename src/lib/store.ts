'use client';

import { create } from 'zustand';
import type { Quiz, UserAnswer, AllProgress, UnitProgress } from '@/lib/types';

interface QuizState {
  quizzes: Quiz[];
  allProgress: AllProgress;
  activeQuizId: string | null;
  isTimerEnabled: boolean;
  setQuizzes: (quizzes: Quiz[]) => void;
  setAllProgress: (progress: AllProgress) => void;
  deleteQuizFromState: (quizId: string) => void;
  setActiveQuizId: (quizId: string | null) => void;
  setAnswer: (questionId: string, selectedOptionId: string, isCorrect: boolean, responseTime: number) => void;
  getCurrentProgressForQuiz: () => UnitProgress | null;
  toggleTimer: (enabled: boolean) => void;
  clearLocalData: () => void;
}

export const useQuizStore = create<QuizState>((set, get) => ({
  quizzes: [],
  allProgress: {},
  activeQuizId: null,
  isTimerEnabled: false,

  setQuizzes: (quizzes) => set({ quizzes }),

  setAllProgress: (progress) => set({ allProgress: progress }),
  
  deleteQuizFromState: (quizId) => {
    set((state) => {
      const newQuizzes = state.quizzes.filter((q) => q.id !== quizId);
      const newProgress = { ...state.allProgress };
      delete newProgress[quizId];
      return {
        quizzes: newQuizzes,
        allProgress: newProgress,
        activeQuizId: state.activeQuizId === quizId ? null : state.activeQuizId,
      };
    });
  },

  setActiveQuizId: (quizId) => set({ activeQuizId: quizId }),

  setAnswer: (questionId, selectedOptionId, isCorrect, responseTime) => {
    const { activeQuizId, quizzes, allProgress } = get();
    if (!activeQuizId) return;

    const activeQuiz = quizzes.find(q => q.id === activeQuizId);
    if (!activeQuiz) return;

    const question = activeQuiz.questions.find(q => q.question_id === questionId);
    if (!question) return;

    const unitNum = question.study_unit.number;
    const unit = activeQuiz.units.find(u => u.unitNumber === unitNum);
    if (!unit) return;

    const newAnswer: UserAnswer = { questionId, selectedOptionId, isCorrect, responseTime };

    set(state => {
      // Deep copy to ensure no direct mutation
      const newAllProgress = JSON.parse(JSON.stringify(state.allProgress));
      
      if (!newAllProgress[activeQuizId]) {
        newAllProgress[activeQuizId] = {};
      }
      const quizProgress = newAllProgress[activeQuizId];

      if (!quizProgress[unitNum]) {
        quizProgress[unitNum] = { answers: [], completion: 0, accuracy: 0 };
      }
      const unitProgress = quizProgress[unitNum];

      // Add or update the answer
      const existingAnswerIndex = unitProgress.answers.findIndex((a: UserAnswer) => a.questionId === questionId);
      if (existingAnswerIndex > -1) {
        unitProgress.answers[existingAnswerIndex] = newAnswer;
      } else {
        unitProgress.answers.push(newAnswer);
      }
      
      // Recalculate metrics
      const correctCount = unitProgress.answers.filter((a: UserAnswer) => a.isCorrect).length;
      unitProgress.completion = (unitProgress.answers.length / unit.totalQuestions) * 100;
      unitProgress.accuracy = (correctCount / unitProgress.answers.length) * 100;

      return { allProgress: newAllProgress };
    });
  },

  getCurrentProgressForQuiz: () => {
    const { activeQuizId, allProgress } = get();
    if (!activeQuizId) return null;
    return allProgress[activeQuizId] || {};
  },
  
  toggleTimer: (enabled) => set({ isTimerEnabled: enabled }),

  clearLocalData: () => set({ quizzes: [], allProgress: {}, activeQuizId: null }),

}));