'use client';

import type { Quiz } from '@/lib/types';
import { Button } from '@/components/ui/button';
import UnitCard from './unit-card';
import { ArrowLeft, PlayCircle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';

interface DashboardProps {
  quiz: Quiz;
  onStartQuiz: (unitNumber: number | 'all', timerEnabled: boolean) => void;
  onBack: () => void;
  timerEnabled: boolean;
  onTimerToggle: (enabled: boolean) => void;
}

export default function Dashboard({ quiz, onStartQuiz, onBack, timerEnabled, onTimerToggle }: DashboardProps) {
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
          <CardContent className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-2">
                  <Switch id="timer-mode" checked={timerEnabled} onCheckedChange={onTimerToggle} />
                  <Label htmlFor="timer-mode">Enable Timer</Label>
              </div>
              <Button onClick={() => onStartQuiz('all', timerEnabled)} size="lg">
                  <PlayCircle className="mr-2 h-5 w-5" />
                  Practice All Units
              </Button>
          </CardContent>
        </Card>

        <div>
            <h2 className="text-2xl font-bold font-headline mb-4">Practice by Unit</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {quiz.units.map((unit) => (
                <UnitCard key={unit.unitNumber} unit={unit} onStartQuiz={(unitNum) => onStartQuiz(unitNum, timerEnabled)} />
                ))}
            </div>
        </div>
    </div>
  );
}
