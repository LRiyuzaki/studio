'use client';

import { create } from 'zustand';
import type { Quiz, UserAnswer, AllProgress, UnitProgress } from '@/lib/types';

interface QuizState {
  quizzes: Quiz[];
  allProgress: AllProgress;
  activeQuizId: string | null;
<<<<<<< HEAD
=======
  sessionAnswers: UserAnswer[]; // Kept for quiz-runner logic but not for final progress merge
>>>>>>> 7849063b14f3c5f108cbc395d1eb30f53a47e740
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
    if (!question || !question.study_unit) return;

    const unitNum = question.study_unit.number;
    const unit = activeQuiz.units.find(u => u.unitNumber === unitNum);
    if (!unit) return;

    const newAnswer: UserAnswer = { questionId, selectedOptionId, isCorrect, responseTime };

    set(state => {
      // Deep copy to ensure no direct mutation
      const newAllProgress = JSON.parse(JSON.stringify(state.allProgress));
      
<<<<<<< HEAD
      if (!newAllProgress[activeQuizId]) {
        newAllProgress[activeQuizId] = {};
=======
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
>>>>>>> 7849063b14f3c5f108cbc395d1eb30f53a47e740
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
