'use client';

import type { Quiz } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Library, ArrowRight, Trash2 } from 'lucide-react';
import AddQuizDialog from './add-quiz-dialog';

interface QuizLibraryProps {
    quizzes: Quiz[];
    onQuizAdded: (quiz: Quiz) => void;
    onSelectQuiz: (quizId: string) => void;
    onDeleteQuiz: (quizId: string) => void;
}

export default function QuizLibrary({ quizzes, onQuizAdded, onSelectQuiz, onDeleteQuiz }: QuizLibraryProps) {
  return (
    <div className="space-y-8 animate-fade-in">
      <header className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold font-headline">My Quiz Library</h1>
          <p className="text-muted-foreground">Select a quiz to start studying or add a new one.</p>
        </div>
        <AddQuizDialog onQuizAdded={onQuizAdded} />
      </header>

      {quizzes.length === 0 ? (
        <div className="text-center py-20 px-6 border-2 border-dashed rounded-lg">
            <Library className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">Your library is empty</h3>
            <p className="mt-2 text-sm text-muted-foreground">Click "Add New Quiz" to upload your first set of questions.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => (
            <Card key={quiz.id} className="flex flex-col transition-transform transform hover:-translate-y-1 hover:shadow-xl">
              <CardHeader>
                <CardTitle>{quiz.name}</CardTitle>
                <CardDescription>{quiz.questions.length} questions in {quiz.units.length} units</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                {/* Future content can go here, like progress */}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button onClick={() => onSelectQuiz(quiz.id)} className="w-full">
                  Open Quiz <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onDeleteQuiz(quiz.id); }}>
                    <Trash2 className='text-destructive h-5 w-5'/>
                    <span className='sr-only'>Delete {quiz.name}</span>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
