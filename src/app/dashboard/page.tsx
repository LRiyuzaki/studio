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
import { Settings, LogOut, Loader2, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUser } from '@/firebase';
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { collection, onSnapshot, query, Firestore } from 'firebase/firestore';
import Link from 'next/link';
import { useFirestore } from '@/firebase/provider';


export type View = 'dashboard' | 'quiz' | 'results';

export default function DashboardPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();

  // Component State
  const [view, setView] = useState<View>('dashboard');
  const [sessionResult, setSessionResult] = useState<SessionResult | null>(null);
  const [questionsForSession, setQuestionsForSession] = useState<Question[]>([]);
  const { toast } = useToast();

  // Loading States
  const [quizzesLoading, setQuizzesLoading] = useState(true);
  const [progressLoading, setProgressLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    getCurrentProgressForQuiz,
    toggleTimer,
    clearLocalData,
  } = useQuizStore();
  
  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/');
      clearLocalData(); // Clear local state on sign out
    }
  }, [user, userLoading, router, clearLocalData]);

  useEffect(() => {
    if (!user || !firestore) return;
    
    setQuizzesLoading(true);
    const q = query(collection(firestore, `users/${user.uid}/quizzes`));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const userQuizzes = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Quiz));
      setQuizzes(userQuizzes);
      setQuizzesLoading(false);
    }, (error) => {
      console.error("Error fetching quizzes:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not fetch quizzes." });
      setQuizzesLoading(false);
    });
    
    return () => unsubscribe();
  }, [firestore, user, setQuizzes, toast]);

  useEffect(() => {
    if (!user || !firestore) return;
    
    setProgressLoading(true);
    const q = query(collection(firestore, `users/${user.uid}/progress`));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const progressByQuiz = querySnapshot.docs.reduce((acc, doc) => {
          const quizId = doc.id;
          const progressData = doc.data() as UnitProgress;
          acc[quizId] = progressData;
          return acc;
      }, {} as AllProgress);
      setAllProgress(progressByQuiz);
      setProgressLoading(false);
    }, (error) => {
      console.error("Error fetching progress:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not fetch progress." });
      setProgressLoading(false);
    });

    return () => unsubscribe();
  }, [firestore, user, setAllProgress, toast]);
  
  const activeQuiz = useMemo(() => quizzes.find(q => q.id === activeQuizId), [quizzes, activeQuizId]);
  
  const overallProgress = useMemo(() => {
    if (!activeQuizId || !allProgress[activeQuizId] || !activeQuiz) return 0;
    
    const progress = allProgress[activeQuizId];
    if (!progress) return 0;

    const totalAnswered = Object.values(progress).reduce((sum, p) => {
        // Ensure p.answers is an array before reducing
        return Array.isArray(p.answers) ? sum + p.answers.length : sum;
    }, 0);

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
      dataService.resetProgress(firestore, user.uid, quizId);
      toast({
          title: "Progress Reset",
          description: "Your progress for this unit has been cleared."
      });
  }

  const handleStartQuiz = (unitNumber: number | 'all') => {
    if (!activeQuiz) return;
    
    let questions: Question[];

    if (unitNumber === 'all') {
        questions = activeQuiz.questions;
    } else {
        const unit = activeQuiz.units.find(u => u.unitNumber === unitNumber);
        questions = unit ? unit.questions : [];
    }

    setQuestionsForSession(questions);
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
    const updatedProgress = getCurrentProgressForQuiz();
    if (activeQuizId && updatedProgress && firestore && user) {
        dataService.saveProgress(firestore, user.uid, activeQuizId, updatedProgress);
    }

    const quizProgress = useQuizStore.getState().allProgress[activeQuizId!] || {};
    const allAnswersForQuiz = Object.values(quizProgress).flatMap((p: any) => p.answers);
    const result = calculatePerformance(allAnswersForQuiz, quizProgress);
    
    setSessionResult(result);
    setView('results');
  };
  
  const handleGoToDashboard = () => {
    const updatedProgress = getCurrentProgressForQuiz();
    if (activeQuizId && updatedProgress && firestore && user) {
        dataService.saveProgress(firestore, user.uid, activeQuizId, updatedProgress);
    }
    setView('dashboard');
    setSessionResult(null);
  };
  
  const handleBackToLibrary = () => {
    setActiveQuizId(null);
    setView('dashboard');
  };
  
  const renderDashboard = () => {
    if (activeQuiz) {
      const currentProgress = allProgress[activeQuiz.id] || {};
      
      return (
        <Dashboard 
          quiz={activeQuiz} 
          onStartQuiz={handleStartQuiz} 
          onBack={handleBackToLibrary}
          timerEnabled={isTimerEnabled}
          onTimerToggle={toggleTimer}
          progress={currentProgress}
          onResetProgress={handleResetUnitProgress}
          overallProgress={overallProgress}
          isLoading={progressLoading}
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
            isLoading={quizzesLoading}
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
  
  const userMenuItems = (
      <>
          <Link href="/dashboard/settings" passHref>
              <DropdownMenuItem onClick={() => setMobileMenuOpen(false)}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
              </DropdownMenuItem>
          </Link>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => { signOut(); setMobileMenuOpen(false); }}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
          </DropdownMenuItem>
      </>
  );

  const userProfileInfo = (
      <div className="flex flex-col space-y-1">
          <p className="text-sm font-medium leading-none">{userDisplayName}</p>
          <p className="text-xs leading-none text-muted-foreground">
              {userEmail}
          </p>
      </div>
  );


  return (
    <main className="min-h-screen bg-muted/30 font-body antialiased">
        <header className="bg-background border-b sticky top-0 z-10">
          <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
              <h1 className="text-xl font-bold text-primary font-headline">QuizCraft Architect</h1>
              <div className="flex items-center gap-4">
                {/* Mobile Menu */}
                <div className="md:hidden">
                    <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                        <SheetTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <Menu className="h-6 w-6" />
                            <span className="sr-only">Open menu</span>
                        </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                        <SheetHeader className="border-b pb-4 text-left">
                            <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12">
                                {userPhotoURL && <AvatarImage src={userPhotoURL} alt={userDisplayName} />}
                                <AvatarFallback>{userDisplayName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            {userProfileInfo}
                            </div>
                        </SheetHeader>
                        <div className="py-4">
                            {userMenuItems}
                        </div>
                        </SheetContent>
                    </Sheet>
                </div>
                
                {/* Desktop Menu */}
                <div className="hidden md:flex">
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
                            {userProfileInfo}
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {userMenuItems}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
              </div>
          </div>
        </header>
        {renderView()}
    </main>
  );
}
