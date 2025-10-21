'use client';

import type { Quiz } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Library, ArrowRight, Trash2, BookOpen } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"


interface QuizLibraryProps {
    quizzes: Quiz[];
    onSelectQuiz: (quizId: string) => void;
    onDeleteQuiz: (quizId: string) => void;
}

export default function QuizLibrary({ quizzes, onSelectQuiz, onDeleteQuiz }: QuizLibraryProps) {
  return (
    <div>
      {quizzes.length === 0 ? (
        <div className="text-center py-20 px-6 border-2 border-dashed rounded-lg bg-card">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">Your library is empty</h3>
            <p className="mt-2 text-sm text-muted-foreground">Click "Add New Quiz" to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {quizzes.map((quiz) => (
            <Card key={quiz.id} className="flex flex-col transition-transform transform hover:-translate-y-1 hover:shadow-xl">
              <CardHeader>
                <CardTitle>{quiz.name}</CardTitle>
                <CardDescription>{quiz.questions.length} questions in {quiz.units.length} units</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                {/* Future content can go here, like progress */}
              </CardContent>
              <CardFooter className="flex justify-between items-center gap-2">
                <Button onClick={() => onSelectQuiz(quiz.id)} className="w-full">
                  Open <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <Trash2 className='text-destructive h-5 w-5'/>
                        <span className='sr-only'>Delete {quiz.name}</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the "{quiz.name}" quiz.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onDeleteQuiz(quiz.id)} className="bg-destructive hover:bg-destructive/90">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
