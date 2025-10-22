import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Quiz, UserAnswer, Unit, AllProgress } from '@/lib/types';

interface QuizState {
  quizzes: Quiz[];
  allProgress: AllProgress;
  activeQuizId: string | null;
  sessionAnswers: UserAnswer[];
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
        set((state) => ({
          sessionAnswers: [...state.sessionAnswers, answer],
        }));
      },

      finishSession: () => {
        const { activeQuizId, sessionAnswers, quizzes } = get();
        if (!activeQuizId) return;

        const activeQuiz = quizzes.find(q => q.id === activeQuizId);
        if (!activeQuiz) return;

        set(state => {
          const newAllProgress = JSON.parse(JSON.stringify(state.allProgress)); // Deep copy
          const currentQuizProgress = newAllProgress[activeQuizId] || {};

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
          newAllProgress[activeQuizId] = currentQuizProgress;
          return { allProgress: newAllProgress };
        });
      },
      
      toggleTimer: (enabled) => set({ isTimerEnabled: enabled }),

      resetProgress: (quizId, unitNumber) => {
        set(state => {
            const newProgress = { ...state.allProgress };
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
