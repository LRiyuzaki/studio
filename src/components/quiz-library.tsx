'use client';

import type { Quiz } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Library, ArrowRight, Trash2, BookOpen, Clock } from 'lucide-react';
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
import { Badge } from './ui/badge';


interface QuizLibraryProps {
    quizzes: Quiz[];
    onSelectQuiz: (quizId: string) => void;
    onDeleteQuiz: (quizId: string) => void;
    isLoading?: boolean;
}

export default function QuizLibrary({ quizzes, onSelectQuiz, onDeleteQuiz, isLoading = false }: QuizLibraryProps) {
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-full" />
            </CardContent>
            <CardFooter>
              <Skeleton className="h-10 w-full" />
            </CardFooter>
          </Card>
        ))}
      </div>
    )
  }

  if (quizzes.length === 0) {
    return (
      <div className="text-center py-20 px-6 border-2 border-dashed rounded-lg bg-card">
          <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">Your library is empty</h3>
          <p className="mt-2 text-sm text-muted-foreground">Click "Add New Quiz" to get started.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {quizzes.map((quiz) => {
        const isPending = quiz.status === 'PENDING_SYNC';
        return (
          <Card key={quiz.id} className="flex flex-col transition-transform transform hover:-translate-y-1 hover:shadow-xl">
            <CardHeader>
              <CardTitle className="truncate">{quiz.name}</CardTitle>
              {isPending ? (
                <div className="flex items-center pt-1">
                  <Badge variant="secondary" className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3"/>
                    <span>Pending Generation</span>
                  </Badge>
                </div>
              ) : (
                <CardDescription>{quiz.questions.length} questions in {quiz.units.length} units</CardDescription>
              )}
            </CardHeader>
            <CardContent className="flex-grow">
              {/* Future content can go here, like progress */}
            </CardContent>
            <CardFooter className="flex justify-between items-center gap-2">
              <Button onClick={() => onSelectQuiz(quiz.id)} className="w-full" disabled={isPending}>
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
                      This action cannot be undone. This will permanently delete the "{quiz.name}" quiz and all its data.
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
        )
      })}
    </div>
  );
}
