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

  const getOptionVariant = (option: Option) => {
    if (userAnswer) {
      if (option.id === question.correct_answer) return 'default';
      if (option.id === userAnswer.selectedOptionId && !userAnswer.isCorrect) return "destructive";
      return "outline";
    }
    return option.id === selectedOptionId ? "secondary" : "outline";
  };
  
  const getOptionClassName = (option: Option) => {
    const variant = getOptionVariant(option);
    if (userAnswer) {
        if (variant === 'default') {
            return 'border-green-500 bg-green-100 text-green-900 dark:bg-green-900/30 dark:text-green-200 dark:border-green-700';
        }
        if (variant === 'destructive') {
            return 'border-red-500 bg-red-100 text-red-900 dark:bg-red-900/30 dark:text-red-200 dark:border-red-700';
        }
        return 'opacity-60';
    }
    return 'hover:bg-accent/80'
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardDescription>Topic: {question.topic}</CardDescription>
        <CardTitle className="text-xl leading-relaxed">{question.question_text}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {question.options.map((option) => (
          <Button
            key={option.id}
            onClick={() => handleOptionClick(option.id)}
            disabled={!!userAnswer}
            variant={getOptionVariant(option)}
            className={cn(
                "w-full h-auto justify-start text-left py-3 whitespace-normal transition-all duration-300",
                getOptionClassName(option)
            )}
          >
            <span className="mr-4 font-bold">{option.id}.</span>
            <span>{option.text}</span>
          </Button>
        ))}
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
