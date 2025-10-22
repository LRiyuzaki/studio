'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Question, SessionResult, UserAnswer, UnitProgress, AllProgress, Quiz } from '@/lib/types';
import { useQuizStore } from '@/lib/store';
import Dashboard from '@/components/dashboard';
import QuizRunner from '@/components/quiz-runner';
import ResultsPage from '@/app/results-page';
import { useToast } from "@/hooks/use-toast";
import AddQuizDialog from '@/components/add-quiz-dialog';
import QuizLibrary from '@/components/quiz-library';
import { Settings, LogOut, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUser, useCollection, useDoc, useFirestore } from '@/firebase';
import { signOut } from '@/firebase/auth/google-auth';
import * as dataService from '@/firebase/firestore/data';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

export type View = 'dashboard' | 'quiz' | 'results';

export default function DashboardPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();

  const [view, setView] = useState<View>('dashboard');
  const [sessionResult, setSessionResult] = useState<SessionResult | null>(null);
  const [questionsForSession, setQuestionsForSession] = useState<Question[]>([]);
  const [initialAnswersForSession, setInitialAnswersForSession] = useState<UserAnswer[]>([]);
  const { toast } = useToast();

  // Zustand state selectors
  const {
    quizzes,
    allProgress,
    activeQuizId,
    isTimerEnabled,
    setQuizzes,
    setAllProgress,
    deleteQuizFromState,
    setActiveQuizId,
    startSession,
    getSessionProgressForQuiz,
    toggleTimer,
    clearLocalData,
  } = useQuizStore();
  
  const { data: userQuizzes, loading: quizzesLoading } = useCollection<Quiz>(firestore && user ? `users/${user.uid}/quizzes` : null);
  const { data: userProgress, loading: progressLoading } = useCollection<AllProgress>(firestore && user ? `users/${user.uid}/progress` : null);

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/');
      clearLocalData(); // Clear local state on sign out
    }
  }, [user, userLoading, router, clearLocalData]);

  useEffect(() => {
    if (userQuizzes) {
      setQuizzes(userQuizzes);
    }
  }, [userQuizzes, setQuizzes]);

  useEffect(() => {
    if (userProgress) {
      const progressByQuiz = userProgress.reduce((acc, doc) => {
        // The doc id is the quizId
        const quizId = doc.id;
        // The rest of the doc is the progress data
        const { id, ...progressData } = doc;
        acc[quizId] = progressData;
        return acc;
    }, {} as AllProgress);
      setAllProgress(progressByQuiz);
    } else {
        setAllProgress({});
    }
}, [userProgress, setAllProgress]);
  
  const activeQuiz = useMemo(() => quizzes.find(q => q.id === activeQuizId), [quizzes, activeQuizId]);

  if (userLoading || quizzesLoading || progressLoading || !user || !firestore) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading user data...</p>
      </div>
    );
  }

  const handleQuizAdded = (newQuiz: any) => {
    if (!firestore || !user) return;
    dataService.saveQuiz(firestore, user.uid, newQuiz);
    toast({
      title: "Quiz Added!",
      description: `"${newQuiz.name}" is now in your library.`,
    });
  };

  const handleSelectQuiz = (quizId: string) => {
    setActiveQuizId(quizId);
  };

  const handleDeleteQuiz = (quizId: string) => {
    if (!firestore || !user) return;
    dataService.deleteQuiz(firestore, user.uid, quizId);
    deleteQuizFromState(quizId); // Optimistic update
    toast({
        title: "Quiz Removed",
        description: `The quiz has been removed from your library.`,
    });
  }

  const handleResetUnitProgress = (quizId: string, unitNumber: number | 'all') => {
      if (!firestore || !user) return;
      // For now, we only support resetting the whole quiz from Firestore
      dataService.resetProgress(firestore, user.uid, quizId);
      toast({
          title: "Progress Reset",
          description: "Your progress for this unit has been cleared."
      });
  }

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
    const updatedProgress = getSessionProgressForQuiz();
    if (activeQuizId && updatedProgress && firestore && user) {
        dataService.saveProgress(firestore, user.uid, activeQuizId, updatedProgress);
    }

    const quizProgress = useQuizStore.getState().allProgress[activeQuizId!] || {};
    const allAnswersForQuiz = Object.values(quizProgress).flatMap((p: any) => p.answers);
    const result = calculatePerformance(allAnswersForQuiz);
    
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

  const userDisplayName = user?.displayName || 'User';
  const userEmail = user?.email || 'No email';
  const userPhotoURL = user?.photoURL;


  return (
    <main className="min-h-screen bg-muted/30 font-body antialiased">
        <header className="bg-background border-b sticky top-0 z-10">
          <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
              <h1 className="text-xl font-bold text-primary font-headline">QuizCraft Architect</h1>
              <div className="flex items-center gap-4">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                        <Avatar className="h-10 w-10">
                        {userPhotoURL && <AvatarImage src={userPhotoURL} alt={userDisplayName} />}
                        <AvatarFallback>{userDisplayName.charAt(0)}</AvatarFallback>
                        </Avatar>
                    </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{userDisplayName}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                            {userEmail}
                        </p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                    </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
              </div>
          </div>
        </header>
        {renderView()}
    </main>
  );
}
