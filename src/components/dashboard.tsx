
'use client';

import type { Quiz } from '@/lib/types';
import { Button } from '@/components/ui/button';
import UnitCard from './unit-card';
import { ArrowLeft, PlayCircle, RefreshCw } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui/card';
import { Progress } from './ui/progress';
import { useQuizStore } from '@/store/useQuizStore';

interface DashboardProps {
  /**
   * The quiz to display on the dashboard.
   */
  quiz: Quiz;
  /**
   * Callback function to be called when the user starts a quiz.
   * @param unitNumber - The unit number to start, or 'all' for a full quiz.
   * @param timerEnabled - Whether the timer is enabled for the session.
   */
  onStartQuiz: (unitNumber: number | 'all', timerEnabled: boolean) => void;
  /**
   * Callback function to be called when the user clicks the back button.
   */
  onBack: () => void;
  /**
   * Whether the timer is enabled.
   */
  timerEnabled: boolean;
  /**
   * Callback function to be called when the timer is toggled.
   * @param enabled - Whether the timer is enabled.
   */
  onTimerToggle: (enabled: boolean) => void;
  /**
   * Callback function to be called when the user resets their progress.
   * @param quizId - The ID of the quiz.
   * @param unitNumber - The unit number to reset, or 'all' to reset all units.
   */
  onResetProgress: (quizId: string, unitNumber: number | 'all') => void;
}

/**
 * A dashboard component for a single quiz.
 * It displays the quiz's units and allows the user to start a quiz session.
 */
export default function Dashboard({ quiz, onStartQuiz, onBack, timerEnabled, onTimerToggle, onResetProgress }: DashboardProps) {
  const { progress } = useQuizStore();
  const quizProgress = progress[quiz.id] || {};

  const allUnitsProgress = Object.values(quizProgress);
  const totalAnswered = allUnitsProgress.reduce((sum, p) => sum + p.answers.length, 0);
  const totalCompletion = quiz.questions.length > 0 ? (totalAnswered / quiz.questions.length) * 100 : 0;

  /**
   * Handles the start of a practice session.
   * @param unitNumber - The unit number to practice, or 'all' for a full quiz.
   */
  const handlePractice = (unitNumber: number | 'all') => {
      onStartQuiz(unitNumber, timerEnabled);
  }

  /**
   * Handles the reset of progress for a unit or the entire quiz.
   * @param e - The mouse event.
   * @param unitNumber - The unit number to reset, or 'all' to reset all units.
   */
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
                        quizId={quiz.id}
                        unit={unit}
                        onStartQuiz={() => handlePractice(unit.unitNumber)}
                        onReset={(e) => handleReset(e, unit.unitNumber)}
                    />
                ))}
            </div>
        </div>
    </div>
  );
}
