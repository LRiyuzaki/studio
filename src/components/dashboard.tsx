'use client';

import type { Quiz } from '@/lib/types';
import { Button } from '@/components/ui/button';
import UnitCard from './unit-card';
import { ArrowLeft } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

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
        <header className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
                <h1 className="text-4xl font-bold font-headline">{quiz.name}</h1>
                <p className="text-muted-foreground">Select a unit to practice or practice all questions.</p>
            </div>
            <div className="flex items-center gap-4">
                 <Button onClick={onBack} variant="outline">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>
                <div className="flex items-center space-x-2">
                    <Switch id="timer-mode" checked={timerEnabled} onCheckedChange={onTimerToggle} />
                    <Label htmlFor="timer-mode">Enable Timer</Label>
                </div>
                <Button onClick={() => onStartQuiz('all', timerEnabled)} size="lg">
                    Practice All Units
                </Button>
            </div>
        </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quiz.units.map((unit) => (
          <UnitCard key={unit.unitNumber} unit={unit} onStartQuiz={(unitNum) => onStartQuiz(unitNum, timerEnabled)} />
        ))}
      </div>
    </div>
  );
}
