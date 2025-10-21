'use client';

import { useState, useEffect, useCallback } from 'react';
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
}

const XP_PER_CORRECT = 10;
const STREAK_BONUS_XP = 5;

export default function QuizRunner({ questions, onQuizFinish }: QuizRunnerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<UserAnswer[]>([]);
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState(0);
  const { toast } = useToast();
  
  useEffect(() => {
    setQuestionStartTime(Date.now());
  }, [currentIndex]);

  const currentQuestion = questions[currentIndex];
  const userAnswer = answers.find(a => a.questionId === currentQuestion?.question_id);

  const handleAnswer = (selectedOptionId: string) => {
    if (userAnswer) return;

    const responseTime = Date.now() - questionStartTime;
    const isCorrect = currentQuestion.correct_answer === selectedOptionId;

    if (isCorrect) {
      const newStreak = streak + 1;
      const gainedXp = XP_PER_CORRECT + (newStreak > 1 ? STREAK_BONUS_XP * (newStreak - 1) : 0);
      setXp(xp + gainedXp);
      setStreak(newStreak);
      toast({
        title: `Correct! +${gainedXp} XP`,
        description: newStreak > 1 ? `Streak: ${newStreak}` : '',
        className: 'bg-green-100 border-green-300 text-green-800'
      });
      if (newStreak === 5) {
        toast({ title: '🔥 Streak x5!', description: 'You unlocked the "On Fire" badge!' });
      }
      if (xp + gainedXp >= 100) {
        toast({ title: '🏆 100 XP Club!', description: 'You unlocked a new badge!' });
      }
    } else {
      setStreak(0);
      toast({
        variant: 'destructive',
        title: 'Incorrect',
        description: `The correct answer is option ${currentQuestion.correct_answer}.`,
      });
    }

    setAnswers(prev => [...prev, { questionId: currentQuestion.question_id, selectedOptionId, isCorrect, responseTime }]);
  };

  const goToNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (answers.length === questions.length) {
      onQuizFinish(answers, xp);
    }
  }, [currentIndex, questions.length, answers, onQuizFinish, xp]);

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

  const progress = ((answers.length) / questions.length) * 100;
  const answeredCount = answers.length;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-fade-in">
      <QuizHeader
        xp={xp}
        streak={streak}
        progress={progress}
        currentIndex={currentIndex}
        totalQuestions={questions.length}
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
        {answeredCount === questions.length ? (
          <Button onClick={() => onQuizFinish(answers, xp)} size="lg">
            Finish & See Results
          </Button>
        ) : (
          <Button onClick={goToNext} disabled={!userAnswer}>
            Next <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
