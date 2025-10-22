// lib/types.ts
export interface MCQ {
  question: string;
  options: string[];
  correct: string; // "A", "B", "C", or "D"
}

export interface QuizState {
  mcqs: MCQ[];
  currentIndex: number;
  score: number;
  finished: boolean;
}

// This type isn't in the prompt, but it is useful for the export component.
export interface ExportConfig {
    mcqs: MCQ[];
    score: number;
}
