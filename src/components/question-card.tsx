'use client';

import type { Question, UserAnswer, Option } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface QuestionCardProps {
  question: Question;
  onAnswer: (selectedOptionId: string) => void;
  userAnswer?: UserAnswer;
}

export default function QuestionCard({ question, onAnswer, userAnswer }: QuestionCardProps) {
  
  const handleOptionClick = (optionId: string) => {
    if (userAnswer) return;
    onAnswer(optionId);
  };

  const getOptionVariant = (option: Option): "default" | "destructive" | "outline" => {
    if (!userAnswer) {
        return "outline";
    }
    if (option.id === question.correct_answer) {
        return "default";
    }
    if (option.id === userAnswer.selectedOptionId) {
        return "destructive";
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
                userAnswer && getOptionVariant(option) === 'outline' && "opacity-60 hover:bg-accent/50",
                "transition-all duration-300"
            )}
          >
            <span className="mr-4 font-bold">{option.id}.</span>
            <span>{option.text}</span>
          </Button>
        ))}
      </CardContent>
      <AnimatePresence>
        {userAnswer && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.5 }}
            className="px-6 pb-6"
          >
            <div className="p-4 bg-muted/50 rounded-lg border">
                <h4 className="font-semibold mb-2 text-foreground">Explanation</h4>
                <p className="text-muted-foreground">{question.explanation}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
