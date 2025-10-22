'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Quiz, UserAnswer, AllProgress } from '@/lib/types';

interface QuizState {
  quizzes: Quiz[];
  allProgress: AllProgress;
  activeQuizId: string | null;
  sessionAnswers: UserAnswer[]; // Kept for quiz-runner logic but not for final progress merge
  isTimerEnabled: boolean;
  addQuiz: (quiz: Quiz) => void;
  deleteQuiz: (quizId: string) => void;
  setActiveQuizId: (quizId: string | null) => void;
  startSession: (quizId: string) => void;
  addSessionAnswer: (answer: UserAnswer) => void;
  finishSession: () => void;
  toggleTimer: (enabled: boolean) => void;
  resetProgress: (quizId: string, unitNumber: number | 'all') => void;
}

export const useQuizStore = create<QuizState>()(
  persist(
    (set, get) => ({
      quizzes: [],
      allProgress: {},
      activeQuizId: null,
      sessionAnswers: [],
      isTimerEnabled: false,

      addQuiz: (quiz) => {
        set((state) => ({
          quizzes: [...state.quizzes, quiz],
        }));
      },

      deleteQuiz: (quizId) => {
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

      startSession: (quizId) => {
        set({ activeQuizId: quizId, sessionAnswers: [] });
      },
      
      addSessionAnswer: (answer) => {
        set((state) => {
          // Add answer to the current session
          const newSessionAnswers = [...state.sessionAnswers, answer];
          
          // Also directly update the allProgress state immutably
          const { activeQuizId, quizzes, allProgress } = state;
          if (!activeQuizId) return { sessionAnswers: newSessionAnswers };

          const activeQuiz = quizzes.find(q => q.id === activeQuizId);
          if (!activeQuiz) return { sessionAnswers: newSessionAnswers };

          const question = activeQuiz.questions.find(q => q.question_id === answer.questionId);
          if (!question) return { sessionAnswers: newSessionAnswers };

          const unitNum = question.study_unit.number;
          const unit = activeQuiz.units.find(u => u.unitNumber === unitNum);
          if (!unit) return { sessionAnswers: newSessionAnswers };

          // Deep clone for immutability
          const newAllProgress = JSON.parse(JSON.stringify(allProgress));
          const quizProgress = newAllProgress[activeQuizId] || {};
          const unitProgress = quizProgress[unitNum] || { answers: [], completion: 0, accuracy: 0 };
          
          // Add answer only if it's not already there
          const existingAnswerIndex = unitProgress.answers.findIndex((a: UserAnswer) => a.questionId === answer.questionId);
          if (existingAnswerIndex === -1) {
            unitProgress.answers.push(answer);
          } else {
            // Optional: update if you allow re-answering
            // unitProgress.answers[existingAnswerIndex] = answer;
          }

          const correctCount = unitProgress.answers.filter((a: UserAnswer) => a.isCorrect).length;
          const totalAnsweredInUnit = unitProgress.answers.length;
          const totalQuestionsInUnit = unit.totalQuestions;

          unitProgress.completion = (totalAnsweredInUnit / totalQuestionsInUnit) * 100;
          unitProgress.accuracy = totalAnsweredInUnit > 0 ? (correctCount / totalAnsweredInUnit) * 100 : 0;
          
          quizProgress[unitNum] = unitProgress;
          newAllProgress[activeQuizId] = quizProgress;

          return { 
            sessionAnswers: newSessionAnswers,
            allProgress: newAllProgress 
          };
        });
      },

      finishSession: () => {
        // This function is now simpler. The main logic is in addSessionAnswer.
        // We just clear the session.
        set({ sessionAnswers: [] });
      },
      
      toggleTimer: (enabled) => set({ isTimerEnabled: enabled }),

      resetProgress: (quizId, unitNumber) => {
        set(state => {
            const newProgress = JSON.parse(JSON.stringify(state.allProgress));
            if (newProgress[quizId]) {
              if (unitNumber === 'all') {
                  delete newProgress[quizId];
              } else if (newProgress[quizId][unitNumber]){
                  delete newProgress[quizId][unitNumber];
              }
            }
            return { allProgress: newProgress };
        });
      }
    }),
    {
      name: 'quizcraft-architect-storage', 
      storage: createJSONStorage(() => localStorage),
    }
  )
);
