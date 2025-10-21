'use client';

import { useState } from 'react';
import type { Quiz, Question, SessionResult } from '@/lib/types';
import Dashboard from '@/components/dashboard';
import QuizRunner from '@/components/quiz-runner';
import ResultsPage from '@/app/results-page';
import { useToast } from "@/hooks/use-toast";
import AddQuizDialog from '@/components/add-quiz-dialog';
import ProfileHeader from '@/components/profile-header';
import { StatCard } from '@/components/stat-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import QuizLibrary from '@/components/quiz-library';

export type View = 'dashboard' | 'quiz' | 'results';

export default function Home() {
  const [view, setView] = useState<View>('dashboard');
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [activeQuizQuestions, setActiveQuizQuestions] = useState<Question[]>([]);
  const [sessionResult, setSessionResult] = useState<SessionResult | null>(null);
  const [isTimerEnabled, setIsTimerEnabled] = useState(false);
  const { toast } = useToast();

  // Placeholder stats
  const quizzesTaken = 0;
  const averageScore = 0;
  const hoursStudied = 0;
  const leaderboadRank = 0;

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
    toast({
        title: "Quiz Removed",
        description: `The quiz has been removed from your library.`,
    });
    if (activeQuiz?.id === quizId) {
      setActiveQuiz(null);
    }
  }

  const handleStartQuiz = (unitNumber: number | 'all', timerEnabled: boolean) => {
    if (!activeQuiz) return;

    let questionsForQuiz: Question[];
    if (unitNumber === 'all') {
      questionsForQuiz = activeQuiz.questions;
    } else {
      const unit = activeQuiz.units.find(u => u.unitNumber === unitNumber);
      questionsForQuiz = unit ? unit.questions : [];
    }
    setActiveQuizQuestions(questionsForQuiz);
    setIsTimerEnabled(timerEnabled);
    setView('quiz');
  };

  const handleQuizFinish = (answers: UserAnswer[], xp: number) => {
    if (!activeQuiz) return;
    
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
      totalQuestions: activeQuizQuestions.length,
      attemptedQuestions,
      correctAnswers,
      accuracy: parseFloat(accuracy.toFixed(1)),
      totalXP: xp,
      performanceByUnit,
    };

    setSessionResult(result);
    setView('results');
  };
  
  const handleGoToDashboard = () => {
    setView('dashboard');
    setActiveQuizQuestions([]);
    setSessionResult(null);
  };
  
  const handleBackToLibrary = () => {
    setActiveQuiz(null);
    setActiveQuizQuestions([]);
    setSessionResult(null);
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
        />
      );
    }

    return (
      <>
        <ProfileHeader 
          userName="Alex Tracker"
          userTitle="Aspiring CPA"
          bannerImageUrl="https://picsum.photos/seed/1/1200/300"
          avatarImageUrl="https://picsum.photos/seed/2/200/200"
        />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 my-8">
            <StatCard label="Quizzes Taken" value={quizzesTaken.toString()} />
            <StatCard label="Average Score" value={`${averageScore}%`} />
            <StatCard label="Hours Studied" value={hoursStudied.toString()} />
            <StatCard label="Leaderboard Rank" value={`#${leaderboadRank}`} />
        </div>
        <Tabs defaultValue="quizzes">
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                  <TabsTrigger value="quizzes">My Quizzes</TabsTrigger>
                  <TabsTrigger value="badges" disabled>Badges</TabsTrigger>
                  <TabsTrigger value="analytics" disabled>Analytics</TabsTrigger>
              </TabsList>
              <AddQuizDialog onQuizAdded={handleQuizAdded} />
            </div>
            <TabsContent value="quizzes">
                <QuizLibrary 
                    quizzes={quizzes} 
                    onSelectQuiz={handleSelectQuiz} 
                    onDeleteQuiz={handleDeleteQuiz}
                />
            </TabsContent>
        </Tabs>
      </>
    )
  }

  const renderView = () => {
    switch(view) {
      case 'dashboard':
        return <div className="container mx-auto py-8 px-4 md:px-6">{renderDashboard()}</div>;
      case 'quiz':
        return <div className="container mx-auto py-8 px-4 md:px-6">
                 <QuizRunner 
                  questions={activeQuizQuestions} 
                  onQuizFinish={handleQuizFinish} 
                  onExit={handleGoToDashboard} 
                  timerEnabled={isTimerEnabled}
                  totalQuizQuestions={activeQuiz?.questions.length || 0} 
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
              <h1 className="text-xl font-bold text-primary">QuizCraft Architect</h1>
              {/* Future elements like user profile can go here */}
          </div>
        </header>
        {renderView()}
    </main>
  );
}
