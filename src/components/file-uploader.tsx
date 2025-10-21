'use client';

import { useState, ChangeEvent } from 'react';
import type { Question } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast";
import { UploadCloud, FileJson } from 'lucide-react';

interface FileUploaderProps {
  onFileLoaded: (questions: Question[]) => void;
  isLoading: boolean;
}

export default function FileUploader({ onFileLoaded, isLoading }: FileUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.type !== 'application/json') {
      toast({
          variant: "destructive",
          title: "Invalid File",
          description: "Invalid file type. Please upload a JSON file.",
      });
      return;
    }
    setFile(selectedFile);
  };

  const handleProcessFile = () => {
    if (!file) {
      toast({
          variant: "destructive",
          title: "No file selected",
          description: "Please select a file to upload.",
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

        if (!Array.isArray(questions) || (questions.length > 0 && typeof questions[0].question_id === 'undefined')) {
          throw new Error('JSON format is invalid. It must be an array of questions or an object with a "questions" array.');
        }

        onFileLoaded(questions);
        setFile(null); // Reset after successful load
      } catch (err) {
        const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
        toast({
            variant: "destructive",
            title: "Parsing Error",
            description: `Could not parse the JSON file. ${message}`,
        });
      }
    };
    reader.onerror = () => {
        toast({
            variant: "destructive",
            title: "File Read Error",
            description: "Failed to read the file.",
        });
    }
    reader.readAsText(file);
  };
  
  return (
    <div className="space-y-4">
      {file ? (
          <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
            <div className='flex items-center gap-2'>
              <FileJson className="w-5 h-5 text-primary" />
              <span className='text-sm font-medium'>{file.name}</span>
            </div>
            <Button onClick={handleProcessFile} disabled={isLoading} size="sm">
              {isLoading ? 'Processing...' : 'Use this file'}
            </Button>
          </div>
      ) : (
        <div className="relative border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 flex flex-col items-center justify-center text-center">
            <UploadCloud className="w-12 h-12 text-muted-foreground/50"/>
            <p className="mt-4 text-sm text-muted-foreground">Drag and drop your JSON file here, or click to browse.</p>
            <Input
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
        </div>
      )}
    </div>
  );
}
