'use client';

import { useState } from 'react';
import type { Quiz } from '@/lib/types';
import Dashboard from '@/components/dashboard';
import QuizRunner from '@/components/quiz-runner';
import ResultsPage from './results-page';
import { useToast } from "@/hooks/use-toast";
import ProfilePage from './dashboard/page';

export type View = 'dashboard' | 'quiz' | 'results' | 'profile';

export default function Home() {
  const [view, setView] = useState<View>('profile');
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
      setView('dashboard');
    }
  };

  const handleDeleteQuiz = (quizId: string) => {
    setQuizzes(prev => prev.filter(q => q.id !== quizId));
    toast({
        title: "Quiz Removed",
        description: `The quiz has been removed from your library.`,
    });
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
    setView('profile');
    setActiveQuiz(null);
    setActiveQuizQuestions([]);
    setSessionResult(null);
  };

  const renderView = () => {
    switch(view) {
      case 'profile':
        return <ProfilePage 
                  quizzes={quizzes} 
                  onQuizAdded={handleQuizAdded} 
                  onSelectQuiz={handleSelectQuiz} 
                  onDeleteQuiz={handleDeleteQuiz}
                />;
      case 'dashboard':
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
        return null;
      case 'quiz':
        return <QuizRunner 
                  questions={activeQuizQuestions} 
                  onQuizFinish={handleQuizFinish} 
                  onExit={handleGoToDashboard} 
                  timerEnabled={isTimerEnabled}
                  totalQuizQuestions={activeQuiz?.questions.length || 0} 
                />;
      case 'results':
        return sessionResult && <ResultsPage result={sessionResult} onRestart={handleGoToDashboard} />;
      default:
        return <ProfilePage 
                  quizzes={quizzes} 
                  onQuizAdded={handleQuizAdded} 
                  onSelectQuiz={handleSelectQuiz} 
                  onDeleteQuiz={handleDeleteQuiz}
                />;
    }
  }

  return (
    <main className="min-h-screen bg-muted/30">
        {renderView()}
    </main>
  );
}
