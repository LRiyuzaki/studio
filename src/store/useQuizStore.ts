
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AllProgress, UserAnswer, Quiz } from '@/lib/types';

interface QuizState {
  quizzes: Quiz[];
  setQuizzes: (quizzes: Quiz[]) => void;
  progress: AllProgress;
  setProgress: (progress: AllProgress) => void;
  answers: { [key: string]: { [key: string]: string } };
  setAnswer: (quizId: string, unitId: number, questionId: string, selectedOption: string) => void;
  initializeUnit: (quizId: string, unitId: number, totalQuestions: number) => void;
}

export const useQuizStore = create<QuizState>()(
  persist(
    (set, get) => ({
      quizzes: [],
      setQuizzes: (quizzes) => set({ quizzes }),
      progress: {},
      setProgress: (progress) => set({ progress }),
      answers: {},
      setAnswer: (quizId, unitId, questionId, selectedOption) => {
        const currentAnswers = get().answers[unitId] || {};
        const updatedAnswers = { ...currentAnswers, [questionId]: selectedOption };

        const total = Object.keys(updatedAnswers).length;
        set(state => ({
          answers: { ...state.answers, [unitId]: updatedAnswers },
          progress: {
            ...state.progress,
            [quizId]: {
              ...state.progress[quizId],
              [unitId]: {
                ...state.progress[quizId]?.[unitId],
                completion: (total / (state.progress[quizId]?.[unitId]?.total || 1)) * 100,
              },
            },
          },
        }));
      },
      initializeUnit: (quizId, unitId, totalQuestions) => {
        const { progress } = get();
        if (!progress[quizId] || !progress[quizId][unitId]) {
          set(state => ({
            progress: {
              ...state.progress,
              [quizId]: {
                ...state.progress[quizId],
                [unitId]: {
                  answers: [],
                  completion: 0,
                  accuracy: 0,
                  total: totalQuestions,
                },
              },
            },
          }));
        }
      },
    }),
    { name: 'quiz-progress-storage' }
  )
);
