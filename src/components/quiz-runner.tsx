'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Question, UserAnswer, AllProgress } from '@/lib/types';
import { useQuizStore } from '@/lib/store';
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
  onQuizFinish: () => void;
  onExit: () => void;
  timerEnabled: boolean;
  totalQuizQuestions: number;
}

const TOTAL_QUIZ_DURATION_HOURS = 3;
const MIN_TIME_PER_QUESTION_SECONDS = 59;

export default function QuizRunner({ questions, onQuizFinish, onExit, timerEnabled, totalQuizQuestions }: QuizRunnerProps) {
  const { activeQuizId, allProgress, setAnswer } = useQuizStore(state => ({
    activeQuizId: state.activeQuizId,
    allProgress: state.allProgress,
    setAnswer: state.setAnswer,
  }));
  
  const answersForQuiz = useMemo(() => {
    if (!activeQuizId || !allProgress[activeQuizId]) return [];
    const progress = allProgress[activeQuizId];
    return Object.values(progress).flatMap(p => p.answers);
  }, [activeQuizId, allProgress]);

  const answeredQuestionIds = useMemo(() => new Set(answersForQuiz.map(a => a.questionId)), [answersForQuiz]);
  
  const getFirstUnansweredIndex = useCallback(() => {
    const firstUnanswered = questions.findIndex(q => !answeredQuestionIds.has(q.question_id));
    return firstUnanswered === -1 ? 0 : firstUnanswered;
  }, [questions, answeredQuestionIds]);

  const [currentIndex, setCurrentIndex] = useState(getFirstUnansweredIndex());
  const [questionStartTime, setQuestionStartTime] = useState(0);

  const timePerQuestion = useMemo(() => {
    if (!timerEnabled || totalQuizQuestions === 0) return 0;
    const calculatedTime = (TOTAL_QUIZ_DURATION_HOURS * 3600) / totalQuizQuestions;
    return Math.max(calculatedTime, MIN_TIME_PER_QUESTION_SECONDS);
  }, [timerEnabled, totalQuizQuestions]);

  const [timeLeft, setTimeLeft] = useState(timePerQuestion);
  
  const currentQuestion = questions[currentIndex];
  const userAnswer = useMemo(() => {
    return answersForQuiz.find(a => a.questionId === currentQuestion?.question_id);
  }, [answersForQuiz, currentQuestion]);

  const handleAnswer = useCallback((selectedOptionId: string) => {
    if (!currentQuestion) return;
    if (answersForQuiz.some(a => a.questionId === currentQuestion.question_id)) return;

    const responseTime = Date.now() - questionStartTime;
    const isCorrect = currentQuestion.correct_answer === selectedOptionId;
    
    setAnswer(currentQuestion.question_id, selectedOptionId, isCorrect, responseTime);

  }, [currentQuestion, questionStartTime, answersForQuiz, setAnswer]);


  const goToNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }, [currentIndex, questions.length]);
  

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (timerEnabled && !userAnswer) {
      if (timeLeft <= 0) setTimeLeft(timePerQuestion);
      timer = setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime <= 1) {
            clearInterval(timer);
            if(!userAnswer){ 
              handleAnswer(""); 
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
  
  const correctCount = useMemo(() => answersForQuiz.filter(a => a.isCorrect).length, [answersForQuiz]);
  const incorrectCount = useMemo(() => answersForQuiz.filter(a => !a.isCorrect).length, [answersForQuiz]);
  
  const progress = (currentIndex / questions.length) * 100;

  const allQuestionsInScopeAnswered = useMemo(() => {
      return questions.every(q => answeredQuestionIds.has(q.question_id));
  }, [questions, answeredQuestionIds]);


  if (!currentQuestion) {
    return (
        <div className="flex flex-col items-center justify-center text-center py-20">
            <p className="text-lg text-muted-foreground">No questions available for this session.</p>
            <Button onClick={onExit} className="mt-4">Back to Dashboard</Button>
        </div>
    )
  }

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
        {allQuestionsInScopeAnswered ? (
           <AlertDialog>
              <AlertDialogTrigger asChild>
                  <Button size="lg">Finish & See Results</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                  <AlertDialogHeader>
                  <AlertDialogTitle>Finish Quiz?</AlertDialogTitle>
                  <AlertDialogDescription>
                      You have answered all questions. Are you sure you want to finish? Your session results will be calculated.
                  </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                  <AlertDialogCancel>Keep Reviewing</AlertDialogCancel>
                  <AlertDialogAction onClick={onQuizFinish}>
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