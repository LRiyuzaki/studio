'use client';

import type { Question, Option } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface QuestionCardProps {
  question: Question;
  onAnswer: (selectedOptionId: string) => void;
  userAnswer?: { selectedOptionId: string; isCorrect: boolean };
}

export default function QuestionCard({ question, onAnswer, userAnswer }: QuestionCardProps) {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

  const handleOptionClick = (optionId: string) => {
    if (userAnswer) return;
    setSelectedOptionId(optionId);
  };
  
  const handleSubmit = () => {
    if (selectedOptionId) {
        onAnswer(selectedOptionId);
    }
  };

  const getOptionVariant = (option: Option): "default" | "destructive" | "outline" | "secondary" => {
    if (userAnswer) {
      if (option.id === question.correct_answer) {
          return "default";
      }
      if (option.id === userAnswer.selectedOptionId) {
          return "destructive";
      }
      return "outline";
    }

    if (option.id === selectedOptionId) {
        return "secondary";
    }

    return "outline";
  };

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
                "w-full h-auto justify-start text-left py-3 whitespace-normal",
                !userAnswer && "hover:bg-accent/80",
                userAnswer && getOptionVariant(option) === 'outline' && "opacity-60",
                "transition-all duration-300"
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
              className="pt-2"
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
