'use client';

import { useState } from 'react';
import type { Quiz, Question, SessionResult, UserAnswer } from '@/lib/types';
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
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [activeQuizQuestions, setActiveQuizQuestions] = useState<Question[]>([]);
  const [sessionResult, setSessionResult] = useState<SessionResult | null>(null);
  const [isTimerEnabled, setIsTimerEnabled] = useState(false);
  const { toast } = useToast();

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

  const handleQuizFinish = (answers: UserAnswer[]) => {
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
              <h1 className="text-xl font-bold text-primary font-headline">QuizCraft Architect</h1>
              <Button variant="ghost" size="icon" aria-label="Settings">
                <Settings className="h-5 w-5" />
              </Button>
          </div>
        </header>
        {renderView()}
    </main>
  );
}
