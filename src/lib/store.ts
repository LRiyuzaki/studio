'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Quiz, UserAnswer, AllProgress, UnitProgress, Achievement } from '@/lib/types';

const XP_PER_CORRECT_ANSWER = 10;
const STREAK_BONUS_THRESHOLD = 3;
const STREAK_BONUS_XP = 5;

interface QuizState {
  quizzes: Quiz[];
  allProgress: AllProgress;
  activeQuizId: string | null;
  isTimerEnabled: boolean;
  achievements: Achievement[];
  setQuizzes: (quizzes: Quiz[]) => void;
  setAllProgress: (progress: AllProgress) => void;
  deleteQuizFromState: (quizId: string) => void;
  setActiveQuizId: (quizId: string | null) => void;
  setAnswer: (questionId: string, selectedOptionId: string, isCorrect: boolean, responseTime: number) => void;
  getCurrentProgressForQuiz: () => UnitProgress | null;
  toggleTimer: (enabled: boolean) => void;
  clearLocalData: () => void;
  addAchievement: (achievement: Achievement) => void;
}

export const useQuizStore = create<QuizState>()(
  persist(
    (set, get) => ({
      quizzes: [],
      allProgress: {},
      activeQuizId: null,
      isTimerEnabled: false,
      achievements: [],

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
        if (!question || !question.study_unit) return;

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
            quizProgress[unitNum] = { answers: [], completion: 0, accuracy: 0, xp: 0, streak: 0 };
          }
          const unitProgress = quizProgress[unitNum];

          // Add or update the answer
          const existingAnswerIndex = unitProgress.answers.findIndex((a: UserAnswer) => a.questionId === questionId);
          if (existingAnswerIndex > -1) {
            // If re-answering, remove old XP before recalculating
            const oldAnswer = unitProgress.answers[existingAnswerIndex];
            if (oldAnswer.isCorrect) {
                unitProgress.xp -= XP_PER_CORRECT_ANSWER;
            }
            unitProgress.answers[existingAnswerIndex] = newAnswer;
          } else {
            unitProgress.answers.push(newAnswer);
          }
          
          // Update streak and XP
          if (isCorrect) {
              unitProgress.streak = (unitProgress.streak || 0) + 1;
              let earnedXp = XP_PER_CORRECT_ANSWER;
              if (unitProgress.streak >= STREAK_BONUS_THRESHOLD) {
                  earnedXp += STREAK_BONUS_XP;
              }
              unitProgress.xp = (unitProgress.xp || 0) + earnedXp;
          } else {
              unitProgress.streak = 0;
          }

          // Recalculate metrics
          const correctCount = unitProgress.answers.filter((a: UserAnswer) => a.isCorrect).length;
          unitProgress.completion = (unitProgress.answers.length / unit.totalQuestions) * 100;
          unitProgress.accuracy = unitProgress.answers.length > 0 ? (correctCount / unitProgress.answers.length) * 100 : 0;

          return { allProgress: newAllProgress };
        });
      },

      getCurrentProgressForQuiz: () => {
        const { activeQuizId, allProgress } = get();
        if (!activeQuizId) return null;
        return allProgress[activeQuizId] || {};
      },
      
      toggleTimer: (enabled) => set({ isTimerEnabled: enabled }),

      clearLocalData: () => set({ quizzes: [], allProgress: {}, activeQuizId: null, achievements: [] }),

      addAchievement: (achievement) => set(state => ({ achievements: [...state.achievements, achievement] })),
    }),
    {
      name: 'quiz-app-storage', // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
      partialize: (state) => ({
        allProgress: state.allProgress,
        activeQuizId: state.activeQuizId,
        isTimerEnabled: state.isTimerEnabled,
        achievements: state.achievements,
      }),
    }
  )
);
