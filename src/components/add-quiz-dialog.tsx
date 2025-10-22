
'use client';

import { useState } from 'react';
import type { Question, Quiz } from '@/lib/types';
import { groupQuestionsIntoUnits } from '@/lib/quiz-parser';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle } from 'lucide-react';
import FileUploader from './file-uploader';
import { useToast } from '@/hooks/use-toast';

interface AddQuizDialogProps {
  /**
   * Callback function to be called when a new quiz is added.
   * @param quiz - The new quiz object.
   */
  onQuizAdded: (quiz: Quiz) => void;
}

/**
 * A dialog component for adding a new quiz.
 * It allows users to enter a quiz name and upload a JSON file with questions.
 */
export default function AddQuizDialog({ onQuizAdded }: AddQuizDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [quizName, setQuizName] = useState('');
    const [questions, setQuestions] = useState<Question[] | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    /**
     * Handles the file loaded event from the FileUploader component.
     * @param loadedQuestions - The questions loaded from the file.
     */
    const handleFileLoaded = (loadedQuestions: Question[] | null) => {
        setQuestions(loadedQuestions);
        if (loadedQuestions) {
          // This is a bit of a hack to get the file name, as File is not passed up.
          // A more robust solution might involve passing the File object itself.
          setFileName(quizName ? `${quizName}.json` : 'quiz.json'); 
        } else {
          setFileName(null);
        }
    };

    /**
     * Handles the add quiz button click.
     * It validates the form, creates a new quiz object, and calls the onQuizAdded callback.
     */
    const handleAddQuiz = () => {
        if (!quizName.trim()) {
            toast({ variant: "destructive", title: "Missing Name", description: "Please enter a name for the quiz." });
            return;
        }
        if (!questions) {
            toast({ variant: "destructive", title: "Missing File", description: "Please upload a quiz file." });
            return;
        }

        setIsLoading(true);
        try {
            const units = groupQuestionsIntoUnits(questions);
            const newQuiz: Quiz = {
                id: `quiz-${Date.now()}-${Math.random()}`,
                name: quizName,
                questions,
                units
            };
            onQuizAdded(newQuiz);
            resetAndClose();
        } catch (error) {
            const message = error instanceof Error ? error.message : "An unknown error occurred.";
            toast({ variant: "destructive", title: "Processing Error", description: message });
        } finally {
            setIsLoading(false);
        }
    };
    
    /**
     * Resets the dialog state and closes it.
     */
    const resetAndClose = () => {
        setQuizName('');
        setQuestions(null);
        setFileName(null);
        setIsOpen(false);
        setIsLoading(false);
    }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Quiz
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => {
          if (isLoading) e.preventDefault();
      }}>
        <DialogHeader>
          <DialogTitle>Add a New Quiz</DialogTitle>
          <DialogDescription>
            Give your new quiz a name and upload its JSON file.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Quiz Name
            </Label>
            <Input
              id="name"
              value={quizName}
              onChange={(e) => setQuizName(e.target.value)}
              className="col-span-3"
              placeholder="e.g. Biology 101"
              disabled={isLoading}
            />
          </div>
          <div className="grid grid-cols-4 items-start gap-4 pt-2">
            <Label htmlFor="picture" className="text-right pt-2">
              Quiz File
            </Label>
            <div className='col-span-3'>
                <FileUploader onFileLoaded={handleFileLoaded} isLoading={isLoading} fileName={fileName} />
            </div>
          </div>
        </div>
        <DialogFooter>
            <DialogClose asChild>
                <Button type="button" variant="secondary" onClick={resetAndClose} disabled={isLoading}>
                    Cancel
                </Button>
            </DialogClose>
          <Button type="submit" onClick={handleAddQuiz} disabled={isLoading || !quizName || !questions}>
            {isLoading ? "Adding..." : "Add Quiz"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
