'use client';

import { useState } from 'react';
import type { Quiz } from '@/lib/types';
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
import { useToast } from '@/hooks/use-toast';
import { Textarea } from './ui/textarea';

interface AddQuizDialogProps {
  onQuizAdded: (quiz: Quiz) => void;
}

export default function AddQuizDialog({ onQuizAdded }: AddQuizDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [quizName, setQuizName] = useState('');
    const [sourceText, setSourceText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleAddQuiz = () => {
        if (!quizName.trim()) {
            toast({ variant: "destructive", title: "Missing Name", description: "Please enter a name for the quiz." });
            return;
        }
        if (!sourceText.trim()) {
            toast({ variant: "destructive", title: "Missing Source Text", description: "Please provide some text to generate the quiz from." });
            return;
        }

        setIsLoading(true);
        try {
            const newQuiz: Quiz = {
                id: `quiz-${Date.now()}-${Math.random()}`,
                name: quizName,
                questions: [],
                units: [],
                status: 'PENDING_SYNC', // Mark for generation
                sourceText: sourceText,
            };
            onQuizAdded(newQuiz);
            resetAndClose();
        } catch (error) {
            const message = error instanceof Error ? error.message : "An unknown error occurred.";
            toast({ variant: "destructive", title: "Error", description: message });
        } finally {
            setIsLoading(false);
        }
    };
    
    const resetAndClose = () => {
        setQuizName('');
        setSourceText('');
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
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => {
          if (isLoading) e.preventDefault();
      }}>
        <DialogHeader>
          <DialogTitle>Generate a New Quiz</DialogTitle>
          <DialogDescription>
            Enter a name and the source content. The AI will generate questions for you.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Quiz Name
            </Label>
            <Input
              id="name"
              value={quizName}
              onChange={(e) => setQuizName(e.target.value)}
              placeholder="e.g. Biology 101"
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="source-text">
              Source Text
            </Label>
            <Textarea
              id="source-text"
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              className="min-h-[200px]"
              placeholder="Paste the text you want to create a quiz from..."
              disabled={isLoading}
            />
          </div>
        </div>
        <DialogFooter>
            <DialogClose asChild>
                <Button type="button" variant="secondary" onClick={resetAndClose} disabled={isLoading}>
                    Cancel
                </Button>
            </DialogClose>
          <Button type="submit" onClick={handleAddQuiz} disabled={isLoading || !quizName || !sourceText}>
            {isLoading ? "Queueing..." : "Generate Quiz"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
