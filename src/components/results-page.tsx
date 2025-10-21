'use client';

import { useState, useEffect } from 'react';
import type { SessionResult, PersonalizedStudySuggestionsOutput } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { RefreshCw, BrainCircuit, Loader2 } from 'lucide-react';
import { getStudySuggestions } from '@/lib/actions';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface ResultsPageProps {
  result: SessionResult;
  onRestart: () => void;
}

export default function ResultsPage({ result, onRestart }: ResultsPageProps) {
  const [suggestions, setSuggestions] = useState<PersonalizedStudySuggestionsOutput | null>(null);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (result.performanceByUnit.every(p => p.questionsAttempted === 0)) return;

      setIsLoadingSuggestions(true);
      setError(null);
      try {
        const response = await getStudySuggestions({ performanceData: result.performanceByUnit });
        setSuggestions(response);
      } catch (e) {
        setError("Could not fetch AI-powered study suggestions.");
        console.error(e);
      } finally {
        setIsLoadingSuggestions(false);
      }
    };
    fetchSuggestions();
  }, [result.performanceByUnit]);

  return (
    <div className="space-y-8 animate-fade-in">
      <header className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold font-headline">Session Results</h1>
          <p className="text-muted-foreground">Here's a breakdown of your performance.</p>
        </div>
        <Button onClick={onRestart} size="lg">
          <RefreshCw className="mr-2 h-4 w-4" />
          Practice Another Unit
        </Button>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
        <Card>
          <CardHeader><CardTitle>Accuracy</CardTitle></CardHeader>
          <CardContent><p className="text-4xl font-bold">{result.accuracy}%</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Correct</CardTitle></CardHeader>
          <CardContent><p className="text-4xl font-bold">{result.correctAnswers}/{result.attemptedQuestions}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Total XP</CardTitle></CardHeader>
          <CardContent><p className="text-4xl font-bold">{result.totalXP}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Questions</CardTitle></CardHeader>
          <CardContent><p className="text-4xl font-bold">{result.attemptedQuestions}/{result.totalQuestions}</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance by Unit</CardTitle>
          <CardDescription>Your accuracy across different study units.</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={result.performanceByUnit} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="studyUnit.name" tick={{ fontSize: 12 }} />
              <YAxis unit="%" />
              <Tooltip
                cursor={{fill: 'hsla(var(--primary), 0.1)'}}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  borderColor: 'hsl(var(--border))',
                  borderRadius: 'var(--radius)'
                }}
              />
              <Legend />
              <Bar dataKey="accuracy" fill="hsl(var(--primary))" name="Accuracy (%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BrainCircuit className="text-primary"/>
            AI-Powered Study Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingSuggestions && (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-4 text-muted-foreground">Analyzing your performance...</p>
            </div>
          )}
          {error && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
          {suggestions && suggestions.suggestedUnits.length > 0 && (
            <div className="space-y-4">
              {suggestions.suggestedUnits.map(unit => (
                <Alert key={unit.unitNumber}>
                  <AlertTitle>Review Unit {unit.unitNumber}: {unit.unitName}</AlertTitle>
                  <AlertDescription>{unit.reason}</AlertDescription>
                </Alert>
              ))}
            </div>
          )}
          {suggestions && suggestions.suggestedUnits.length === 0 && (
             <Alert>
                <AlertTitle>Great work!</AlertTitle>
                <AlertDescription>No specific weak areas were detected in this session. Keep up the consistent practice!</AlertDescription>
            </Alert>
          )}
           {!isLoadingSuggestions && !suggestions && !error && (
             <Alert>
                <AlertTitle>No Data to Analyze</AlertTitle>
                <AlertDescription>You didn't attempt any questions, so we can't generate suggestions. Try a quiz to get started!</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
