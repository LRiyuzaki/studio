
'use client';

import { useState, ChangeEvent } from 'react';
import type { Question } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast";
import { UploadCloud, FileJson, X } from 'lucide-react';
import { Button } from './ui/button';

interface FileUploaderProps {
  /**
   * Callback function to be called when a file is loaded.
   * @param questions - The questions loaded from the file, or null if an error occurred.
   */
  onFileLoaded: (questions: Question[] | null) => void;
  /**
   * Whether the file uploader is in a loading state.
   */
  isLoading: boolean;
  /**
   * The name of the file that has been uploaded.
   */
  fileName: string | null;
}

/**
 * A component for uploading and processing JSON quiz files.
 */
export default function FileUploader({ onFileLoaded, isLoading, fileName }: FileUploaderProps) {
  const { toast } = useToast();

  /**
   * Handles the file input change event.
   * @param event - The change event.
   */
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (event.target.value) { // This ensures the onChange fires even if the same file is selected again
      event.target.value = '';
    }

    if (!selectedFile) {
        onFileLoaded(null);
        return;
    };

    if (selectedFile.type !== 'application/json') {
      toast({
          variant: "destructive",
          title: "Invalid File",
          description: "Invalid file type. Please upload a JSON file.",
      });
      onFileLoaded(null);
      return;
    }
    
    processFile(selectedFile);
  };
  
  /**
   * Processes the selected file.
   * @param file - The file to process.
   */
  const processFile = (file: File) => {
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
        
      } catch (err) {
        const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
        toast({
            variant: "destructive",
            title: "Parsing Error",
            description: `Could not parse the JSON file. ${message}`,
        });
        onFileLoaded(null);
      }
    };
    reader.onerror = () => {
        toast({
            variant: "destructive",
            title: "File Read Error",
            description: "Failed to read the file.",
        });
        onFileLoaded(null);
    }
    reader.readAsText(file);
  }

  /**
   * Resets the file uploader.
   */
  const handleReset = () => {
    onFileLoaded(null);
  }
  
  return (
    <div className="space-y-4">
      {fileName ? (
          <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
            <div className='flex items-center gap-2 overflow-hidden'>
              <FileJson className="w-5 h-5 text-primary flex-shrink-0" />
              <span className='text-sm font-medium truncate' title={fileName}>{fileName}</span>
            </div>
            <Button onClick={handleReset} disabled={isLoading} size="icon" variant="ghost" className="h-7 w-7">
              <X className='w-4 h-4'/>
              <span className="sr-only">Remove file</span>
            </Button>
          </div>
      ) : (
        <div className="relative border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 flex flex-col items-center justify-center text-center hover:border-primary transition-colors">
            <UploadCloud className="w-12 h-12 text-muted-foreground/50"/>
            <p className="mt-4 text-sm text-muted-foreground">Drag and drop or click to upload a JSON file.</p>
            <Input
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isLoading}
                data-testid="file-uploader"
            />
        </div>
      )}
    </div>
  );
}
