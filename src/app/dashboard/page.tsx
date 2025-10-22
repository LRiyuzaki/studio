
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { SessionResult, UserAnswer, UnitProgress, AllProgress, Quiz } from '@/lib/types';
import { useQuizStore } from '@/lib/store';
import Dashboard from '@/components/dashboard';
import QuizRunner from '@/components/quiz-runner';
import ResultsPage from '@/app/results-page';
import { useToast } from "@/hooks/use-toast";
import AddQuizDialog from '@/components/add-quiz-dialog';
import QuizLibrary from '@/components/quiz-library';
import { Loader2 } from 'lucide-react';
import { useUser } from '@/firebase';
import * as dataService from '@/firebase/firestore/data';
import { useFirestore } from '@/firebase/provider';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { startSyncWorker } from '@/lib/sync-worker';


export type View = 'dashboard' | 'quiz' | 'results';

export default function DashboardPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();

  // Component State
  const [view, setView] = useState<View>('dashboard');
  const [sessionResult, setSessionResult] = useState<SessionResult | null>(null);
  const [questionsForSession, setQuestionsForSession] = useState<Quiz['questions']>([]);
  const { toast } = useToast();

  // Loading States
  const [progressLoading, setProgressLoading] = useState(true);

  // Zustand state selectors
  const {
    allProgress,
    activeQuizId,
    isTimerEnabled,
    setAllProgress,
    setActiveQuizId,
    toggleTimer,
    clearLocalData,
  } = useQuizStore(
    ({ allProgress, activeQuizId, isTimerEnabled, setAllProgress, setActiveQuizId, toggleTimer, clearLocalData }) => 
    ({ allProgress, activeQuizId, isTimerEnabled, setAllProgress, setActiveQuizId, toggleTimer, clearLocalData })
  );

  const quizzes = useLiveQuery(() => db.quizzes.toArray(), []);
  const quizzesLoading = !quizzes;
  
  useEffect(() => {
    // Start the sync worker when the component mounts
    const worker = startSyncWorker();
    return () => {
      // Stop the worker when the component unmounts
      worker.terminate();
    };
  }, []);

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/');
      clearLocalData(); // Clear local state on sign out
    }
  }, [user, userLoading, router, clearLocalData]);

  useEffect(() => {
    if (!user || !firestore) return;
    
    // This effect can be expanded later to sync remote progress to local state
    // For now, we simulate loading and then stop.
    setProgressLoading(true);
    // In a real scenario, you'd fetch from Firestore and update Zustand/Dexie
    // const q = query(collection(firestore, `users/${user.uid}/progress`));
    // ... onSnapshot logic ...
    setTimeout(() => setProgressLoading(false), 500); // Simulate loading progress

  }, [firestore, user, setAllProgress, toast]);
  
  const activeQuiz = useMemo(() => quizzes?.find(q => q.id === activeQuizId), [quizzes, activeQuizId]);
  
  const overallProgress = useMemo(() => {
    if (!activeQuizId || !allProgress[activeQuizId] || !activeQuiz) return 0;
    
    const progress = allProgress[activeQuizId];
    if (!progress) return 0;

    const totalAnswered = Object.values(progress).reduce((sum, p) => sum + p.answers.length, 0);
    return activeQuiz.questions.length > 0 ? (totalAnswered / activeQuiz.questions.length) * 100 : 0;
  }, [activeQuizId, allProgress, activeQuiz]);


  if (userLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading user data...</p>
      </div>
    );
  }

  const handleQuizAdded = async (newQuiz: Quiz) => {
    if (!user) return;
    try {
      await dataService.saveQuiz(newQuiz);
      toast({
        title: "Quiz Queued!",
        description: `"${newQuiz.name}" has been added to the generation queue.`,
      });
    } catch (error) {
      console.error("Error saving quiz:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not save the quiz locally." });
    }
  };

  const handleSelectQuiz = (quizId: string) => {
    setActiveQuizId(quizId);
  };

  const handleDeleteQuiz = async (quizId: string) => {
    if (!user) return;
    try {
      await dataService.deleteQuiz(quizId);
      // useLiveQuery and Zustand sync will handle the UI update
      toast({
          title: "Quiz Removed",
          description: `The quiz has been removed from your library.`,
      });
    } catch (error) {
       console.error("Error deleting quiz:", error);
       toast({ variant: "destructive", title: "Error", description: "Could not delete the quiz." });
    }
  }

  const handleResetUnitProgress = (quizId: string, unitNumber: number | 'all') => {
      if (!firestore || !user) return;
      // This part still interacts with Firestore, can be refactored later to use local DB.
      dataService.resetProgress(firestore, user.uid, quizId);
      toast({
          title: "Progress Reset",
          description: "Your progress for this unit has been cleared."
      });
  }

  const handleStartQuiz = (unitNumber: number | 'all') => {
    if (!activeQuiz) return;
    
    let questionsToStart: Quiz['questions'];

    if (unitNumber === 'all') {
        questionsToStart = activeQuiz.questions;
    } else {
        const unit = activeQuiz.units.find(u => u.unitNumber === unitNumber);
        questionsToStart = unit ? unit.questions : [];
    }

    setQuestionsForSession(questionsToStart);
    setView('quiz');
  };
  
  const calculatePerformance = (answers: UserAnswer[], quizProgress: UnitProgress) => {
    if (!activeQuiz) return { totalQuestions: 0, attemptedQuestions: 0, correctAnswers: 0, accuracy: 0, performanceByUnit: [], totalXp: 0, newBadges: [] };

    const attemptedQuestions = answers.length;
    const correctAnswers = answers.filter(a => a.isCorrect).length;
    const accuracy = attemptedQuestions > 0 ? (correctAnswers / attemptedQuestions) * 100 : 0;
    
    const totalXp = Object.values(quizProgress).reduce((sum, unit) => sum + (unit.xp || 0), 0);
    // Placeholder for badge calculation
    const newBadges: any[] = [];


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
      totalQuestions: activeQuiz.questions.length,
      attemptedQuestions,
      correctAnswers,
      accuracy: parseFloat(accuracy.toFixed(1)),
      performanceByUnit,
      totalXp,
      newBadges,
    };
  }

  const handleQuizFinish = () => {
    const quizProgress = useQuizStore.getState().allProgress[activeQuizId!] || {};
    const allAnswersForQuiz = Object.values(quizProgress).flatMap((p: any) => p.answers);
    const result = calculatePerformance(allAnswersForQuiz, quizProgress);
    
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
  
  const renderContent = () => {
    if (view === 'quiz' && activeQuiz) {
        return (
            <div className="container mx-auto py-8 px-4 md:px-6">
                <QuizRunner 
                    questions={questionsForSession}
                    onQuizFinish={handleQuizFinish} 
                    onExit={handleGoToDashboard} 
                    timerEnabled={isTimerEnabled}
                    totalQuizQuestions={activeQuiz.questions.length}
                />
            </div>
        );
    }

    if (view === 'results' && sessionResult) {
        return (
            <div className="container mx-auto py-8 px-4 md:px-6">
                <ResultsPage result={sessionResult} onRestart={handleGoToDashboard} />
            </div>
        );
    }
    
    // Default to dashboard view
    return (
      <div className="container mx-auto py-8 px-4 md:px-6">
        {activeQuiz ? (
            <Dashboard 
                quiz={activeQuiz} 
                onStartQuiz={handleStartQuiz} 
                onBack={handleBackToLibrary}
                timerEnabled={isTimerEnabled}
                onTimerToggle={toggleTimer}
                progress={allProgress[activeQuiz.id] || {}}
                onResetProgress={handleResetUnitProgress}
                overallProgress={overallProgress}
                isLoading={progressLoading}
            />
        ) : (
            <>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">My Quizzes</h2>
                    <AddQuizDialog onQuizAdded={handleQuizAdded} />
                </div>
                <QuizLibrary 
                    quizzes={quizzes || []} 
                    onSelectQuiz={handleSelectQuiz} 
                    onDeleteQuiz={handleDeleteQuiz}
                    isLoading={quizzesLoading}
                />
            </>
        )}
      </div>
    );
  }

  return renderContent();
}
