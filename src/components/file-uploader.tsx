'use client';

import { useState, useRef, ChangeEvent } from 'react';
import type { Question } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UploadCloud } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Input } from './ui/input';

interface FileUploaderProps {
  onFileLoaded: (questions: Question[]) => void;
}

export default function FileUploader({ onFileLoaded }: FileUploaderProps) {
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/json') {
      const msg = 'Invalid file type. Please upload a JSON file.';
      setError(msg);
      toast({
          variant: "destructive",
          title: "Invalid File",
          description: msg,
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
            throw new Error("Failed to read file content.");
        }
        const data = JSON.parse(text);
        const questions = data.questions || data;

        if (!Array.isArray(questions)) {
          throw new Error('JSON must be an array of questions or an object with a "questions" array.');
        }

        if (questions.length > 0 && (!questions[0].question_id || !questions[0].options)) {
            throw new Error('Question format is invalid. Missing required fields.');
        }

        onFileLoaded(questions);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
        setError(`Error parsing JSON file: ${message}`);
        toast({
            variant: "destructive",
            title: "Parsing Error",
            description: `Could not parse the JSON file. ${message}`,
        });
      }
    };
    reader.onerror = () => {
        const message = "Failed to read the file.";
        setError(message);
        toast({
            variant: "destructive",
            title: "File Read Error",
            description: message,
        });
    }
    reader.readAsText(file);
  };
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh]">
      <Card className="w-full max-w-lg shadow-xl animate-fade-in">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-headline">QuizCraft Architect</CardTitle>
          <CardDescription>Upload your JSON quiz file to begin</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center space-y-4">
              <UploadCloud className="w-12 h-12 text-muted-foreground"/>
              <p className="text-center text-muted-foreground">Select a JSON file to start your quiz session.</p>
              <Input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                className="w-full text-sm text-slate-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-primary/10 file:text-primary
                    hover:file:bg-primary/20"
                />
          </div>
          {error && <p className="text-sm text-center text-destructive">{error}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
