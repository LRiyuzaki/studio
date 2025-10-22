
'use client';

import type { Unit } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Book, RefreshCw, PlayCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useQuizStore } from '@/store/useQuizStore';

interface UnitCardProps {
  /**
   * The ID of the quiz.
   */
  quizId: string;
  /**
   * The unit to display.
   */
  unit: Unit;
  /**
   * Callback function to be called when the user starts the quiz.
   */
  onStartQuiz: () => void;
  /**
   * Callback function to be called when the user resets their progress.
   * @param e - The mouse event.
   */
  onReset: (e: React.MouseEvent) => void;
}

/**
 * A card component for displaying a single unit of a quiz.
 */
export default function UnitCard({ quizId, unit, onStartQuiz, onReset }: UnitCardProps) {
  const { progress } = useQuizStore();
  const unitProgress = progress[quizId]?.[unit.unitNumber];
  const completion = unitProgress?.completion || 0;
  const accuracy = unitProgress?.accuracy || 0;
  const isStarted = (unitProgress?.answers?.length || 0) > 0;

  return (
    <Card data-testid={`unit-card-${unit.unitNumber}`} className="flex flex-col transition-transform transform hover:-translate-y-1 hover:shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-start justify-between">
          <span className="font-headline">{`Unit ${unit.unitNumber}: ${unit.unitName}`}</span>
          <Book className="w-6 h-6 text-primary flex-shrink-0 ml-4" />
        </CardTitle>
        <CardDescription>{unit.totalQuestions} questions</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        <div>
          <div className="flex justify-between items-center mb-1 text-sm">
            <span className="font-medium text-muted-foreground">Completion</span>
            <span className="font-semibold">{completion.toFixed(0)}%</span>
          </div>
          <Progress value={completion} aria-label={`${completion}% completion`} />
        </div>
        <div>
          <div className="flex justify-between items-center mb-1 text-sm">
            <span className="font-medium text-muted-foreground">Accuracy</span>
            <span className="font-semibold">{accuracy.toFixed(0)}%</span>
          </div>
          <Progress value={accuracy} aria-label={`${accuracy}% accuracy`} />
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button onClick={onStartQuiz} className="w-full">
            <PlayCircle className="mr-2 h-4 w-4" />
            {isStarted ? 'Continue' : 'Practice'}
        </Button>
        <Button onClick={onReset} variant="outline" aria-label="Reset and practice again">
            <RefreshCw className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
