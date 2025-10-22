'use client';

import type { Quiz, UnitProgress } from '@/lib/types';
import { Button } from '@/components/ui/button';
import UnitCard from './unit-card';
import { ArrowLeft, PlayCircle, RefreshCw } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui/card';
import { Progress } from './ui/progress';

interface DashboardProps {
  /** The quiz object to be displayed on the dashboard. */
  quiz: Quiz;
  /** Callback function to be invoked when the user starts a quiz session. */
  onStartQuiz: (unitNumber: number | 'all') => void;
  /** Callback function to be invoked when the user navigates back to the library. */
  onBack: () => void;
  /** A boolean indicating whether the timer is enabled for the quiz. */
  timerEnabled: boolean;
  /** Callback function to be invoked when the user toggles the timer. */
  onTimerToggle: (enabled: boolean) => void;
  /** An object containing the user's progress for each unit in the quiz. */
  progress: UnitProgress;
  /** Callback function to be invoked when the user resets their progress for a unit or the entire quiz. */
  onResetProgress: (quizId: string, unitNumber: number | 'all') => void;
}

/**
 * A dashboard component that displays the units of a quiz and allows the user to start a quiz session.
 * @param {DashboardProps} props The props for the component.
 * @returns {JSX.Element} The rendered Dashboard component.
 */
export default function Dashboard({ quiz, onStartQuiz, onBack, timerEnabled, onTimerToggle, progress, onResetProgress }: DashboardProps) {
  
  const allUnitsProgress = Object.values(progress);
  const totalAnswered = allUnitsProgress.reduce((sum, p) => sum + p.answers.length, 0);
  const totalCompletion = quiz.questions.length > 0 ? (totalAnswered / quiz.questions.length) * 100 : 0;

  const handlePractice = (unitNumber: number | 'all') => {
      onStartQuiz(unitNumber);
  }

  const handleReset = (e: React.MouseEvent, unitNumber: number | 'all') => {
      e.stopPropagation();
      onResetProgress(quiz.id, unitNumber);
  }

  return (
    <div className="space-y-8 animate-fade-in">
        <header className="flex flex-col md:flex-row items-start justify-between gap-4">
            <div>
                <Button onClick={onBack} variant="ghost" className="mb-2 -ml-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Library
                </Button>
                <h1 className="text-4xl font-bold font-headline">{quiz.name}</h1>
                <p className="text-muted-foreground mt-1">Select a unit to practice or start a full quiz session.</p>
            </div>
        </header>

        <Card className='bg-primary/5'>
          <CardHeader>
              <CardTitle>Full Quiz Session</CardTitle>
              <CardDescription>Practice all {quiz.questions.length} questions from all {quiz.units.length} units.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mb-1 text-sm">
                <span className="font-medium text-muted-foreground">Overall Completion</span>
                <span className="font-semibold">{totalCompletion.toFixed(0)}%</span>
            </div>
            <Progress value={totalCompletion} />
          </CardContent>
          <CardFooter className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              <div className="flex items-center space-x-2">
                  <Switch id="timer-mode" checked={timerEnabled} onCheckedChange={onTimerToggle} />
                  <Label htmlFor="timer-mode">Enable Timer</Label>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => handlePractice('all')} size="lg" className="flex-grow">
                    <PlayCircle className="mr-2 h-5 w-5" />
                    {totalAnswered > 0 ? 'Continue Practice' : 'Practice All Units'}
                </Button>
                <Button onClick={(e) => handleReset(e, 'all')} variant="outline" aria-label="Reset and practice again">
                    <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
          </CardFooter>
        </Card>

        <div>
            <h2 className="text-2xl font-bold font-headline mb-4">Practice by Unit</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {quiz.units.map((unit) => (
                    <UnitCard 
                        key={unit.unitNumber} 
                        unit={unit}
                        progress={progress[unit.unitNumber]} 
                        onStartQuiz={() => handlePractice(unit.unitNumber)}
                        onReset={(e) => handleReset(e, unit.unitNumber)}
                    />
                ))}
            </div>
        </div>
    </div>
  );
}
