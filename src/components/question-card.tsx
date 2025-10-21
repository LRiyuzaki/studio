'use client';

import type { Question, Option } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

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
        return 'border-green-500 bg-green-100 text-green-900 dark:bg-green-900/30 dark:text-green-200 dark:border-green-700';
      case 'incorrect':
        return 'border-red-500 bg-red-100 text-red-900 dark:bg-red-900/30 dark:text-red-200 dark:border-red-700';
      case 'secondary':
        return 'bg-secondary text-secondary-foreground border-primary';
      case 'outline':
        return userAnswer ? 'opacity-60' : 'hover:bg-accent/80';
      default:
        return '';
    }
  }

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
      <div className="px-6 pb-6">
        {!userAnswer && (
          <Button onClick={handleSubmit} disabled={!selectedOptionId} className="w-full">
            Submit
          </Button>
        )}
        <AnimatePresence>
          {userAnswer && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.5 }}
              className="pt-4"
            >
              <div className="p-4 bg-muted/50 rounded-lg border">
                  <h4 className="font-semibold mb-2 text-foreground">Explanation</h4>
                  <p className="text-muted-foreground">{question.explanation}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
}
