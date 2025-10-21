'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Question, UserAnswer } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import QuestionCard from './question-card';
import QuizHeader from './quiz-header';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"


interface QuizRunnerProps {
  questions: Question[];
  initialAnswers: UserAnswer[];
  onQuizFinish: (answers: UserAnswer[]) => void;
  onExit: () => void;
  timerEnabled: boolean;
  totalQuizQuestions: number;
}

const TOTAL_QUIZ_DURATION_HOURS = 3;
const MIN_TIME_PER_QUESTION_SECONDS = 59;

export default function QuizRunner({ questions, initialAnswers, onQuizFinish, onExit, timerEnabled, totalQuizQuestions }: QuizRunnerProps) {
  const [answers, setAnswers] = useState<UserAnswer[]>(initialAnswers);
  const answeredQuestionIds = useMemo(() => new Set(answers.map(a => a.questionId)), [answers]);
  const firstUnansweredIndex = useMemo(() => questions.findIndex(q => !answeredQuestionIds.has(q.question_id)), [questions, answeredQuestionIds]);

  const [currentIndex, setCurrentIndex] = useState(firstUnansweredIndex > -1 ? firstUnansweredIndex : 0);
  const [questionStartTime, setQuestionStartTime] = useState(0);

  const timePerQuestion = useMemo(() => {
    if (!timerEnabled || totalQuizQuestions === 0) return 0;
    const calculatedTime = (TOTAL_QUIZ_DURATION_HOURS * 3600) / totalQuizQuestions;
    return Math.max(calculatedTime, MIN_TIME_PER_QUESTION_SECONDS);
  }, [timerEnabled, totalQuizQuestions]);

  const [timeLeft, setTimeLeft] = useState(timePerQuestion);
  
  const currentQuestion = questions[currentIndex];
  const userAnswer = answers.find(a => a.questionId === currentQuestion?.question_id);

  const handleAnswer = useCallback((selectedOptionId: string) => {
    if (userAnswer) return;

    const responseTime = Date.now() - questionStartTime;
    const isCorrect = questions[currentIndex].correct_answer === selectedOptionId;
    
    // Add or update the answer
    setAnswers(prev => {
        const otherAnswers = prev.filter(a => a.questionId !== questions[currentIndex].question_id);
        return [...otherAnswers, { questionId: questions[currentIndex].question_id, selectedOptionId, isCorrect, responseTime }];
    });

  }, [currentIndex, questionStartTime, questions, userAnswer]);


  const goToNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }, [currentIndex, questions.length]);
  

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (timerEnabled && !userAnswer) {
      if (timeLeft <= 0) setTimeLeft(timePerQuestion); // Reset for new question
      timer = setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime <= 1) {
            clearInterval(timer);
            if(userAnswer === undefined){ 
              handleAnswer(""); // Mark as incorrect if time runs out
            }
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
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
      if (userAnswer && e.key === 'ArrowRight') {
        goToNext();
      } else if (e.key === 'ArrowLeft') {
        goToPrevious();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrevious, userAnswer]);

  useEffect(() => {
    if(timerEnabled && timeLeft <= 0 && !userAnswer) {
      goToNext();
    }
  }, [timeLeft, timerEnabled, userAnswer, goToNext]);
  
  const correctCount = useMemo(() => answers.filter(a => a.isCorrect).length, [answers]);
  const incorrectCount = useMemo(() => answers.length - correctCount, [answers, correctCount]);
  
  const progress = (currentIndex / questions.length) * 100;
  const isQuizFinished = answers.length === questions.length;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-fade-in">
      <QuizHeader
        correctAnswers={correctCount}
        incorrectAnswers={incorrectCount}
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
           <AlertDialog>
              <AlertDialogTrigger asChild>
                  <Button size="lg">Finish & See Results</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                  <AlertDialogHeader>
                  <AlertDialogTitle>Finish Quiz?</AlertDialogTitle>
                  <AlertDialogDescription>
                      Are you sure you want to finish the quiz? Your session results will be calculated.
                  </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                  <AlertDialogCancel>Keep Practicing</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onQuizFinish(answers)}>
                      Finish Quiz
                  </AlertDialogAction>
                  </AlertDialogFooter>
              </AlertDialogContent>
          </AlertDialog>
        ) : (
          <Button onClick={goToNext} disabled={!userAnswer || currentIndex === questions.length -1}>
            Next <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

    