'use client';

import { useState, useMemo } from 'react';
import type { Question, SessionResult, UserAnswer } from '@/lib/types';
import { useQuizStore } from '@/lib/store';
import Dashboard from '@/components/dashboard';
import QuizRunner from '@/components/quiz-runner';
import ResultsPage from '@/app/results-page';
import { useToast } from "@/hooks/use-toast";
import AddQuizDialog from '@/components/add-quiz-dialog';
import QuizLibrary from '@/components/quiz-library';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type View = 'dashboard' | 'quiz' | 'results';

export default function Home() {
  const [view, setView] = useState<View>('dashboard');
  const [sessionResult, setSessionResult] = useState<SessionResult | null>(null);
  const { toast } = useToast();

  // Zustand state selectors
  const {
    quizzes,
    allProgress,
    activeQuizId,
    isTimerEnabled,
    addQuiz,
    deleteQuiz,
    setActiveQuizId,
    startSession,
    finishSession,
    sessionAnswers,
    toggleTimer,
    resetProgress,
  } = useQuizStore();
  
  const activeQuiz = useMemo(() => quizzes.find(q => q.id === activeQuizId), [quizzes, activeQuizId]);

  const handleQuizAdded = (newQuiz: any) => {
    addQuiz(newQuiz);
    toast({
      title: "Quiz Added!",
      description: `"${newQuiz.name}" is now in your library.`,
    });
  };

  const handleSelectQuiz = (quizId: string) => {
    setActiveQuizId(quizId);
  };

  const handleDeleteQuiz = (quizId: string) => {
    deleteQuiz(quizId);
    toast({
        title: "Quiz Removed",
        description: `The quiz has been removed from your library.`,
    });
  }

  const handleResetUnitProgress = (quizId: string, unitNumber: number | 'all') => {
      resetProgress(quizId, unitNumber);
      toast({
          title: "Progress Reset",
          description: "Your progress for this unit has been cleared."
      });
  }

  const [questionsForSession, setQuestionsForSession] = useState<Question[]>([]);
  const [initialAnswersForSession, setInitialAnswersForSession] = useState<UserAnswer[]>([]);

  const handleStartQuiz = (unitNumber: number | 'all') => {
    if (!activeQuiz) return;
    
    startSession(activeQuiz.id);
    
    const quizProgress = allProgress[activeQuiz.id] || {};
    let questions: Question[];
    let initialAnswers: UserAnswer[] = [];

    if (unitNumber === 'all') {
        questions = activeQuiz.questions;
        Object.values(quizProgress).forEach((unitProg: any) => {
            initialAnswers.push(...unitProg.answers);
        });
    } else {
        const unit = activeQuiz.units.find(u => u.unitNumber === unitNumber);
        questions = unit ? unit.questions : [];
        initialAnswers = quizProgress[unitNumber]?.answers || [];
    }

    setQuestionsForSession(questions);
    setInitialAnswersForSession(initialAnswers);
    setView('quiz');
  };
  
  const calculatePerformance = (answers: UserAnswer[]) => {
    if (!activeQuiz) return { totalQuestions: 0, attemptedQuestions: 0, correctAnswers: 0, accuracy: 0, performanceByUnit: [] };

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
        studyUnit: { number: unit.unitNumber, name: unit.unitName },
        questionsAttempted: unitAttempted,
        questionsCorrect: unitCorrect,
        accuracy: parseFloat(unitAccuracy.toFixed(1)),
        averageResponseTime: parseFloat(averageResponseTime.toFixed(2)),
      };
    });

    return {
      totalQuestions: questionsForSession.length,
      attemptedQuestions,
      correctAnswers,
      accuracy: parseFloat(accuracy.toFixed(1)),
      performanceByUnit,
    };
  }

  const handleQuizFinish = () => {
    finishSession();
    const result = calculatePerformance(sessionAnswers);
    setSessionResult(result);
    setView('results');
  };
  
  const handleGoToDashboard = () => {
    setView('dashboard');
    setSessionResult(null);
  };
  
  const handleBackToLibrary = () => {
    setActiveQuizId(null);
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
          onTimerToggle={toggleTimer}
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
                  questions={questionsForSession}
                  initialAnswers={initialAnswersForSession}
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
