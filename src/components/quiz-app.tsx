'use client';

import { useState } from 'react';
import type { Question, Unit, SessionResult, UserAnswer } from '@/lib/types';
import FileUploader from './file-uploader';
import Dashboard from './dashboard';
import QuizRunner from './quiz-runner';
import ResultsPage from './results-page';
import { groupQuestionsIntoUnits } from '@/lib/quiz-parser';
import { useToast } from "@/hooks/use-toast";

type View = 'uploader' | 'dashboard' | 'quiz' | 'results';

export default function QuizApp() {
  const [view, setView] = useState<View>('uploader');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [activeQuizQuestions, setActiveQuizQuestions] = useState<Question[]>([]);
  const [sessionResult, setSessionResult] = useState<SessionResult | null>(null);
  const { toast } = useToast();

  const handleFileLoaded = (parsedQuestions: Question[]) => {
    try {
      const groupedUnits = groupQuestionsIntoUnits(parsedQuestions);
      setQuestions(parsedQuestions);
      setUnits(groupedUnits);
      setView('dashboard');
      toast({
        title: "Success",
        description: `Loaded ${parsedQuestions.length} questions across ${groupedUnits.length} units.`,
      });
    } catch (error) {
      console.error("Error processing questions:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "An unknown error occurred while processing the file.",
      });
    }
  };

  const handleStartQuiz = (unitNumber: number | 'all') => {
    let questionsForQuiz: Question[];
    if (unitNumber === 'all') {
      questionsForQuiz = questions;
    } else {
      const unit = units.find(u => u.unitNumber === unitNumber);
      questionsForQuiz = unit ? unit.questions : [];
    }
    setActiveQuizQuestions(questionsForQuiz);
    setView('quiz');
  };

  const handleQuizFinish = (answers: UserAnswer[], xp: number) => {
    const attemptedQuestions = answers.length;
    const correctAnswers = answers.filter(a => a.isCorrect).length;
    const accuracy = attemptedQuestions > 0 ? (correctAnswers / attemptedQuestions) * 100 : 0;

    const performanceByUnit = units.map(unit => {
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
  
  const handleRestart = () => {
    setView('dashboard');
    setActiveQuizQuestions([]);
    setSessionResult(null);
  };
  
  const handleResetApp = () => {
    setView('uploader');
    setQuestions([]);
    setUnits([]);
    setActiveQuizQuestions([]);
    setSessionResult(null);
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
        {view === 'uploader' && <FileUploader onFileLoaded={handleFileLoaded} />}
        {view === 'dashboard' && <Dashboard units={units} onStartQuiz={handleStartQuiz} onReset={handleResetApp} />}
        {view === 'quiz' && <QuizRunner questions={activeQuizQuestions} onQuizFinish={handleQuizFinish} />}
        {view === 'results' && sessionResult && <ResultsPage result={sessionResult} onRestart={handleRestart} />}
    </div>
  );
}
