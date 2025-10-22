'use client';

import type { Quiz, UnitProgress } from '@/lib/types';
import { Button } from '@/components/ui/button';
import UnitCard from './unit-card';
import { ArrowLeft, PlayCircle, RefreshCw } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui/card';
import { Progress } from './ui/progress';
import { Skeleton } from './ui/skeleton';

interface DashboardProps {
  quiz: Quiz;
  onStartQuiz: (unitNumber: number | 'all') => void;
  onBack: () => void;
  timerEnabled: boolean;
  onTimerToggle: (enabled: boolean) => void;
  progress: UnitProgress;
  onResetProgress: (quizId: string, unitNumber: number | 'all') => void;
  overallProgress: number;
  isLoading: boolean;
}

export default function Dashboard({ quiz, onStartQuiz, onBack, timerEnabled, onTimerToggle, progress, onResetProgress, overallProgress, isLoading }: DashboardProps) {
  
  const totalAnswered = Object.values(progress).reduce((sum, p) => sum + p.answers.length, 0);

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
             {isLoading ? (
                <div className="space-y-2">
                    <div className="flex justify-between items-center mb-1 text-sm">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-4 w-1/6" />
                    </div>
                    <Skeleton className="h-4 w-full" />
                </div>
            ) : (
                <>
                <div className="flex justify-between items-center mb-1 text-sm">
                    <span className="font-medium text-muted-foreground">Overall Completion</span>
                    <span className="font-semibold">{overallProgress.toFixed(0)}%</span>
                </div>
                <Progress value={overallProgress} />
                </>
            )}
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
                {isLoading ? (
                    Array.from({ length: quiz.units.length || 3 }).map((_, i) => (
                        <Card key={i}>
                            <CardHeader>
                                <Skeleton className="h-6 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-full" />
                                </div>
                                <div className="space-y-2">
                                     <Skeleton className="h-4 w-full" />
                                     <Skeleton className="h-4 w-full" />
                                </div>
                            </CardContent>
                            <CardFooter className="flex gap-2">
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-10" />
                            </CardFooter>
                        </Card>
                    ))
                ) : (
                    quiz.units.map((unit) => (
                        <UnitCard 
                            key={unit.unitNumber} 
                            unit={unit}
                            progress={progress[unit.unitNumber]} 
                            onStartQuiz={() => handlePractice(unit.unitNumber)}
                            onReset={(e) => handleReset(e, unit.unitNumber)}
                        />
                    ))
                )}
            </div>
        </div>
    </div>
  );
}
