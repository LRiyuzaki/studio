'use client';

import type { Unit } from '@/lib/types';
import { Button } from '@/components/ui/button';
import UnitCard from './unit-card';
import { ArrowLeft } from 'lucide-react';

interface DashboardProps {
  units: Unit[];
  onStartQuiz: (unitNumber: number | 'all') => void;
  onReset: () => void;
}

export default function Dashboard({ units, onStartQuiz, onReset }: DashboardProps) {
  return (
    <div className="space-y-8 animate-fade-in">
        <header className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
                <h1 className="text-4xl font-bold font-headline">Study Dashboard</h1>
                <p className="text-muted-foreground">Select a unit to practice or practice all questions.</p>
            </div>
            <div className="flex gap-2">
                 <Button onClick={onReset} variant="outline">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Upload New File
                </Button>
                <Button onClick={() => onStartQuiz('all')} size="lg">
                    Practice All Units
                </Button>
            </div>
        </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {units.map((unit) => (
          <UnitCard key={unit.unitNumber} unit={unit} onStartQuiz={onStartQuiz} />
        ))}
      </div>
    </div>
  );
}
