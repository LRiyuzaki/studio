'use client';

import type { Unit } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Book, RefreshCw } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface UnitCardProps {
  unit: Unit;
  onStartQuiz: (unitNumber: number) => void;
}

export default function UnitCard({ unit, onStartQuiz }: UnitCardProps) {
  // These are placeholders as per spec, since persistence is not required in Phase 1.
  // Real values would be calculated from past sessions.
  const completion = 0;
  const accuracy = 0;

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
            <span className="font-semibold">{completion}%</span>
          </div>
          <Progress value={completion} aria-label={`${completion}% completion`} />
        </div>
        <div>
          <div className="flex justify-between items-center mb-1 text-sm">
            <span className="font-medium text-muted-foreground">Accuracy</span>
            <span className="font-semibold">{accuracy}%</span>
          </div>
          <Progress value={accuracy} aria-label={`${accuracy}% accuracy`} />
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button onClick={() => onStartQuiz(unit.unitNumber)} className="w-full">
          Practice Unit
        </Button>
        <Button onClick={() => onStartQuiz(unit.unitNumber)} variant="outline" aria-label="Reset and practice again">
            <RefreshCw />
        </Button>
      </CardFooter>
    </Card>
  );
}
