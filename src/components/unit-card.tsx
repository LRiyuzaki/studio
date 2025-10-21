'use client';

import type { Unit, QuizProgress } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Book, RefreshCw, PlayCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface UnitCardProps {
  unit: Unit;
  progress?: QuizProgress;
  onStartQuiz: () => void;
  onReset: (e: React.MouseEvent) => void;
}

export default function UnitCard({ unit, progress, onStartQuiz, onReset }: UnitCardProps) {
  const completion = progress?.completion || 0;
  const accuracy = progress?.accuracy || 0;
  const isStarted = (progress?.answers?.length || 0) > 0;

  return (
    <Card className="flex flex-col transition-transform transform hover:-translate-y-1 hover:shadow-xl">
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
