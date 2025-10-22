'use client';

import { create } from 'zustand';
import type { Quiz, UserAnswer, AllProgress, UnitProgress } from '@/lib/types';
import { useUser } from '@/firebase';

interface QuizState {
  quizzes: Quiz[];
  allProgress: AllProgress;
  activeQuizId: string | null;
  sessionAnswers: UserAnswer[];
  isTimerEnabled: boolean;
  setQuizzes: (quizzes: Quiz[]) => void;
  setAllProgress: (progress: AllProgress) => void;
  deleteQuizFromState: (quizId: string) => void;
  setActiveQuizId: (quizId: string | null) => void;
  startSession: (quizId: string) => void;
  addSessionAnswer: (answer: UserAnswer) => void;
  getSessionProgressForQuiz: () => UnitProgress | null;
  toggleTimer: (enabled: boolean) => void;
  clearLocalData: () => void;
}

export const useQuizStore = create<QuizState>((set, get) => ({
  quizzes: [],
  allProgress: {},
  activeQuizId: null,
  sessionAnswers: [],
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

  startSession: (quizId) => {
    set({ activeQuizId: quizId, sessionAnswers: [] });
  },
  
  addSessionAnswer: (answer) => {
    set((state) => ({
      sessionAnswers: [...state.sessionAnswers, answer],
    }));
  },

  getSessionProgressForQuiz: () => {
    const { activeQuizId, sessionAnswers, quizzes, allProgress } = get();
    if (!activeQuizId) return null;

    const activeQuiz = quizzes.find(q => q.id === activeQuizId);
    if (!activeQuiz) return null;
    
    // Create a deep copy to ensure immutability and trigger re-renders
    const currentQuizProgress = JSON.parse(JSON.stringify(allProgress[activeQuizId] || {}));

    const sessionAnswersByUnit = sessionAnswers.reduce((acc, answer) => {
        const question = activeQuiz.questions.find(q => q.question_id === answer.questionId);
        if (question) {
            const unitNum = question.study_unit.number;
            if (!acc[unitNum]) acc[unitNum] = [];
            acc[unitNum].push(answer);
        }
        return acc;
    }, {} as {[key: number]: UserAnswer[]});

    for (const unitNumStr in sessionAnswersByUnit) {
        const unitNum = parseInt(unitNumStr);
        const unit = activeQuiz.units.find(u => u.unitNumber === unitNum);

        if (unit) {
            const existingUnitProgress = currentQuizProgress[unitNum] || { answers: [], completion: 0, accuracy: 0 };
            const existingAnswerIds = new Set(existingUnitProgress.answers.map((a: UserAnswer) => a.questionId));
            
            const newUniqueAnswers = sessionAnswersByUnit[unitNum].filter(a => !existingAnswerIds.has(a.questionId));

            if (newUniqueAnswers.length > 0) {
                const mergedAnswers = [...existingUnitProgress.answers, ...newUniqueAnswers];
                const correctCount = mergedAnswers.filter(a => a.isCorrect).length;
                const totalQuestionsInUnit = unit.totalQuestions;

                currentQuizProgress[unitNum] = {
                    answers: mergedAnswers,
                    completion: (mergedAnswers.length / totalQuestionsInUnit) * 100,
                    accuracy: mergedAnswers.length > 0 ? (correctCount / mergedAnswers.length) * 100 : 0,
                };
            }
        }
    }
    return currentQuizProgress;
  },
  
  toggleTimer: (enabled) => set({ isTimerEnabled: enabled }),

  clearLocalData: () => set({ quizzes: [], allProgress: {}, activeQuizId: null }),

}));
