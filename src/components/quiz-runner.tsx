'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Question, UserAnswer } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import QuestionCard from './question-card';
import QuizHeader from './quiz-header';
import { useToast } from '@/hooks/use-toast';

interface QuizRunnerProps {
  questions: Question[];
  onQuizFinish: (answers: UserAnswer[], xp: number) => void;
  onExit: () => void;
  timerEnabled: boolean;
  totalQuizQuestions: number;
}

const XP_PER_CORRECT = 10;
const STREAK_BONUS_XP = 5;
const TOTAL_QUIZ_DURATION_HOURS = 3;
const MIN_TIME_PER_QUESTION_SECONDS = 59;

export default function QuizRunner({ questions, onQuizFinish, onExit, timerEnabled, totalQuizQuestions }: QuizRunnerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<UserAnswer[]>([]);
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState(0);
  const { toast } = useToast();

  const timePerQuestion = useMemo(() => {
    if (!timerEnabled || totalQuizQuestions === 0) return 0;
    const calculatedTime = (TOTAL_QUIZ_DURATION_HOURS * 3600) / totalQuizQuestions;
    return Math.max(calculatedTime, MIN_TIME_PER_QUESTION_SECONDS);
  }, [timerEnabled, totalQuizQuestions]);

  const [timeLeft, setTimeLeft] = useState(timePerQuestion);

  const currentQuestion = questions[currentIndex];
  const userAnswer = answers.find(a => a.questionId === currentQuestion?.question_id);

  const goToNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }, [currentIndex, questions.length]);
  
  const handleAnswer = useCallback((selectedOptionId: string) => {
    if (answers.find(a => a.questionId === questions[currentIndex]?.question_id)) return;

    const responseTime = Date.now() - questionStartTime;
    const isCorrect = questions[currentIndex].correct_answer === selectedOptionId;

    if (isCorrect) {
      const newStreak = streak + 1;
      const gainedXp = XP_PER_CORRECT + (newStreak > 1 ? STREAK_BONUS_XP * (newStreak - 1) : 0);
      setXp(xp + gainedXp);
      setStreak(newStreak);
      toast({
        title: `+${gainedXp} XP`,
        description: newStreak > 1 ? `Streak: ${newStreak}` : 'Correct!',
        variant: 'default',
        className: 'text-green-500 border-green-500',
        duration: 1000,
      });
      if (newStreak === 5) {
        toast({ title: '🔥 Streak x5!', description: 'You unlocked the "On Fire" badge!', duration: 2000 });
      }
      if (xp + gainedXp >= 100) {
        toast({ title: '🏆 100 XP Club!', description: 'You unlocked a new badge!', duration: 2000 });
      }
    } else {
      setStreak(0);
      toast({
        variant: 'destructive',
        title: 'Incorrect',
        description: `The correct answer is option ${questions[currentIndex].correct_answer}.`,
        duration: 1500,
      });
    }

    setAnswers(prev => [...prev, { questionId: questions[currentIndex].question_id, selectedOptionId, isCorrect, responseTime }]);
  }, [answers, currentIndex, questionStartTime, questions, streak, toast, xp]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (timerEnabled && !userAnswer) {
      setTimeLeft(timePerQuestion);
      timer = setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime <= 1) {
            clearInterval(timer);
            if(userAnswer === undefined){ // only auto-advance if no answer was given
              handleAnswer(""); // Record timeout as an unanswered question
            }
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    } else if (timerEnabled && userAnswer && timeLeft > 0) {
        // Stop timer if answered
        clearInterval(timer);
    }
    return () => clearInterval(timer);
  }, [currentIndex, timerEnabled, timePerQuestion, userAnswer, handleAnswer, timeLeft]);


  useEffect(() => {
    setQuestionStartTime(Date.now());
    if (timerEnabled) {
      setTimeLeft(timePerQuestion);
    }
  }, [currentIndex, timerEnabled, timePerQuestion]);

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && userAnswer) goToNext();
      if (e.key === 'ArrowLeft') goToPrevious();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrevious, userAnswer]);

  useEffect(() => {
    if(timerEnabled && timeLeft <= 0 && !userAnswer) {
      goToNext();
    }
  }, [timeLeft, timerEnabled, userAnswer, goToNext]);

  const progress = ((currentIndex + 1) / questions.length) * 100;
  const isQuizFinished = answers.length === questions.length;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-fade-in">
      <QuizHeader
        xp={xp}
        streak={streak}
        progress={progress}
        currentIndex={currentIndex}
        totalQuestions={questions.length}
        onExit={onExit}
        timerEnabled={timerEnabled}
        timeLeft={Math.round(timeLeft)}
      />
      
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
        >
          {currentQuestion && (
            <QuestionCard
              question={currentQuestion}
              onAnswer={handleAnswer}
              userAnswer={userAnswer}
            />
          )}
        </motion.div>
      </AnimatePresence>

      <div className="flex justify-between items-center pt-4">
        <Button onClick={goToPrevious} disabled={currentIndex === 0} variant="outline">
          <ChevronLeft className="mr-2 h-4 w-4" /> Previous
        </Button>
        {isQuizFinished ? (
          <Button onClick={() => onQuizFinish(answers, xp)} size="lg">
            Finish & See Results
          </Button>
        ) : (
          <Button onClick={goToNext} disabled={!userAnswer || currentIndex === questions.length -1}>
            Next <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
