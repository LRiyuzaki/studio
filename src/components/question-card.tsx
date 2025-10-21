'use client';

import type { Question, Option } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

interface QuestionCardProps {
  question: Question;
  onAnswer: (selectedOptionId: string) => void;
  userAnswer?: { selectedOptionId: string; isCorrect: boolean };
}

export default function QuestionCard({ question, onAnswer, userAnswer }: QuestionCardProps) {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

  // Reset local selection when question changes
  useEffect(() => {
    setSelectedOptionId(null);
  }, [question]);

  const handleOptionClick = (optionId: string) => {
    if (userAnswer) return;
    setSelectedOptionId(optionId);
  };
  
  const handleSubmit = () => {
    if (selectedOptionId) {
        onAnswer(selectedOptionId);
    }
  };

  const getOptionVariant = (optionId: string) => {
    if (userAnswer) {
      // After answer is submitted
      const isCorrect = optionId === question.correct_answer;
      const isSelected = optionId === userAnswer.selectedOptionId;

      if (isCorrect) return 'correct';
      if (isSelected && !userAnswer.isCorrect) return 'incorrect';
      return 'outline';
    } else {
      // Before answer is submitted
      return optionId === selectedOptionId ? 'secondary' : 'outline';
    }
  };
  
  const getOptionClassName = (variant: string) => {
    switch (variant) {
      case 'correct':
        return 'bg-green-100 border-green-500 text-green-900 dark:bg-green-900/30 dark:border-green-700 dark:text-green-200';
      case 'incorrect':
        return 'bg-red-100 border-red-500 text-red-900 dark:bg-red-900/30 dark:border-red-700 dark:text-red-200';
      case 'secondary':
        return 'bg-secondary border-primary/50 text-secondary-foreground';
      case 'outline':
        return userAnswer ? 'opacity-50' : 'hover:bg-accent/80';
      default:
        return '';
    }
  }

  const correctOptionText = question.options.find(o => o.id === question.correct_answer)?.text;

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardDescription>Topic: {question.topic}</CardDescription>
        <CardTitle className="text-xl leading-relaxed">{question.question_text}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {question.options.map((option) => {
          const variant = getOptionVariant(option.id);
          return (
            <Button
              key={option.id}
              onClick={() => handleOptionClick(option.id)}
              disabled={!!userAnswer}
              variant={'outline'} // Base variant, we apply custom styles via cn
              className={cn(
                  "w-full h-auto justify-start text-left py-3 whitespace-normal transition-all duration-300",
                  getOptionClassName(variant)
              )}
            >
              <span className="mr-4 font-bold">{option.id}.</span>
              <span>{option.text}</span>
            </Button>
          )
        })}
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-4">
        {!userAnswer && (
          <Button onClick={handleSubmit} disabled={!selectedOptionId} className="w-full">
            Submit
          </Button>
        )}
        <AnimatePresence>
          {userAnswer && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: '1rem' }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="w-full space-y-4"
            >
                {userAnswer.isCorrect ? (
                    <div className="w-full p-4 rounded-lg bg-green-100 dark:bg-green-900/30 border border-green-500 dark:border-green-700">
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                            <h4 className="font-semibold text-lg text-green-900 dark:text-green-200">Correct!</h4>
                        </div>
                    </div>
                ) : (
                    <div className="w-full p-4 rounded-lg bg-red-100 dark:bg-red-900/30 border border-red-500 dark:border-red-700">
                        <div className="flex items-center gap-3">
                            <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                            <h4 className="font-semibold text-lg text-red-900 dark:text-red-200">Incorrect</h4>
                        </div>
                        <p className="mt-2 text-red-800 dark:text-red-300">
                            The correct answer was <span className="font-semibold">{question.correct_answer}: {correctOptionText}</span>.
                        </p>
                    </div>
                )}

              <div className="p-4 bg-muted/50 rounded-lg border">
                  <h4 className="font-semibold mb-2 text-foreground">Explanation</h4>
                  <p className="text-muted-foreground">{question.explanation}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardFooter>
    </Card>
  );
}
