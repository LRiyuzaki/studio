'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Quiz, Question, SessionResult, UserAnswer, AllProgress, UnitProgress } from '@/lib/types';
import Dashboard from '@/components/dashboard';
import QuizRunner from '@/components/quiz-runner';
import ResultsPage from '@/app/results-page';
import { useToast } from "@/hooks/use-toast";
import AddQuizDialog from '@/components/add-quiz-dialog';
import QuizLibrary from '@/components/quiz-library';
import { Settings, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type View = 'dashboard' | 'quiz' | 'results';

const APP_STORAGE_KEY = 'quizcraft_architect_progress';
const QUIZZES_STORAGE_KEY = 'quizcraft_architect_quizzes';

export default function Home() {
  const [view, setView] = useState<View>('dashboard');
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [activeQuizQuestions, setActiveQuizQuestions] = useState<Question[]>([]);
  const [activeQuizInitialAnswers, setActiveQuizInitialAnswers] = useState<UserAnswer[]>([]);
  const [sessionResult, setSessionResult] = useState<SessionResult | null>(null);
  const [isTimerEnabled, setIsTimerEnabled] = useState(false);
  const [allProgress, setAllProgress] = useState<AllProgress>({});
  const { toast } = useToast();
  
  // Centralized function to save all data
  const saveDataToLocalStorage = useCallback(() => {
    try {
      localStorage.setItem(QUIZZES_STORAGE_KEY, JSON.stringify(quizzes));
      localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(allProgress));
    } catch (error) {
      console.error("Failed to save data to localStorage", error);
      toast({
        variant: 'destructive',
        title: "Save Failed",
        description: "Could not save your progress to the browser's storage.",
      });
    }
  }, [quizzes, allProgress, toast]);

  // Load data from localStorage on initial render
  useEffect(() => {
    try {
      const savedQuizzes = localStorage.getItem(QUIZZES_STORAGE_KEY);
      if (savedQuizzes) {
        setQuizzes(JSON.parse(savedQuizzes));
      } else {
        // Initialize with empty array if nothing is in localStorage
        setQuizzes([]);
      }
      const savedProgress = localStorage.getItem(APP_STORAGE_KEY);
      if (savedProgress) {
        setAllProgress(JSON.parse(savedProgress));
      } else {
        setAllProgress({});
      }
    } catch (error) {
      console.error("Failed to load data from localStorage", error);
    }
  }, []);

  // Automatic saving whenever quizzes or progress change
  useEffect(() => {
    saveDataToLocalStorage();
  }, [quizzes, allProgress, saveDataToLocalStorage]);

  const handleManualSave = () => {
    saveDataToLocalStorage();
    toast({
      title: "Progress Saved!",
      description: "Your quizzes and progress have been saved.",
    });
  }

  const handleQuizAdded = (newQuiz: Quiz) => {
    setQuizzes(prev => [...prev, newQuiz]);
    toast({
      title: "Quiz Added!",
      description: `"${newQuiz.name}" is now in your library.`,
    });
  };

  const handleSelectQuiz = (quizId: string) => {
    const selectedQuiz = quizzes.find(q => q.id === quizId);
    if (selectedQuiz) {
      setActiveQuiz(selectedQuiz);
    }
  };

  const handleDeleteQuiz = (quizId: string) => {
    setQuizzes(prev => prev.filter(q => q.id !== quizId));
    setAllProgress(prev => {
        const newProgress = {...prev};
        delete newProgress[quizId];
        return newProgress;
    });
    toast({
        title: "Quiz Removed",
        description: `The quiz has been removed from your library.`,
    });
    if (activeQuiz?.id === quizId) {
      setActiveQuiz(null);
    }
  }
  
  const handleResetUnitProgress = (quizId: string, unitNumber: number | 'all') => {
      setAllProgress(prev => {
          const newProgress = {...prev};
          if (newProgress[quizId]) {
            if (unitNumber === 'all') {
                delete newProgress[quizId];
            } else if (newProgress[quizId][unitNumber]){
                delete newProgress[quizId][unitNumber];
            }
          }
          return newProgress;
      });
      toast({
          title: "Progress Reset",
          description: "Your progress for this unit has been cleared."
      })
  }

  const handleStartQuiz = (unitNumber: number | 'all', timerEnabled: boolean) => {
    if (!activeQuiz) return;
    
    let questionsForQuiz: Question[];
    let initialAnswers: UserAnswer[] = [];
    const quizProgress = allProgress[activeQuiz.id] || {};

    if (unitNumber === 'all') {
        questionsForQuiz = activeQuiz.questions;
        Object.values(quizProgress).forEach(unitProg => {
            initialAnswers.push(...unitProg.answers);
        });
    } else {
        const unit = activeQuiz.units.find(u => u.unitNumber === unitNumber);
        questionsForQuiz = unit ? unit.questions : [];
        initialAnswers = quizProgress[unitNumber]?.answers || [];
    }
    
    const answeredQuestionIds = new Set(initialAnswers.map(a => a.questionId));
    const firstUnansweredIndex = questionsForQuiz.findIndex(q => !answeredQuestionIds.has(q.question_id));
    const startingIndex = firstUnansweredIndex > -1 ? firstUnansweredIndex : 0;

    setActiveQuizQuestions(questionsForQuiz);
    setActiveQuizInitialAnswers(initialAnswers);
    setIsTimerEnabled(timerEnabled);
    setView('quiz');
  };
  
  const calculatePerformance = (answers: UserAnswer[], questions: Question[], activeQuiz: Quiz) => {
    const attemptedQuestions = answers.length;
    const correctAnswers = answers.filter(a => a.isCorrect).length;
    const accuracy = attemptedQuestions > 0 ? (correctAnswers / attemptedQuestions) * 100 : 0;

    const performanceByUnit = activeQuiz.units.map(unit => {
      const unitQuestionIds = new Set(unit.questions.map(q => q.question_id));
      const unitAnswers = answers.filter(a => unitQuestionIds.has(a.questionId));
      
      const unitAttempted = unitAnswers.length;
      const unitCorrect = unitAnswers.filter(a => a.isCorrect).length;
      const unitAccuracy = unitAttempted > 0 ? (unitCorrect / unitAttempted) * 100 : 0;
      const totalResponseTime = unitAnswers.reduce((sum, a) => sum + a.responseTime, 0);
      const averageResponseTime = unitAttempted > 0 ? (totalResponseTime / unitAttempted) / 1000 : 0;

      return {
        studyUnit: {
            number: unit.unitNumber,
            name: unit.unitName,
        },
        questionsAttempted: unitAttempted,
        questionsCorrect: unitCorrect,
        accuracy: parseFloat(unitAccuracy.toFixed(1)),
        averageResponseTime: parseFloat(averageResponseTime.toFixed(2)),
      };
    });

    const result: SessionResult = {
      totalQuestions: questions.length,
      attemptedQuestions,
      correctAnswers,
      accuracy: parseFloat(accuracy.toFixed(1)),
      performanceByUnit,
    };
    
    return result;
  }

  const handleQuizFinish = (finalAnswers: UserAnswer[]) => {
    if (!activeQuiz) return;
    
    const result = calculatePerformance(finalAnswers, activeQuizQuestions, activeQuiz);

    const answersByUnit = finalAnswers.reduce((acc, answer) => {
        const question = activeQuiz.questions.find(q => q.question_id === answer.questionId);
        if (question) {
            const unitNum = question.study_unit.number;
            if (!acc[unitNum]) acc[unitNum] = [];
            acc[unitNum].push(answer);
        }
        return acc;
    }, {} as {[key: number]: UserAnswer[]});

    const newQuizProgress: UnitProgress = {};
    for (const unitNumStr in answersByUnit) {
        const unitNum = parseInt(unitNumStr);
        const unitAnswers = answersByUnit[unitNum];
        const unit = activeQuiz.units.find(u => u.unitNumber === unitNum);
        if (unit) {
            const totalQuestions = unit.totalQuestions;
            const correctCount = unitAnswers.filter(a => a.isCorrect).length;
            
            // Get existing answers for this unit to merge, if any
            const existingAnswers = allProgress[activeQuiz.id]?.[unitNum]?.answers || [];
            const existingAnswerIds = new Set(existingAnswers.map(a => a.questionId));
            const newUniqueAnswers = unitAnswers.filter(a => !existingAnswerIds.has(a.questionId));
            const mergedAnswers = [...existingAnswers, ...newUniqueAnswers];
            
            const mergedCorrectCount = mergedAnswers.filter(a => a.isCorrect).length;

            newQuizProgress[unitNum] = {
                answers: mergedAnswers,
                completion: (mergedAnswers.length / totalQuestions) * 100,
                accuracy: mergedAnswers.length > 0 ? (mergedCorrectCount / mergedAnswers.length) * 100 : 0,
            };
        }
    }

    setAllProgress(prev => ({
        ...prev,
        [activeQuiz.id]: {
            ...prev[activeQuiz.id],
            ...newQuizProgress
        }
    }));
    
    setSessionResult(result);
    setView('results');
  };
  
  const handleGoToDashboard = () => {
    setView('dashboard');
    setActiveQuizQuestions([]);
    setSessionResult(null);
    setActiveQuizInitialAnswers([]);
  };
  
  const handleBackToLibrary = () => {
    setActiveQuiz(null);
    setActiveQuizQuestions([]);
    setSessionResult(null);
    setActiveQuizInitialAnswers([]);
    setView('dashboard');
  };
  
  const renderDashboard = () => {
    if (activeQuiz) {
      return (
        <Dashboard 
          quiz={activeQuiz} 
          onStartQuiz={handleStartQuiz} 
          onBack={handleBackToLibrary}
          timerEnabled={isTimerEnabled}
          onTimerToggle={setIsTimerEnabled}
          progress={allProgress[activeQuiz.id] || {}}
          onResetProgress={handleResetUnitProgress}
        />
      );
    }

    return (
      <>
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">My Quizzes</h2>
            <AddQuizDialog onQuizAdded={handleQuizAdded} />
        </div>
        <QuizLibrary 
            quizzes={quizzes} 
            onSelectQuiz={handleSelectQuiz} 
            onDeleteQuiz={handleDeleteQuiz}
        />
      </>
    )
  }

  const renderView = () => {
    switch(view) {
      case 'dashboard':
        return <div className="container mx-auto py-8 px-4 md:px-6">{renderDashboard()}</div>;
      case 'quiz':
        return activeQuiz && <div className="container mx-auto py-8 px-4 md:px-6">
                 <QuizRunner 
                  questions={activeQuizQuestions}
                  initialAnswers={activeQuizInitialAnswers}
                  onQuizFinish={handleQuizFinish} 
                  onExit={handleGoToDashboard} 
                  timerEnabled={isTimerEnabled}
                  totalQuizQuestions={activeQuiz.questions.length}
                />
              </div>;
      case 'results':
        return sessionResult && <div className="container mx-auto py-8 px-4 md:px-6"><ResultsPage result={sessionResult} onRestart={handleGoToDashboard} /></div>;
      default:
        return <div className="container mx-auto py-8 px-4 md:px-6">{renderDashboard()}</div>;
    }
  }

  return (
    <main className="min-h-screen bg-muted/30 font-body antialiased">
        <header className="bg-background border-b sticky top-0 z-10">
          <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
              <h1 className="text-xl font-bold text-primary font-headline">QuizCraft Architect</h1>
              <div className="flex items-center gap-2">
                <Button onClick={handleManualSave} variant="outline" size="sm">
                  <Save className="h-4 w-4 mr-2" />
                  Save Progress
                </Button>
                <Button variant="ghost" size="icon" aria-label="Settings">
                  <Settings className="h-5 w-5" />
                </Button>
              </div>
          </div>
        </header>
        {renderView()}
    </main>
  );
}

    